<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\RecaptchaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly RecaptchaService $recaptcha,
        private readonly ActivityLogger $logger
    )
    {
    }

    public function index(): JsonResponse
    {
        $users = User::orderByDesc('created_at')
            ->get()
            ->map(fn (User $user) => $this->transform($user));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in(['admin', 'member'])],
            'full_name' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'recaptcha_token' => ['nullable', 'string'],
        ]);

        if ($data['role'] === 'admin') {
            if (!$this->recaptcha->verify($data['recaptcha_token'] ?? null, 'create_admin')) {
                return response()->json(['error' => 'recaptcha_failed'], 422);
            }
        } elseif (!empty($data['recaptcha_token'])) {
            if (!$this->recaptcha->verify($data['recaptcha_token'], 'register')) {
                return response()->json(['error' => 'recaptcha_failed'], 422);
            }
        }

        $user = User::create([
            'name' => $data['full_name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'city' => $data['city'] ?? null,
            'institution' => $data['institution'] ?? null,
            'password' => Hash::make($data['password']),
        ]);

        $this->logger->log(
            'user.created',
            sprintf('User "%s" (%s) dibuat.', $user->username, $user->role),
            $request->user(),
            ['user_id' => $user->id]
        );

        return response()->json($this->transform($user), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'institution' => ['sometimes', 'nullable', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'member'])],
            'password' => ['sometimes', 'string', 'min:6'],
        ]);

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->fill($data);
        $user->save();

        $this->logger->log(
            'user.updated',
            sprintf('User "%s" diperbarui.', $user->username),
            $request->user(),
            ['user_id' => $user->id]
        );

        return response()->json($this->transform($user->fresh()));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->id === $user->id) {
            return response()->json(['error' => 'cannot_delete_self'], 422);
        }

        $user->delete();

        $this->logger->log(
            'user.deleted',
            sprintf('User "%s" dihapus.', $user->username),
            $request->user(),
            ['user_id' => $user->id]
        );

        return response()->json(['status' => 'ok']);
    }

    private function transform(User $user): array
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
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }
}
