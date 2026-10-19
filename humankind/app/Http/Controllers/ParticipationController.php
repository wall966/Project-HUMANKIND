<?php

namespace App\Http\Controllers;

use App\Http\Requests\ParticipateRequest;
use App\Http\Requests\UpdateParticipationRequest;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use App\Models\Participation;
use Illuminate\Http\Request;



class ParticipationController extends Controller
{
    public function store(ParticipateRequest $request, Listing $listing): JsonResponse
    {
        $userId = $request->user()->id;
        if ($listing->user_id === $userId) {
            return response()->json(['message' => 'Vous ne pouvez pas participer à votre propre annonce.'], 403);
        }
        if (Participation::where('listing_id', $listing->id)->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Vous avez déjà demandé à participer à cette annonce.'], 409);
        }

        $participation = Participation::create([
            'listing_id' => $listing->id,
            'user_id' => $userId,
            'comment' => $request->comment
        ]);
        // refresh() : récupère le statut "pending" mis par défaut par la base
        return response()->json($participation->refresh(), 201);
    }

    // Mes demandes de participation ("Mes activités").
    // Les informations privées (adresse, téléphone, email du créateur) ne sont révélées
    // QUE pour les demandes validées par le créateur.
    public function index(Request $request):JsonResponse {
        $participations = $request->user()->participations()
            ->with(['listing.user:id,name,email', 'listing.category:id,name'])
            ->latest()
            ->get();

        foreach ($participations as $participation) {
            $listing = $participation->listing;
            if (! $listing) continue;

            if ($participation->status === 'approved') {
                $listing->makeVisible(['address', 'contact_phone']);
            } elseif ($listing->user) {
                // ⚠️ Laravel partage UN SEUL objet User entre toutes les annonces du même créateur :
                // on masque l'email sur une COPIE, sinon il serait aussi masqué pour une demande validée.
                $listing->setRelation('user', (clone $listing->user)->makeHidden('email'));
            }
        }

        return response()->json($participations);
    }
        // actualiser le status d'une annonce
    public function update(UpdateParticipationRequest $request, Participation $participation):JsonResponse {
        if($participation->status !== 'pending'){
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 409);
        }

        $participation->update(['status'=> $request->status]);
        return response()->json($participation);
    }

    //seulement le creator de l'annonce peut voir les demandes
    public function listingParticipation(Request $request, Listing $listing):JsonResponse {
        if($listing->user_id !== $request->user()->id) {
            return response()->json(['message'=> 'Accès reserve au creator de l\'annonce'], 403);
        }
        $participations = $listing->participations()->with('user:id,name')->latest()->get();
        return response()->json($participations);
    }
}
