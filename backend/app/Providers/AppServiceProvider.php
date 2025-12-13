<?php

namespace App\Providers;

use App\Services\ActivityLogger;
use App\Services\RecaptchaService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(RecaptchaService::class, fn () => new RecaptchaService());
        $this->app->singleton(ActivityLogger::class, fn () => new ActivityLogger());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
