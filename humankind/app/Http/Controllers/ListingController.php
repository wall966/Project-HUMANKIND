<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Services\EmbeddingService;
use App\Models\Listing;


class ListingController extends Controller
{
    public function store(Request $request, EmbeddingService $embeddingService)
    {
      $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'required|string'
       ]);
      
       //cette ligne  envoie la description http pour la fastAPI et la meme retourne une array de 384 numeros e $embedding garde tout
       $embedding = $embeddingService->generateEmbedding($request->description);
       //cette ligne recupere les donnes contenus na base de donnes do Supabase na categorie ("categories")
       $categories = Category::all();
        // Compare l'embedding avec chaque catégorie et renvoie l'id de la plus proche       
       $categoryId = $embeddingService->findBestCategory($embedding, $categories);

       $listing = Listing::create([
         'user_id' => 2, // temporario ate login ser implementado
         'title' => $request->title,
         'description' => $request->description,
         'category_id' => $categoryId,
         'embedding' => $embedding
       ]);
       return response()->json($listing);
    }
}

