<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\ParticipateRequest;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use App\Models\Participation;

//recupere les donnes deja valides
class ParticipationController extends Controller
{
    public function store(ParticipateRequest $request, Listing $listing):JsonResponse {
      $userId = $request->user()->id;
    if ($listing->user_id === $userId){
        return response()->json(['message' => 'Vous ne pouvez pas participer de votre prope annonce'], 403);
    } 
    if (Participation::where('listing_id', $listing->id)->where('user_id', $userId)->exists()){
        return response()->json(['message' => 'Vous participez deja de cette annonce'], 409);
    }

    $participation = Participation::create([ 
        'listing_id'=>$listing->id,
        'user_id'=>$userId,
        'comment'=>$request->comment
    ]);
        return response()->json($participation, 201);
    }
}
