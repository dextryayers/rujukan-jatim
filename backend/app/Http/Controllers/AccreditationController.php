<?php

namespace App\Http\Controllers;

use App\Models\AccreditationStat;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccreditationController extends Controller
{
    public function __construct(private readonly ActivityLogger $logger)
    {
    }

    public function index(): JsonResponse
    {
        $stat = AccreditationStat::latest('recorded_at')->first()
            ?? AccreditationStat::latest('created_at')->first();

        if (!$stat) {
            return response()->json([
                'paripurna' => 0,
                'utama' => 0,
                'madya' => 0,
            ]);
        }

        return response()->json([
            'paripurna' => (int) $stat->paripurna,
            'utama' => (int) $stat->utama,
            'madya' => (int) $stat->madya,
            'recorded_at' => optional($stat->recorded_at)->toIso8601String(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paripurna' => ['required', 'integer', 'min:0'],
            'utama' => ['required', 'integer', 'min:0'],
            'madya' => ['required', 'integer', 'min:0'],
            'recorded_at' => ['nullable', 'date'],
        ]);

        $stat = AccreditationStat::create([
            'paripurna' => $data['paripurna'],
            'utama' => $data['utama'],
            'madya' => $data['madya'],
            'recorded_at' => $data['recorded_at'] ?? now(),
        ]);

        $this->logger->log(
            'akreditasi.updated',
            'Statistik akreditasi diperbarui.',
            $request->user(),
            [
                'paripurna' => $stat->paripurna,
                'utama' => $stat->utama,
                'madya' => $stat->madya,
                'recorded_at' => optional($stat->recorded_at)->toIso8601String(),
            ]
        );

        return response()->json([
            'paripurna' => (int) $stat->paripurna,
            'utama' => (int) $stat->utama,
            'madya' => (int) $stat->madya,
            'recorded_at' => optional($stat->recorded_at)->toIso8601String(),
        ]);
    }
}
