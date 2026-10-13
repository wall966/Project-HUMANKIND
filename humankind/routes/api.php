<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ParticipationController;
use App\Models\Participation;

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
});

