<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureEmailIsVerifiedByAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        if ($user->role->name === 'Super User') {
            return $next($request); // Super Admin selalu bisa login
        }

        // Hanya izinkan akses jika email sudah diverifikasi
        if (!$user->email_verified_at) {
            Auth::logout();
            return redirect()->route('login')->withErrors([
                'email' => 'Your account is not verified by an admin yet.'
            ]);
        }

        return $next($request);
    }
}