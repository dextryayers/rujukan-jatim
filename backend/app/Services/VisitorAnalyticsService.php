<?php

namespace App\Services;

use App\Models\VisitorSession;
use App\Models\VisitorStat;
use Illuminate\Support\Str;

class VisitorAnalyticsService
{
    public function track(?string $sessionId, ?string $ipAddress, ?string $userAgent, bool $countView = false): array
    {
        $now = now();
        $today = $now->toDateString();

        $sessionId = $sessionId ?: Str::uuid()->toString();

        $session = VisitorSession::firstOrNew(['session_id' => $sessionId]);
        $isNewSession = !$session->exists;
        $isNewToday = $isNewSession || $session->last_counted_at !== $today;

        $session->ip_address = $ipAddress;
        $session->user_agent = $userAgent ? mb_substr($userAgent, 0, 500) : null;
        $session->last_seen = $now;
        $session->last_counted_at = $today;
        $session->save();

        $stat = VisitorStat::firstOrNew(['date' => $today]);
        if (!$stat->exists) {
            $stat->views = 0;
            $stat->unique_visitors = 0;
        }

        if ($isNewToday) {
            $stat->unique_visitors += 1;
        }

        if ($countView || $isNewToday) {
            $stat->views += 1;
        }

        $stat->save();

        $activeThreshold = $now->copy()->subMinutes(5);
        $activeNow = VisitorSession::where('last_seen', '>=', $activeThreshold)->count();

        return [
            'session_id' => $sessionId,
            'active_now' => $activeNow,
            'today' => [
                'date' => $today,
                'views' => (int) $stat->views,
                'unique_visitors' => (int) $stat->unique_visitors,
            ],
        ];
    }

    public function recentStats(int $days = 14)
    {
        $days = max(1, min($days, 90));

        return VisitorStat::orderByDesc('date')
            ->take($days)
            ->get()
            ->sortBy('date')
            ->values()
            ->map(fn (VisitorStat $stat) => [
                'date' => $stat->date->toDateString(),
                'views' => (int) $stat->views,
                'unique_visitors' => (int) $stat->unique_visitors,
            ]);
    }

    public function currentSummary(): array
    {
        $now = now();
        $today = $now->toDateString();

        $stat = VisitorStat::firstWhere('date', $today);

        $activeThreshold = $now->copy()->subMinutes(5);
        $activeNow = VisitorSession::where('last_seen', '>=', $activeThreshold)->count();

        return [
            'active_now' => $activeNow,
            'today' => [
                'date' => $today,
                'views' => (int) ($stat->views ?? 0),
                'unique_visitors' => (int) ($stat->unique_visitors ?? 0),
            ],
        ];
    }
}
