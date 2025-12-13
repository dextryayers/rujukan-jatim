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
    ];
}
