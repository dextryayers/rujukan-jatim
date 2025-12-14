<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\PublicDocument;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public const PROFILE_PHOTO_CATEGORY = 'profile-photo';

    /** @var ActivityLogger */
    protected $logger;

    public function __construct(ActivityLogger $logger)
    {
        $this->logger = $logger;
    }

    public function index(Request $request): JsonResponse
    {
        $includeProfile = $request->boolean('include_profile');

        $publicDocs = PublicDocument::query()
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (PublicDocument $doc) {
                return $this->transformPublic($doc);
            });

        if ($includeProfile) {
            $profileDocs = Document::query()
                ->where('category', self::PROFILE_PHOTO_CATEGORY)
                ->orderByDesc('created_at')
                ->get()
                ->map(function (Document $doc) {
                    return $this->transformLegacy($doc);
                });

            $documents = $profileDocs->merge($publicDocs);
        } else {
            $documents = $publicDocs;
        }

        $sorted = $documents->sortByDesc(function (array $doc) {
            return $doc['published_at']
                ?? $doc['updated_at']
                ?? $doc['created_at']
                ?? null;
        })->values();

        return response()->json($sorted);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,csv,ppt,pptx,txt,rtf,odt,ods,odp,jpg,jpeg,jpe,jfif,png,svg,webp,zip,rar',
                'max:204800', // 200 MB
            ],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'public');

        $isProfile = ($data['category'] ?? null) === self::PROFILE_PHOTO_CATEGORY;

        if ($isProfile) {
            $document = Document::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'category' => self::PROFILE_PHOTO_CATEGORY,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);

            $this->refreshLegacyUrl($document);
            $document->save();
            $document->refresh();

            if ($request->user()) {
                /** @var User $user */
                $user = $request->user();
                $user->photo_url = $document->file_url;
                $user->save();
            }

            $this->logger->log(
                'document.created',
                sprintf('Dokumen "%s" diunggah.', $document->title),
                $request->user(),
                ['document_id' => $document->id]
            );

            return response()->json($this->transformLegacy($document), 201);
        }

        $public = PublicDocument::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? null,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'file_url' => null,
            'published_at' => now(),
            'created_by' => $request->user() ? $request->user()->id : null,
        ]);

        $this->refreshPublicDocumentUrl($public);
        $public->save();
        $public->refresh();

        $this->logger->log(
            'document.created',
            sprintf('Dokumen "%s" diunggah.', $public->title),
            $request->user(),
            ['document_id' => $public->id]
        );

        return response()->json($this->transformPublic($public), 201);
    }

    public function update(Request $request, $documentId): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'file' => [
                'sometimes',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,csv,ppt,pptx,txt,rtf,odt,ods,odp,jpg,jpeg,jpe,jfif,png,svg,webp,zip,rar',
                'max:204800',
            ],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $document = Document::find($documentId);
        if ($document) {
            return $this->updateLegacyDocument($request, $document, $data);
        }

        $public = PublicDocument::findOrFail($documentId);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('documents', 'public');

            if ($public->file_path) {
                Storage::disk('public')->delete($public->file_path);
            }

            $public->fill([
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }

        if (array_key_exists('title', $data)) {
            $public->title = $data['title'] ?? $public->title;
        }
        if (array_key_exists('description', $data)) {
            $public->description = $data['description'];
        }
        if (array_key_exists('category', $data)) {
            $public->category = $data['category'];
        }

        if (!$public->published_at) {
            $public->published_at = now();
        }

        $this->refreshPublicDocumentUrl($public);
        $public->save();
        $public->refresh();

        $this->logger->log(
            'document.updated',
            sprintf('Dokumen publik "%s" diperbarui.', $public->title),
            $request->user(),
            ['document_id' => $public->id, 'storage' => 'public']
        );

        return response()->json($this->transformPublic($public));
    }

    public function destroy($documentId): JsonResponse
    {
        $document = Document::find($documentId);
        if ($document) {
            return $this->destroyLegacyDocument($document);
        }

        $public = PublicDocument::findOrFail($documentId);

        if ($public->file_path) {
            Storage::disk('public')->delete($public->file_path);
        }

        $public->delete();

        $this->logger->log(
            'document.deleted',
            sprintf('Dokumen publik "%s" dihapus.', $public->title),
            request()->user(),
            ['document_id' => $public->id, 'storage' => 'public']
        );

        return response()->json(['status' => 'ok']);
    }

    private function updateLegacyDocument(Request $request, Document $document, array $data): JsonResponse
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('documents', 'public');

            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->fill([
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }

        if (array_key_exists('title', $data)) {
            $document->title = $data['title'];
        }
        if (array_key_exists('description', $data)) {
            $document->description = $data['description'];
        }
        if (array_key_exists('category', $data)) {
            $document->category = $data['category'];
        }

        $this->refreshLegacyUrl($document);
        $document->save();
        $document->refresh();

        $this->logger->log(
            'document.updated',
            sprintf('Dokumen "%s" diperbarui.', $document->title),
            $request->user(),
            ['document_id' => $document->id]
        );

        return response()->json($this->transformLegacy($document));
    }

    private function destroyLegacyDocument(Document $document): JsonResponse
    {
        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        $this->logger->log(
            'document.deleted',
            sprintf('Dokumen "%s" dihapus.', $document->title),
            request()->user(),
            ['document_id' => $document->id]
        );

        return response()->json(['status' => 'ok']);
    }

    public function download(Document $document)
    {
        if ($document->category !== self::PROFILE_PHOTO_CATEGORY) {
            return response()->json(['error' => 'not_supported'], 400);
        }

        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['error' => 'file_not_found'], 404);
        }

        return Storage::disk('public')->download($document->file_path, $document->file_name);
    }

    private function transformLegacy(Document $document): array
    {
        $downloadUrl = $document->file_path ? route('documents.download', ['document' => $document->id]) : null;
        $fileUrl = $document->file_url ?: $downloadUrl;

        return [
            'id' => $document->id,
            'title' => $document->title,
            'description' => $document->description,
            'category' => $document->category,
            'file_url' => $fileUrl,
            'download_url' => $downloadUrl,
            'file_name' => $document->file_name,
            'mime_type' => $document->mime_type,
            'file_size' => $document->file_size,
            'photo_url' => $document->category === self::PROFILE_PHOTO_CATEGORY ? $fileUrl : null,
            'created_at' => $document->created_at ? $document->created_at->toIso8601String() : null,
            'updated_at' => $document->updated_at ? $document->updated_at->toIso8601String() : null,
            'storage' => 'legacy',
        ];
    }

    private function transformPublic(PublicDocument $document): array
    {
        $fileUrl = $document->file_url
            ?: ($document->file_path && Storage::disk('public')->exists($document->file_path)
                ? Storage::disk('public')->url($document->file_path)
                : null);

        return [
            'id' => $document->id,
            'title' => $document->title,
            'description' => $document->description,
            'category' => $document->category,
            'file_url' => $fileUrl,
            'download_url' => $fileUrl,
            'file_name' => $document->file_name,
            'mime_type' => $document->mime_type,
            'file_size' => $document->file_size,
            'created_at' => $document->created_at ? $document->created_at->toIso8601String() : null,
            'updated_at' => $document->updated_at ? $document->updated_at->toIso8601String() : null,
            'published_at' => $document->published_at ? $document->published_at->toIso8601String() : null,
            'storage' => 'public',
        ];
    }

    private function refreshLegacyUrl(Document $document): void
    {
        if (!$document->file_path) {
            $document->file_url = null;
            return;
        }

        if (Storage::disk('public')->exists($document->file_path)) {
            $document->file_url = Storage::disk('public')->url($document->file_path);
            return;
        }

        $document->file_url = route('documents.download', ['document' => $document->id]);
    }

    private function refreshPublicDocumentUrl(PublicDocument $document): void
    {
        if (!$document->file_path) {
            $document->file_url = null;
            return;
        }

        if (Storage::disk('public')->exists($document->file_path)) {
            $document->file_url = Storage::disk('public')->url($document->file_path);
            return;
        }

        $document->file_url = $document->file_url ?: null;
    }
}
