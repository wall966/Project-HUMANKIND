<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Listing;

class ListingController extends Controller
{
    public function store(Request $request)
    {
      $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'required|string'
       ]);


       $listing = Listing::create([
         'user_id' => 1, // temporario ate login ser implementado
         'title' => $request->title,
         'description' => $request->description
       ]);
    }
}
