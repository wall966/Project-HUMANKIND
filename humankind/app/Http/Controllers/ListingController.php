<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Services\EmbeddingService;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;

class ListingController extends Controller
{
  public function store(Request $request, EmbeddingService $embeddingService): JsonResponse
  {
    // mêmes règles que le formulaire React (Formulaire.jsx)
    $request->validate([
      'title' => 'required|string|min:5|max:255',
      'description' => 'required|string|max:1000',
      'date_time' => 'required|date|after:now',
      'location' => 'required|string|max:255',
      // coordonnées de la ville choisie dans l'autocomplétion (Photon)
      'latitude' => 'nullable|numeric|between:-90,90',
      'longitude' => 'nullable|numeric|between:-180,180',
      'address' => 'required|string|min:5|max:255',
      'contact_phone' => ['nullable', 'string', 'max:20', 'regex:/^\+?[0-9 .()-]{8,20}$/'],
    ]);

    //envoie la description à FastAPI → reçoit un vecteur de 384 nombres
    try {
      $embedding = $embeddingService->generateEmbedding($request->description);
    } catch (\Throwable $e) {
      report($e); // garde la trace de l'erreur dans storage/logs/laravel.log
      return response()->json([
        'message' => 'Le service de catégorisation est indisponible. Réessayez dans un instant.',
      ], 503);
    }
    //Récupère toutes les catégories
    $categories = Category::all();
    // Trouve la catégorie la plus proche (similarité cosinus)       
    $categoryId = $embeddingService->findBestCategory($embedding, $categories);

    $listing = Listing::create([
      'user_id' => $request->user()->id,
      'title' => $request->title,
      'description' => $request->description,
      'category_id' => $categoryId,
      'embedding' => $embedding,
      'date_time' => $request->date_time,
      'location' => $request->location,
      'latitude' => $request->latitude,
      'longitude' => $request->longitude,
      'address' => $request->address,
      'contact_phone' => $request->contact_phone,
    ]);

    // renvoie l'annonce avec le nom de la catégorie choisie par l'IA
    return response()->json($listing->load('category:id,name'), 201);
  }
  //lister tout les annonces
  // toutes les annonces, les plus récentes d'abord, avec le prénom de l'auteur et la catégorie
  public function index(): JsonResponse
  {
    $listings = Listing::with(['user:id,name', 'category:id,name'])->latest()->get();
    return response()->json($listings);
  }


  // Mes annonces, avec les demandes de participation reçues (prénom du demandeur, commentaire, statut).
  // Je suis le créateur : je vois aussi mon adresse et mon téléphone.
  public function mine(Request $request): JsonResponse
  {
    $listings = $request->user()->listings()
      ->with([
        'category:id,name',
        'participations' => fn($q) => $q->with('user:id,name')->latest(),
      ])
      ->latest()
      ->get()
      ->each(fn($listing) => $listing->makeVisible(['address', 'contact_phone']));

    return response()->json($listings);
  }

  //retourne l'annonce recherche
  public function show(Listing $listing): JsonResponse
  {
    $listing->load(['user:id,name', 'category:id,name']); 
    return response()->json($listing);
  }
}
