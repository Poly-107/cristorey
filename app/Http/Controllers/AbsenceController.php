<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\User;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AbsenceController extends Controller
{
    public function index()
    {
        return Inertia::render('absences/index', [
            'absences' => Absence::with('user')->orderByDesc('start_date')->get(),
            'users' => User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'role']),
            'reasons' => Funeraria::ABSENCE_REASONS,
            'statuses' => Funeraria::ABSENCE_STATUSES,
        ]);
    }

    public function store(Request $request)
    {
        Absence::create($this->validateData($request));

        return redirect()->route('ausencias.index')->with('success', 'Ausencia registrada.');
    }

    public function update(Request $request, Absence $absence)
    {
        $absence->update($this->validateData($request));

        return redirect()->route('ausencias.index')->with('success', 'Ausencia actualizada.');
    }

    public function destroy(Absence $absence)
    {
        $absence->delete();

        return redirect()->route('ausencias.index')->with('success', 'Registro eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'worker_name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'reason' => 'required|in:'.implode(',', Funeraria::ABSENCE_REASONS),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:'.implode(',', Funeraria::ABSENCE_STATUSES),
            'notes' => 'nullable|string',
        ]);
    }
}
