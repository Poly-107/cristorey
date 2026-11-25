<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Trip;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FleetController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        $user = $request->user();
        $isDriver = $user->role === 'chofer';

        $trips = Trip::with(['vehicle', 'driver', 'service'])
            ->whereDate('trip_date', $date);

        if ($isDriver) {
            $trips->where('driver_id', $user->id);
        }

        return Inertia::render('fleet/index', [
            'vehicles' => Vehicle::orderBy('name')->get(),
            'trips' => $trips->orderBy('start_time')->get(),
            'drivers' => User::where('is_active', true)
                ->whereIn('role', ['chofer', 'encargado', 'dueno'])
                ->orderBy('name')->get(['id', 'name', 'role']),
            'services' => Service::orderByDesc('service_date')->limit(50)->get(['id', 'code', 'deceased_name']),
            'date' => $date,
            'statuses' => Funeraria::TRIP_STATUSES,
            'isDriver' => $isDriver,
        ]);
    }

    public function storeVehicle(Request $request)
    {
        $this->authorizeFleetManagement($request);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'plate' => 'required|string|max:30|unique:vehicles,plate',
            'type' => 'required|string|max:100',
            'capacity' => 'required|integer|min:1',
        ]);

        Vehicle::create($data);

        return back()->with('success', 'Vehículo agregado a la flota.');
    }

    public function storeTrip(Request $request)
    {
        $this->authorizeFleetManagement($request);

        $data = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'nullable|exists:users,id',
            'service_id' => 'nullable|exists:services,id',
            'destination' => 'required|string|max:255',
            'trip_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        Trip::create([...$data, 'status' => 'Programado']);

        return back()->with('success', 'Recorrido programado.');
    }

    public function start(Request $request, Trip $trip)
    {
        $this->authorizeTrip($request, $trip);

        if ($trip->status === 'Finalizado') {
            return back()->with('error', 'El recorrido ya está finalizado.');
        }

        $trip->update([
            'status' => 'En curso',
            'start_time' => $trip->start_time ?? now()->format('H:i'),
        ]);
        $trip->vehicle->update(['status' => 'En ruta']);

        return back()->with('success', 'Recorrido iniciado.');
    }

    public function finish(Request $request, Trip $trip)
    {
        $this->authorizeTrip($request, $trip);

        if ($trip->status !== 'En curso') {
            return back()->with('error', 'El recorrido debe estar en curso para finalizarlo.');
        }

        $trip->update(['status' => 'Finalizado', 'end_time' => now()->format('H:i')]);
        $trip->vehicle->update(['status' => 'Disponible']);

        return back()->with('success', 'Recorrido finalizado.');
    }

    public function destroyTrip(Request $request, Trip $trip)
    {
        $this->authorizeFleetManagement($request);

        if ($trip->status === 'En curso') {
            return back()->with('error', 'No se puede eliminar un recorrido en curso.');
        }

        $trip->delete();

        return back()->with('success', 'Recorrido eliminado.');
    }

    private function authorizeFleetManagement(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['dueno', 'encargado'], true),
            403,
            'Su rol no puede gestionar vehículos ni recorridos.'
        );
    }

    private function authorizeTrip(Request $request, Trip $trip): void
    {
        if ($request->user()->role === 'chofer' && $trip->driver_id !== $request->user()->id) {
            abort(403, 'Este recorrido no está asignado a su persona.');
        }
    }
}
