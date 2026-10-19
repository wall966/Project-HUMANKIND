<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Espace administrateur : voir et supprimer les utilisateurs et les annonces.
// Toutes les routes passent par les middlewares auth:sanctum + admin (routes/api.php).
class AdminController extends Controller
{
    // tous les utilisateurs, avec leur nombre d'annonces
    public function users(): JsonResponse
    {
        $users = User::withCount('listings')->latest()->get(['id', 'name', 'email', 'is_admin', 'created_at']);

        return response()->json($users);
    }

    // supprime un utilisateur (ses annonces et participations partent avec, grâce aux "cascade")
    public function destroyUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte administrateur.'], 422);
        }

        $user->tokens()->delete(); // la table des tokens n'a pas de cascade
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }

    // toutes les annonces, avec l'auteur, la catégorie et le nombre de demandes
    public function listings(): JsonResponse
    {
        $listings = Listing::with(['user:id,name,email', 'category:id,name'])
            ->withCount('participations')
            ->latest()
            ->get();

        return response()->json($listings);
    }

    // supprime une annonce (ses participations partent avec)
    public function destroyListing(Listing $listing): JsonResponse
    {
        $listing->delete();

        return response()->json(['message' => 'Annonce supprimée.']);
    }
}
