<?php

namespace App\Http\Controllers;

use App\Http\Requests\ParticipateRequest;
use App\Http\Requests\UpdateParticipationRequest;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use App\Models\Participation;
use Illuminate\Http\Request;


//recupere les donnes deja valides
class ParticipationController extends Controller
{
    public function store(ParticipateRequest $request, Listing $listing): JsonResponse
    {
        $userId = $request->user()->id;
        if ($listing->user_id === $userId) {
            return response()->json(['message' => 'Vous ne pouvez pas participer de votre prope annonce'], 403);
        }
        if (Participation::where('listing_id', $listing->id)->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'Vous participez deja de cette annonce'], 409);
        }

        $participation = Participation::create([
            'listing_id' => $listing->id,
            'user_id' => $userId,
            'comment' => $request->comment
        ]);
        return response()->json($participation, 201);
    }

    public function index(Request $request):JsonResponse {
        $participations = $request->user()->participations()->with('listing')->latest()->get();
        return response()->json($participations);

    }

    public function update(UpdateParticipationRequest $request, Participation $participation):JsonResponse {
        if($participation->status !== 'pending'){
            return response()->json(['message' => 'Cette demande deja été traitee'],409);
            
        }
    }
}
