<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('users/index', [
            'users' => User::orderBy('id')->get(['id', 'name', 'email', 'role', 'is_active', 'email_verified_at', 'created_at']),
            'roles' => Funeraria::ROLE_LABELS,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:'.implode(',', Funeraria::ROLES),
            'is_active' => 'boolean',
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        return redirect()->route('usuarios.index')->with('success', 'Colaborador creado correctamente.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'role' => 'required|in:'.implode(',', Funeraria::ROLES),
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8',
        ]);

        if ($user->id === $request->user()->id) {
            $data['role'] = $user->role;
            $data['is_active'] = true;
        }

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? false,
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return redirect()->route('usuarios.index')->with('success', 'Colaborador actualizado.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'No puede eliminar su propia cuenta.');
        }

        $user->delete();

        return redirect()->route('usuarios.index')->with('success', 'Colaborador eliminado.');
    }
}
