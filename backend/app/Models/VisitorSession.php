<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisitorSession extends Model
{
    protected $fillable = [
        'session_id',
        'ip_address',
        'user_agent',
        'last_seen',
        'last_counted_at',
    ];

    protected $casts = [
        'last_seen' => 'datetime',
        'last_counted_at' => 'date',
    ];
}
