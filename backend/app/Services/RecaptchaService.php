<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RecaptchaService
{
    public function enabled(): bool
    {
        return (bool) config('services.recaptcha.secret_key');
    }

    public function verify(?string $token, string $action = 'general'): bool
    {
        $secret = config('services.recaptcha.secret_key');
        $bypassToken = config('services.recaptcha.bypass_token');
        $failOpen = (bool) config('services.recaptcha.fail_open', false);
        $threshold = (float) config('services.recaptcha.score_threshold', 0.5);

        if (!$secret) {
            return true;
        }

        if ($token && $bypassToken && hash_equals($bypassToken, $token)) {
            return true;
        }

        if (!$token) {
            return $failOpen;
        }

        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => $secret,
            'response' => $token,
        ]);

        if (!$response->ok()) {
            return $failOpen;
        }

        $data = $response->json();
        if (empty($data['success'])) {
            return $failOpen;
        }

        if (!empty($data['action']) && $action && $data['action'] !== $action) {
            return $failOpen;
        }

        if (isset($data['score']) && $data['score'] < $threshold) {
            return $failOpen;
        }

        return true;
    }
}
