<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * El rol "dueno" tiene acceso a todos los módulos del sistema.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! in_array($user->role, [...$roles, 'dueno'], true)) {
            abort(403, 'Su rol no tiene acceso a este módulo.');
        }

        return $next($request);
    }
}
