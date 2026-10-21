<?php

// Laravel utilise cette ligne pour retrouver cete classe quand autre archive fait une requisition
namespace App\Services;

// c'est une intrument native du Laravel que fait des requetes HTTP pour que lui puisse se comuniquer avec le serveur Python
use Illuminate\Support\Facades\Http;

class EmbeddingService
{
    // Catégorie utilisée quand aucune autre n'est assez proche
    public const CATEGORIE_PAR_DEFAUT = 'Autres';

    // Similarité minimale pour accepter une catégorie (entre -1 et 1).
    // En dessous, l'annonce va dans "Autres" au lieu d'être forcée dans une catégorie qui ne lui va pas.
    // Calibré sur des exemples réels en FR / PT / EN (php artisan listings:recategorize --dry-run aide à l'ajuster).
    public const SEUIL = 0.25;

/*C'est une fuction public pour que tout le "systeme" puisse faire de requetes ar cette function
et array a la fin elle simplemente  annone que la function attends recevoir une array de retour 
la partie de "response" elle faz appel http pour le python c'est la meme function mais a l'inverse */
    public function generateEmbedding(string $text): array
    {
        $response = Http::post('http://127.0.0.1:8001/embedding', [
            'texto' => $text,
        ])->throw(); // erreur claire si le FastAPI répond une erreur
        return $response->json('embedding');
    }

    // Compare deux embeddings et renvoie leur similarited+ (entre -1 et 1)
     public function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $i => $valueA) {
            $valueB = $b[$i];
            $dotProduct += $valueA * $valueB;
            $normA += $valueA ** 2;
            $normB += $valueB ** 2;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    // Trouve la categorie la plus proche de l'embedding donne.
    public function findBestCategory(array $embedding, $categories): ?int
    {
        $bestCategoryId = null;
        $bestScore = -1;
        $parDefautId = null;

        foreach ($categories as $category) {
            // "Autres" n'est jamais comparée : c'est seulement la solution de secours
            if ($category->name === self::CATEGORIE_PAR_DEFAUT) {
                $parDefautId = $category->id;
                continue;
            }

            $score = $this->cosineSimilarity($embedding, $category->embedding);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestCategoryId = $category->id;
            }
        }

        if ($bestScore < self::SEUIL && $parDefautId !== null) {
            return $parDefautId;
        }

        return $bestCategoryId;
    }
}

