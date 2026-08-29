<?php

// Laravel utilise cette ligne pour retrouver cete classe quand autre archive fait une requisition
namespace App\Services;

// c'est une intrument native du Laravel que fait des requetes HTTP pour que lui puisse se comuniquer avec le serveur Python
use Illuminate\Support\Facades\Http;

class EmbeddingService
{
/*C'est une fuction public pour que tout le "systeme" puisse faire de requetes ar cette function
et array a la fin elle simplemente  annone que la function attends recevoir une array de retour 
la partie de "response" elle faz appel http pour le python c'est la meme function mais a l'inverse */
    public function generateEmbedding(string $text): array
    {
        $response = Http::post('http://127.0.0.1:8000/embedding', [
            'texto' => $text,
        ]);
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

    // Trouve la categorie la plus proche de l'embedding donne
    public function findBestCategory(array $embedding, $categories): ?int
    {
        $bestCategoryId = null;
        $bestScore = -1;

        foreach ($categories as $category) {
            $score = $this->cosineSimilarity($embedding, $category->embedding);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestCategoryId = $category->id;
            }
        }

        return $bestCategoryId;
    }
}

?>