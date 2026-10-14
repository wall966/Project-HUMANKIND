<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ParticipationController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/listings', [ListingController::class, 'store']);
    Route::get('/listings', [ListingController::class, 'index']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/listings/{listing}/participate', [ParticipationController::class, 'store']);
    Route::get('/my-activities', [ParticipationController::class, 'index']);
    Route::patch('/participations/{participation}', [ParticipationController::class, 'update']);
    Route::get('/listings/{listing}/participations', [ParticipationController ::class, 'listingParticipation']);
    Route::get('/listings/{listing}', [ListingController::class, 'show']);
});

