<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccreditationStat extends Model
{
    protected $fillable = [
        'paripurna',
        'utama',
        'madya',
        'recorded_at',
        'year',
        'month',
        'region',
    ];

    protected $casts = [
        'paripurna' => 'integer',
        'utama' => 'integer',
        'madya' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'recorded_at' => 'datetime',
    ];
}
