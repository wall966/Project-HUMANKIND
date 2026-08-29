<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ListingController;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/listings', [ListingController::class, 'store']);