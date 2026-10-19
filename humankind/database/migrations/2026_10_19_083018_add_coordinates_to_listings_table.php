<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Coordonnées GPS de la VILLE de l'annonce (pas de l'adresse privée),
        // pour filtrer par rayon et afficher la distance.
        // DECIMAL(9,6) : 6 décimales ≈ 10 cm de précision, largement suffisant.
        Schema::table('listings', function (Blueprint $table) {
            $table->decimal('latitude', 9, 6)->nullable()->after('location');
            $table->decimal('longitude', 9, 6)->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
