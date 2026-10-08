<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ListingController;



Route::get('/', function () {
    return view('welcome');
});

Route::post('/listings', [ListingController::class, 'store']);
Route::get('listings', [ListingController::class, 'index']);


/*
//recherche par utilisateur
Route::prefix('dashboard')->group(function(){
    Route::get('/admin', function(){
        return "Page admin";
    });
    Route::get('/users', function(){
        return "Page users";
    });
});
*/

Route::get('/listing/category/{category}', [ListingController::class, 'byCategory']);