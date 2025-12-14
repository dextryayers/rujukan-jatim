<?php

namespace App\Http\Controllers;

use App\Models\AccreditationStat;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccreditationController extends Controller
{
    /**
     * @var ActivityLogger
     */
    private $logger;

    public function __construct(ActivityLogger $logger)
    {
        $this->logger = $logger;
    }

    public function index(Request $request): JsonResponse
    {
        $query = AccreditationStat::query();

        $yearFilter = $request->query('year');
        if ($yearFilter !== null && $yearFilter !== '') {
            $query->where('year', (int) $yearFilter);
        }

        $monthFilter = $request->query('month');
        if ($monthFilter !== null && $monthFilter !== '') {
            $query->where('month', (int) $monthFilter);
        }

        $regionFilter = $request->query('region');
        if ($regionFilter !== null && $regionFilter !== '') {
            $query->where('region', $regionFilter);
        } else {
            $query->whereNull('region');
        }

        $stat = $query
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderByDesc('recorded_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->first();

        if (!$stat) {
            return response()->json([
                'paripurna' => 0,
                'utama' => 0,
                'madya' => 0,
                'recorded_at' => null,
                'year' => null,
                'month' => null,
                'region' => null,
            ]);
        }

        return response()->json($this->transform($stat));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paripurna' => ['required', 'numeric', 'min:0'],
            'utama' => ['required', 'numeric', 'min:0'],
            'madya' => ['required', 'numeric', 'min:0'],
            'recorded_at' => ['nullable', 'date'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'region' => ['nullable', 'string', 'max:191'],
        ]);

        $year = array_key_exists('year', $data) ? $this->normalizeInteger($data['year']) : null;
        $month = array_key_exists('month', $data) ? $this->normalizeInteger($data['month']) : null;
        $region = array_key_exists('region', $data) ? $this->normalizeRegion($data['region']) : null;

        $attributes = [
            'year' => $year,
            'month' => $month,
            'region' => $region,
        ];

        $stat = AccreditationStat::firstOrNew($attributes);

        $stat->paripurna = (int) round((float) $data['paripurna']);
        $stat->utama = (int) round((float) $data['utama']);
        $stat->madya = (int) round((float) $data['madya']);
        $stat->recorded_at = $this->resolveRecordedAt($data, $year, $month);
        $stat->save();

        $this->logger->log(
            'akreditasi.updated',
            'Statistik akreditasi diperbarui.',
            $request->user(),
            $this->transform($stat)
        );

        return response()->json($this->transform($stat));
    }

    public function history(Request $request): JsonResponse
    {
        $query = AccreditationStat::query();

        $region = $request->query('region');
        if ($region !== null && $region !== '') {
            $query->where('region', $region);
        }

        if ($request->filled('year')) {
            $query->where('year', (int) $request->query('year'));
        }

        $month = $request->query('month');
        if ($month !== null && $month !== '') {
            $query->where('month', (int) $month);
        }

        $limit = (int) $request->query('limit', 120);
        if ($limit < 1) {
            $limit = 1;
        }
        if ($limit > 500) {
            $limit = 500;
        }

        $rows = $query
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderByDesc('recorded_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function (AccreditationStat $stat) {
                return $this->transform($stat);
            })
            ->values();

        return response()->json($rows);
    }

    private function transform(AccreditationStat $stat): array
    {
        return [
            'id' => $stat->id,
            'paripurna' => (int) $stat->paripurna,
            'utama' => (int) $stat->utama,
            'madya' => (int) $stat->madya,
            'recorded_at' => $stat->recorded_at ? $stat->recorded_at->toIso8601String() : null,
            'year' => $stat->year,
            'month' => $stat->month,
            'region' => $stat->region,
            'updated_at' => $stat->updated_at ? $stat->updated_at->toIso8601String() : null,
            'created_at' => $stat->created_at ? $stat->created_at->toIso8601String() : null,
        ];
    }

    private function normalizeInteger($value)
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function normalizeRegion($value)
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function resolveRecordedAt(array $data, $normalizedYear = null, $normalizedMonth = null)
    {
        if (!empty($data['recorded_at'])) {
            return Carbon::parse($data['recorded_at']);
        }

        if ($normalizedYear !== null && $normalizedMonth !== null) {
            return Carbon::create($normalizedYear, $normalizedMonth, 1, 0, 0, 0);
        }

        return Carbon::now();
    }
}
