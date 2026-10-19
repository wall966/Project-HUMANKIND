<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Laisse passer uniquement les administrateurs (users.is_admin = true).
// À placer APRÈS auth:sanctum : on sait déjà QUI fait la requête, on vérifie ici s'il en a le DROIT.
class EnsureUserIsAdmin
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_admin) {
            return response()->json(['message' => 'Accès réservé aux administrateurs.'], 403);
        }

        return $next($request);
    }
}
