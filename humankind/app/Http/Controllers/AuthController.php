<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Requests\Auth\RegisterRequest;



//responsable pour crier une utilisateurs e crier une token pour rentrer au site
class AuthController extends Controller
{

   public function register(RegisterRequest $request) {

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => $request->password,
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
    ], 201);
   }
}
