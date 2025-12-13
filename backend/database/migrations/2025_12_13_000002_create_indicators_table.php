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
        Schema::create('indicators', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('region')->nullable();
            $table->decimal('capaian', 8, 2)->nullable();
            $table->decimal('target', 8, 2)->nullable();
            $table->string('status')->nullable();
            $table->date('date')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('indicators')->insert([
            [
                'name' => 'Kepatuhan kebersihan tangan',
                'capaian' => 90.0,
                'target' => 95.0,
                'status' => 'Mencapai Target',
                'date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kepatuhan penggunaan APD',
                'capaian' => 96.0,
                'target' => 98.0,
                'status' => 'Tidak Mencapai Target',
                'date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kepatuhan identifikasi pasien',
                'capaian' => 99.0,
                'target' => 100.0,
                'status' => 'Tidak Mencapai Target',
                'date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Waktu tanggap operasi SC emergensi',
                'capaian' => 89.0,
                'target' => 90.0,
                'status' => 'Mencapai Target',
                'date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('indicators');
    }
};
