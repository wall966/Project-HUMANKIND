<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // En production, toutes les URL générées par Laravel sont en HTTPS
        // (le jeton Bearer ne doit jamais circuler en clair)
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
