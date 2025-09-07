<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $users = User::with('role')
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%$search%")
                      ->orWhere('email', 'like', "%$search%")
                      ->orWhere('username', 'like', "%$search%");
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        $roles = Role::select('id', 'name')->get(); // <-- Ini akan menghasilkan array of objects

        return Inertia::render('users/create', compact('roles'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', 'min:6'],
            'role_id' => 'required|exists:roles,id',
        ]);

        User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Handle verify user (mark email_verified_at).
     */
    public function verify(User $user)
    {
        $user->update(['email_verified_at' => now()]);

        return back()->with('success', 'User verified successfully.');
    }


    public function edit(User $user)
    {
        $roles = Role::select('id', 'name')->get();

        return Inertia::render('users/edit', [
            'user' => $user->only(['id', 'name', 'username', 'email', 'role_id']),
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->update($validated);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy($id)
    {
        // Hapus user berdasarkan ID
        $user = \App\Models\User::findOrFail($id);
        $user->delete();

        // Redirect/response, sesuaikan dengan kebutuhan (Inertia/redirect biasa)
        return redirect()->route('users.index')->with('success', 'User berhasil dihapus.');
    }

}