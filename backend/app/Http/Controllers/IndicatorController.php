<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IndicatorController extends Controller
{
    public function __construct(private readonly ActivityLogger $logger)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Indicator::query()->orderByDesc('created_at');

        if ($request->filled('region')) {
            $query->where('region', $request->string('region'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json($query->get()->map(function (Indicator $indicator) {
            return [
                'id' => $indicator->id,
                'name' => $indicator->name,
                'region' => $indicator->region,
                'capaian' => $indicator->capaian !== null ? (float) $indicator->capaian : null,
                'target' => $indicator->target !== null ? (float) $indicator->target : null,
                'status' => $indicator->status,
                'date' => $indicator->date,
                'created_at' => $indicator->created_at?->toIso8601String(),
                'updated_at' => $indicator->updated_at?->toIso8601String(),
            ];
        }));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'capaian' => ['nullable', 'numeric'],
            'target' => ['nullable', 'numeric'],
            'status' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
        ]);

        $data['status'] = $data['status']
            ?? (isset($data['capaian'], $data['target']) && $data['target'] != 0
                ? ((float) $data['capaian'] >= (float) $data['target'] ? 'Mencapai Target' : 'Tidak Mencapai Target')
                : null);

        $indicator = Indicator::create($data);

        $this->logger->log(
            'indicator.created',
            sprintf('Indikator "%s" ditambahkan.', $indicator->name),
            $request->user(),
            ['indicator_id' => $indicator->id]
        );

        return response()->json($this->transform($indicator), 201);
    }

    public function update(Request $request, Indicator $indicator): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'capaian' => ['nullable', 'numeric'],
            'target' => ['nullable', 'numeric'],
            'status' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
        ]);

        if (!array_key_exists('status', $data) && array_key_exists('capaian', $data) && array_key_exists('target', $data)) {
            $data['status'] = (float) ($data['capaian'] ?? $indicator->capaian) >= (float) ($data['target'] ?? $indicator->target)
                ? 'Mencapai Target'
                : 'Tidak Mencapai Target';
        }

        $indicator->update($data);

        $this->logger->log(
            'indicator.updated',
            sprintf('Indikator "%s" diperbarui.', $indicator->name),
            $request->user(),
            ['indicator_id' => $indicator->id]
        );

        return response()->json($this->transform($indicator->fresh()));
    }

    public function destroy(Indicator $indicator): JsonResponse
    {
        $indicator->delete();

        $this->logger->log(
            'indicator.deleted',
            sprintf('Indikator "%s" dihapus.', $indicator->name),
            request()->user(),
            ['indicator_id' => $indicator->id]
        );

        return response()->json(['status' => 'ok']);
    }

    public function replace(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'items' => ['required', 'array'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.region' => ['nullable', 'string', 'max:255'],
            'items.*.capaian' => ['nullable', 'numeric'],
            'items.*.target' => ['nullable', 'numeric'],
            'items.*.status' => ['nullable', 'string', 'max:255'],
            'items.*.date' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($payload) {
            Indicator::query()->delete();

            $now = now();
            $records = collect($payload['items'])->map(function (array $row) use ($now) {
                $row['status'] = $row['status']
                    ?? (isset($row['capaian'], $row['target'])
                        ? ((float) $row['capaian'] >= (float) $row['target'] ? 'Mencapai Target' : 'Tidak Mencapai Target')
                        : null);

                return array_merge($row, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            })->all();

            if (!empty($records)) {
                Indicator::query()->insert($records);
            }
        });

        $fresh = Indicator::orderByDesc('created_at')->get();

        $this->logger->log(
            'indicator.bulk_replace',
            sprintf('Indikator diganti massal sebanyak %d entri.', $fresh->count()),
            request()->user(),
            ['count' => $fresh->count()]
        );

        return response()->json($fresh->map(fn (Indicator $indicator) => $this->transform($indicator)));
    }

    private function transform(Indicator $indicator): array
    {
        return [
            'id' => $indicator->id,
            'name' => $indicator->name,
            'region' => $indicator->region,
            'capaian' => $indicator->capaian !== null ? (float) $indicator->capaian : null,
            'target' => $indicator->target !== null ? (float) $indicator->target : null,
            'status' => $indicator->status,
            'date' => $indicator->date,
            'created_at' => $indicator->created_at?->toIso8601String(),
            'updated_at' => $indicator->updated_at?->toIso8601String(),
        ];
    }
}
