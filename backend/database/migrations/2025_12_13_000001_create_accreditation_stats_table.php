<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accreditation_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('paripurna')->default(0);
            $table->unsignedInteger('utama')->default(0);
            $table->unsignedInteger('madya')->default(0);
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });

        DB::table('accreditation_stats')->insert([
            'paripurna' => 45,
            'utama' => 35,
            'madya' => 20,
            'recorded_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accreditation_stats');
    }
};
