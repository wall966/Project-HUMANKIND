<?php

declare(strict_types=1);

namespace App\Http\Controllers;


use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

//responsable l'inscription et la connexion (création du token), et aussi delete pour le token apres la deconnection
class AuthController extends Controller
{

    public function register(RegisterRequest $request): JsonResponse {

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

    public function login(LoginRequest $request): JsonResponse {
        
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Données invalides'], 401);
        }
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'message' => 'Valide',
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    public function logout(Request $request):JsonResponse {
       $request->user()->currentAccessToken()->delete(); 
       return response()->json(['message'=> 'Utilisateur déconnecté']);
    }

}
