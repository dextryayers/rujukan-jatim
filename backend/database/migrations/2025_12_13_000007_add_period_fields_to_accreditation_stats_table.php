<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('accreditation_stats', function (Blueprint $table) {
            if (!Schema::hasColumn('accreditation_stats', 'year')) {
                $table->unsignedSmallInteger('year')->nullable()->after('madya');
            }
            if (!Schema::hasColumn('accreditation_stats', 'month')) {
                $table->unsignedTinyInteger('month')->nullable()->after('year');
            }
            if (!Schema::hasColumn('accreditation_stats', 'region')) {
                $table->string('region', 191)->nullable()->after('month');
            }

            $table->index(['year', 'month']);
            $table->index('region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accreditation_stats', function (Blueprint $table) {
            if (Schema::hasColumn('accreditation_stats', 'region')) {
                $table->dropIndex(['region']);
                $table->dropColumn('region');
            }
            if (Schema::hasColumn('accreditation_stats', 'month')) {
                $table->dropIndex(['year', 'month']);
                $table->dropColumn('month');
            }
            if (Schema::hasColumn('accreditation_stats', 'year')) {
                $table->dropColumn('year');
            }
        });
    }
};
