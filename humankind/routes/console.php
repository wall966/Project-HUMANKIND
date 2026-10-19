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

// php artisan listings:recategorize            → reclasse toutes les annonces
// php artisan listings:recategorize --dry-run  → affiche seulement ce qui changerait
// À lancer après avoir ajouté ou modifié des catégories (CategorySeeder).
// Utilise l'embedding déjà enregistré de chaque annonce : pas besoin du FastAPI.
Artisan::command('listings:recategorize {--dry-run}', function (\App\Services\EmbeddingService $ia) {
    $categories = \App\Models\Category::all();
    $noms = $categories->pluck('name', 'id');
    $changements = 0;

    foreach (\App\Models\Listing::whereNotNull('embedding')->get() as $annonce) {
        $nouvelle = $ia->findBestCategory($annonce->embedding, $categories);

        // meilleur score, pour comprendre le choix (hors "Autres")
        $meilleur = $categories
            ->where('name', '!=', \App\Services\EmbeddingService::CATEGORIE_PAR_DEFAUT)
            ->max(fn ($c) => $ia->cosineSimilarity($annonce->embedding, $c->embedding));

        $avant = $noms[$annonce->category_id] ?? '—';
        $apres = $noms[$nouvelle] ?? '—';
        $score = number_format($meilleur, 2);

        if ($annonce->category_id === $nouvelle) {
            $this->line("#{$annonce->id} « {$annonce->title} » : {$apres} (inchangé, score {$score})");
            continue;
        }

        $changements++;
        $this->info("#{$annonce->id} « {$annonce->title} » : {$avant} → {$apres} (score {$score})");
        if (! $this->option('dry-run')) {
            $annonce->update(['category_id' => $nouvelle]);
        }
    }

    $this->newLine();
    $this->comment($this->option('dry-run')
        ? "{$changements} annonce(s) changeraient de catégorie (rien n'a été modifié)."
        : "{$changements} annonce(s) reclassée(s).");
    return 0;
})->purpose('Reclasser les annonces avec les catégories actuelles');
  