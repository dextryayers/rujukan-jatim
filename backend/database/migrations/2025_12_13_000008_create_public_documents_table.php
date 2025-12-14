<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('public_documents')) {
            Schema::create('public_documents', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->string('file_path')->nullable();
                $table->string('file_url')->nullable();
                $table->string('file_name')->nullable();
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index('published_at');
                $table->index('category');
            });
        }

        if (Schema::hasTable('documents')) {
            $existing = DB::table('documents')
                ->where(function ($query) {
                    $query->whereNull('category')
                        ->orWhere('category', '!=', 'profile-photo');
                })
                ->get();

            foreach ($existing as $row) {
                DB::table('public_documents')->insert([
                    'title' => $row->title,
                    'description' => $row->description,
                    'category' => $row->category,
                    'file_path' => $row->file_path,
                    'file_url' => property_exists($row, 'file_url') ? $row->file_url : null,
                    'file_name' => $row->file_name,
                    'mime_type' => $row->mime_type,
                    'file_size' => $row->file_size,
                    'published_at' => $row->created_at,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('public_documents')) {
            Schema::dropIfExists('public_documents');
        }
    }
};
