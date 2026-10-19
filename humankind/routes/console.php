<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// php artisan admin:promote email@exemple.com
// Donne le rôle administrateur à un compte existant. Volontairement PAS disponible par l'API.
Artisan::command('admin:promote {email}', function (string $email) {
    $user = \App\Models\User::where('email', $email)->first();

    if (! $user) {
        $this->error("Aucun compte avec l'email {$email}. Inscrivez-vous d'abord sur le site.");
        return 1;
    }

    // affectation directe : is_admin n'est pas dans $fillable, update([...]) l'ignorerait
    $user->is_admin = true;
    $user->save();

    $this->info("{$user->name} ({$email}) est maintenant administrateur.");
    return 0;
})->purpose('Donner le rôle administrateur à un compte');

// php artisan listings:geocode
// Retrouve les coordonnées GPS des annonces qui ont une ville mais pas encore de latitude/longitude
// (annonces publiées avant l'ajout du rayon). Utilise Photon (OpenStreetMap), gratuit.
Artisan::command('listings:geocode', function () {
    $annonces = \App\Models\Listing::whereNotNull('location')->whereNull('latitude')->get();

    if ($annonces->isEmpty()) {
        $this->info('Toutes les annonces avec une ville ont déjà leurs coordonnées.');
        return 0;
    }

    foreach ($annonces as $annonce) {
        $reponse = \Illuminate\Support\Facades\Http::timeout(10)->get('https://photon.komoot.io/api/', [
            'q' => $annonce->location,
            'limit' => 1,
            'lang' => 'fr',
        ]);
        $coords = $reponse->json('features.0.geometry.coordinates'); // [longitude, latitude]

        if (! $coords) {
            $this->warn("#{$annonce->id} « {$annonce->location} » : lieu introuvable");
            continue;
        }

        $annonce->update(['longitude' => $coords[0], 'latitude' => $coords[1]]);
        $this->line("#{$annonce->id} « {$annonce->location} » → {$coords[1]}, {$coords[0]}");

        sleep(1); // règle d'usage du service public : pas plus d'une requête par seconde
    }

    return 0;
})->purpose('Ajouter les coordonnées GPS aux annonces qui ont une ville');
  