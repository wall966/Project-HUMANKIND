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
        // Informations privées : visibles seulement par les participants validés.
        // nullable : les annonces déjà publiées n'ont pas ces informations.
        Schema::table('listings', function (Blueprint $table) {
            $table->string('address')->nullable()->after('location');
            $table->string('contact_phone', 20)->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['address', 'contact_phone']);
        });
    }
};
