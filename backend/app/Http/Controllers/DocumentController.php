<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    private const PROFILE_PHOTO_CATEGORY = 'profile-photo';

    public function __construct(private readonly ActivityLogger $logger)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Document::query()->orderByDesc('created_at');

        if (!$request->boolean('include_profile')) {
            $query->where(function ($q) {
                $q->whereNull('category')
                    ->orWhere('category', '!=', self::PROFILE_PHOTO_CATEGORY);
            });
        }

        $documents = $query->get()->map(fn (Document $doc) => $this->transform($doc));

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'public');

        $document = Document::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? null,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
        ]);

        $this->refreshPublicUrl($document);
        $document->save();
        $document->refresh();

        $this->logger->log(
            'document.created',
            sprintf('Dokumen "%s" diunggah.', $document->title),
            $request->user(),
            ['document_id' => $document->id]
        );

        return response()->json($this->transform($document), 201);
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'file' => ['sometimes', 'file'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

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

        $this->refreshPublicUrl($document);
        $document->save();
        $document->refresh();

        $this->logger->log(
            'document.updated',
            sprintf('Dokumen "%s" diperbarui.', $document->title),
            $request->user(),
            ['document_id' => $document->id]
        );

        return response()->json($this->transform($document));
    }

    public function destroy(Document $document): JsonResponse
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
        if (!$document->file_path || !Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['error' => 'file_not_found'], 404);
        }

        return Storage::disk('public')->download($document->file_path, $document->file_name);
    }

    private function transform(Document $document): array
    {
        $fileUrl = $document->file_url ?: ($document->file_path ? route('documents.download', ['document' => $document->id]) : null);

        return [
            'id' => $document->id,
            'title' => $document->title,
            'description' => $document->description,
            'category' => $document->category,
            'file_url' => $fileUrl,
            'file_name' => $document->file_name,
            'mime_type' => $document->mime_type,
            'file_size' => $document->file_size,
            'photo_url' => $document->category === self::PROFILE_PHOTO_CATEGORY ? $fileUrl : null,
            'created_at' => $document->created_at?->toIso8601String(),
            'updated_at' => $document->updated_at?->toIso8601String(),
        ];
    }

    private function refreshPublicUrl(Document $document): void
    {
        if (!$document->file_path) {
            $document->file_url = null;
            return;
        }

        $document->file_url = route('documents.download', ['document' => $document->id]);
    }
}
