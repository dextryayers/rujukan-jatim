<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('member')->after('email_verified_at');
            $table->string('city')->nullable()->after('phone');
            $table->string('institution')->nullable()->after('city');
            $table->string('photo_url')->nullable()->after('institution');
        });

        Schema::create('auth_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_tokens');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'phone', 'role', 'city', 'institution', 'photo_url']);
        });
    }
};
