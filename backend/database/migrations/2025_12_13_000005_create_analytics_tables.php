<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('visitor_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->unique();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('last_seen')->index();
            $table->date('last_counted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('visitor_stats', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('unique_visitors')->default(0);
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->text('description');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('visitor_stats');
        Schema::dropIfExists('visitor_sessions');
    }
};
