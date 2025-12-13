<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'institution' => ['sometimes', 'nullable', 'string', 'max:255'],
            'password' => ['sometimes', 'string', 'min:6'],
            'photo_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'photoUrl' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        if (array_key_exists('photoUrl', $data)) {
            $data['photo_url'] = $data['photoUrl'];
            unset($data['photoUrl']);
        }

        if (array_key_exists('password', $data)) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->fill($data);
        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'city' => $user->city,
            'institution' => $user->institution,
            'photo_url' => $user->photo_url,
        ]);
    }
}
