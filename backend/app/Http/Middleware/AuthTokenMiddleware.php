<?php

namespace App\Http\Middleware;

use App\Models\AuthToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthTokenMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $authToken = AuthToken::with('user')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$authToken) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        if (!empty($roles) && !in_array($authToken->user->role, $roles, true)) {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $request->setUserResolver(fn () => $authToken->user);

        return $next($request);
    }
}
