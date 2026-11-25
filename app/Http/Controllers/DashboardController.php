<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\CalendarEvent;
use App\Models\CatalogItem;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\ReservationPayment;
use App\Models\Service;
use App\Models\Trip;
use App\Models\User;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::all();
        $products = CatalogItem::all();

        $byStatus = collect(Funeraria::SERVICE_STATUSES)
            ->mapWithKeys(fn (string $status) => [$status => $services->where('status', $status)->count()]);

        $stockByCategory = collect(Funeraria::CATEGORIES)
            ->mapWithKeys(fn (string $category) => [$category => $products->where('category', $category)->sum('stock')]);

        $financial = null;
        if ($request->user()->role === 'dueno') {
            $pendingReservations = Reservation::get();
            $monthly = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = now()->startOfMonth()->subMonths($i);
                $monthly[$month->format('Y-m')] = (int) Invoice::whereNull('voided_at')
                    ->whereBetween('issue_date', [$month->toDateString(), $month->copy()->endOfMonth()->toDateString()])
                    ->sum('total');
            }

            $aging = ['0 a 30 días' => 0, '31 a 60 días' => 0, 'Más de 60 días' => 0];
            foreach ($pendingReservations as $reservation) {
                if ($reservation->pending <= 0) {
                    continue;
                }
                $days = $reservation->created_at->diffInDays(now());
                $bucket = $days <= 30 ? '0 a 30 días' : ($days <= 60 ? '31 a 60 días' : 'Más de 60 días');
                $aging[$bucket] += $reservation->pending;
            }

            $financial = [
                'invoices_total' => (int) Invoice::whereNull('voided_at')->sum('total'),
                'payments_received' => (int) ReservationPayment::sum('amount'),
                'pending_balance' => (int) $pendingReservations->sum('pending'),
                'invoice_count' => Invoice::whereNull('voided_at')->count(),
                'voided_count' => Invoice::whereNotNull('voided_at')->count(),
                'active_users' => User::where('is_active', true)->count(),
                'low_stock' => $products->filter(fn ($product) => $product->stock < $product->min_stock)->count(),
                'pending_absences' => Absence::where('status', 'Pendiente')->count(),
                'trips_in_progress' => Trip::where('status', 'En curso')->count(),
                'monthly' => $monthly,
                'aging' => $aging,
            ];
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'services' => $services->count(),
                'urgent' => $services->where('status', 'Urgente')->count(),
                'stock' => (int) $products->sum('stock'),
                'reservations' => Reservation::count(),
                'invoices' => Invoice::count(),
            ],
            'byStatus' => $byStatus,
            'stockByCategory' => $stockByCategory,
            'financial' => $financial,
            'upcoming' => CalendarEvent::where('event_date', '>=', now()->toDateString())
                ->orderBy('event_date')->orderBy('start_time')->limit(6)
                ->get(['id', 'title', 'type', 'event_date', 'start_time', 'location']),
            'myTrips' => Trip::with(['vehicle', 'driver'])
                ->whereDate('trip_date', now()->toDateString())
                ->when($request->user()->role === 'chofer', fn ($query) => $query->where('driver_id', $request->user()->id))
                ->orderBy('start_time')->limit(8)->get(),
            'recentServices' => Service::with('product')->latest('service_date')->limit(5)->get(),
            'constants' => [
                'statuses' => Funeraria::SERVICE_STATUSES,
                'categories' => Funeraria::CATEGORIES,
            ],
        ]);
    }
}
