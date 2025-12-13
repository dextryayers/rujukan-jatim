<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogger
{
    public function log(string $type, string $description, ?User $user = null, array $metadata = []): void
    {
        ActivityLog::create([
            'type' => $type,
            'description' => $description,
            'user_id' => $user?->id,
            'metadata' => empty($metadata) ? null : $metadata,
        ]);
    }
}
