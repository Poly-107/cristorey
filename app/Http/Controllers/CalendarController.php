<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\Service;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));
        $parsed = \Carbon\Carbon::createFromFormat('Y-m', $month) ?: now();

        return Inertia::render('calendar/index', [
            'events' => CalendarEvent::with('service')
                ->whereBetween('event_date', [
                    $parsed->copy()->startOfMonth()->toDateString(),
                    $parsed->copy()->endOfMonth()->toDateString(),
                ])
                ->orderBy('event_date')->orderBy('start_time')->get(),
            'services' => Service::orderByDesc('service_date')->get(['id', 'code', 'deceased_name']),
            'month' => $parsed->format('Y-m'),
            'types' => Funeraria::EVENT_TYPES,
        ]);
    }

    public function store(Request $request)
    {
        CalendarEvent::create($this->validateData($request));

        return back()->with('success', 'Evento agregado al calendario.');
    }

    public function update(Request $request, CalendarEvent $calendarEvent)
    {
        $calendarEvent->update($this->validateData($request));

        return back()->with('success', 'Evento actualizado.');
    }

    public function destroy(CalendarEvent $calendarEvent)
    {
        $calendarEvent->delete();

        return back()->with('success', 'Evento eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:'.implode(',', Funeraria::EVENT_TYPES),
            'event_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'service_id' => 'nullable|exists:services,id',
            'notes' => 'nullable|string',
        ]);
    }
}
