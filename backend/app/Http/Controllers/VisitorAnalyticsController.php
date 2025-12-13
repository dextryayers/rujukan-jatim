<?php

namespace App\Http\Controllers;

use App\Services\VisitorAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitorAnalyticsController extends Controller
{
    public function __construct(private readonly VisitorAnalyticsService $analytics)
    {
    }

    public function track(Request $request): JsonResponse
    {
        $sessionId = $request->header('X-Visitor-Session') ?: $request->input('session_id');
        $countView = $request->boolean('count_view', false);

        $result = $this->analytics->track(
            $sessionId,
            $request->ip(),
            $request->userAgent(),
            $countView
        );

        return response()
            ->json($result)
            ->cookie('visitor_session', $result['session_id'], 60 * 24 * 30, path: '/', secure: false, httpOnly: false, sameSite: 'lax');
    }

    public function stats(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 14);
        $stats = $this->analytics->recentStats($days);

        return response()->json($stats);
    }

    public function summary(): JsonResponse
    {
        return response()->json($this->analytics->currentSummary());
    }
}
