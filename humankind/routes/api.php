<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ParticipationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AdminController;


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
    Route::get('/my-listings', [ListingController::class, 'mine']);
    Route::patch('/participations/{participation}', [ParticipationController::class, 'update']);
    Route::get('/listings/{listing}/participations', [ParticipationController::class, 'listingParticipation']);
    Route::get('/listings/{listing}', [ListingController::class, 'show']);
    Route::get('/categories/{category}/listings', [CategoryController::class, 'listings']);
    Route::get('/categories', [CategoryController::class, 'index']);

    // supprimer son propre compte (mot de passe demandé)
    Route::delete('/user', [AuthController::class, 'destroy']);
});

// Espace administrateur : connecté (auth:sanctum) ET administrateur (admin)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
    Route::delete('/users/{user}', [AdminController::class, 'destroyUser']);
    Route::get('/listings', [AdminController::class, 'listings']);
    Route::delete('/listings/{listing}', [AdminController::class, 'destroyListing']);
});

