<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min($limit, 100));

        $logs = ActivityLog::with('user:id,username,name')
            ->orderByDesc('created_at')
            ->take($limit)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'type' => $log->type,
                'description' => $log->description,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at?->toIso8601String(),
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'username' => $log->user->username,
                    'name' => $log->user->name,
                ] : null,
            ]);

        return response()->json($logs);
    }
}
