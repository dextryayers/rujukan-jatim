<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('documents')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'category')) {
                $table->string('category')->nullable()->after('description');
            }

            if (!Schema::hasColumn('documents', 'file_url')) {
                $table->string('file_url')->nullable()->after('file_path');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('documents')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'category')) {
                $table->dropColumn('category');
            }

            if (Schema::hasColumn('documents', 'file_url')) {
                $table->dropColumn('file_url');
            }
        });
    }
};
