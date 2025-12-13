<?php

namespace App\Http\Controllers;

use App\Models\AuthToken;
use App\Models\User;
use App\Services\RecaptchaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function __construct(private readonly RecaptchaService $recaptcha)
    {
    }

    public function register(Request $request): JsonResponse
    {
        if ($response = $this->blockIfTooManyAttempts($request, 'register')) {
            return $response;
        }

        $data = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(['admin', 'member'])],
            'full_name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'institution' => ['required', 'string', 'max:255'],
            'recaptcha_token' => ['nullable', 'string'],
            'admin_code' => ['nullable', 'string'],
        ]);

        if ($data['role'] === 'admin') {
            if (!$this->recaptcha->verify($data['recaptcha_token'] ?? null, 'register')) {
                $this->incrementAttempts($request, 'register');
                return response()->json(['error' => 'recaptcha_failed'], 422);
            }

            $expectedCode = config('app.admin_code');
            if ($expectedCode && $data['admin_code'] !== $expectedCode) {
                $this->incrementAttempts($request, 'register');
                return response()->json(['error' => 'invalid_admin_code'], 422);
            }
        }

        $user = User::create([
            'name' => $data['full_name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'city' => $data['city'],
            'institution' => $data['institution'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $this->issueToken($user);

        $this->resetAttempts($request, 'register');

        return response()->json([
            'token' => $token->token,
            'user' => $this->transformUser($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        if ($response = $this->blockIfTooManyAttempts($request, 'login')) {
            return $response;
        }

        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'recaptcha_token' => ['nullable', 'string'],
        ]);

        if (!$this->recaptcha->verify($data['recaptcha_token'] ?? null, 'login')) {
            $this->incrementAttempts($request, 'login');
            return response()->json(['error' => 'recaptcha_failed'], 422);
        }

        /** @var User|null $user */
        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            $this->incrementAttempts($request, 'login');
            return response()->json(['error' => 'invalid_credentials'], 401);
        }

        $token = $this->issueToken($user);

        $this->resetAttempts($request, 'login');

        return response()->json([
            'token' => $token->token,
            'user' => $this->transformUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            AuthToken::where('token', $token)->delete();
        }

        return response()->json(['status' => 'ok']);
    }

    public function me(Request $request): JsonResponse
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

        return response()->json($this->transformUser($authToken->user));
    }

    private function issueToken(User $user): AuthToken
    {
        AuthToken::where('user_id', $user->id)->delete();

        return AuthToken::create([
            'user_id' => $user->id,
            'token' => Str::random(60),
            'expires_at' => now()->addDays(7),
        ]);
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'city' => $user->city,
            'institution' => $user->institution,
            'photo_url' => $user->photo_url,
        ];
    }

    private function rateLimitKey(Request $request, string $action): string
    {
        return 'auth_attempts:' . $action . ':' . sha1($request->ip() ?? 'unknown');
    }

    private function blockIfTooManyAttempts(Request $request, string $action): ?JsonResponse
    {
        $attempts = Cache::get($this->rateLimitKey($request, $action), 0);
        if ($attempts >= 3) {
            $content = '<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body style="background:#fff;color:#111;font-family:Arial,sans-serif;text-align:center;padding-top:10vh;"><h1>403 Forbidden</h1><p>IP: ' . e($request->ip()) . '</p></body></html>';
            return response($content, 403)->header('Content-Type', 'text/html; charset=UTF-8');
        }

        return null;
    }

    private function incrementAttempts(Request $request, string $action): void
    {
        $key = $this->rateLimitKey($request, $action);
        $attempts = Cache::get($key, 0) + 1;
        Cache::put($key, $attempts, now()->addMinutes(30));
    }

    private function resetAttempts(Request $request, string $action): void
    {
        Cache::forget($this->rateLimitKey($request, $action));
    }
}
