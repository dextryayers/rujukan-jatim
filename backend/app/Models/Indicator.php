<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Indicator extends Model
{
    protected $fillable = [
        'name',
        'region',
        'capaian',
        'target',
        'status',
        'date',
    ];
}
