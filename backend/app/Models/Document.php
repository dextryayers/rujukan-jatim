<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'file_path',
        'file_name',
        'file_url',
        'mime_type',
        'file_size',
    ];
}
