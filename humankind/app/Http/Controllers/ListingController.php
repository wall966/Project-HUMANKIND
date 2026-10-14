<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Services\EmbeddingService;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;

class ListingController extends Controller
{
  public function store(Request $request, EmbeddingService $embeddingService)
  {
    $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'required|string'
    ]);


    //envoie la description à FastAPI → reçoit un vecteur de 384 nombres
    $embedding = $embeddingService->generateEmbedding($request->description);
    //Récupère toutes les catégories
    $categories = Category::all();
    // Trouve la catégorie la plus proche (similarité cosinus)       
    $categoryId = $embeddingService->findBestCategory($embedding, $categories);

    $listing = Listing::create([
      'user_id' => $request->user()->id,
      'title' => $request->title,
      'description' => $request->description,
      'category_id' => $categoryId,
      'embedding' => $embedding
    ]);
    return response()->json($listing, 201);
  }
  //lister tout les annonces
  public function index()
  {
    $listings = Listing::all();
    return response()->json($listings);
  }


  //retourne l'annonce recherche
  public function show(Listing $listing):JsonResponse
  {
    $listing->load(['user:id,name', 'category:id,name']);
    return response()->json($listing);
  }
}
