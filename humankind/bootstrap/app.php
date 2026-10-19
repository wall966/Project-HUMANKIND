<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // "admin" : réserve une route aux administrateurs (à utiliser après auth:sanctum)
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);

         $middleware->validateCsrfTokens(except: [
        'listings',
         ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
