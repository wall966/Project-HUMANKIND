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

    // Supprimer son propre compte (droit à l'effacement, RGPD).
    // On redemande le mot de passe : action définitive, et protège un ordinateur resté ouvert.
    public function destroy(Request $request): JsonResponse {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Mot de passe incorrect.',
                'errors' => ['password' => ['Mot de passe incorrect.']],
            ], 422);
        }

        // annonces et participations : supprimées par les "cascade" de la base
        $user->tokens()->delete(); // la table des tokens n'a pas de cascade
        $user->delete();

        return response()->json(['message' => 'Compte supprimé.']);
    }

}
