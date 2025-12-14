<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicDocument extends Model
{
    protected $table = 'public_documents';

    protected $fillable = [
        'title',
        'description',
        'category',
        'file_path',
        'file_url',
        'file_name',
        'mime_type',
        'file_size',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];
}
