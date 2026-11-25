<?php

namespace App\Http\Controllers;

use App\Models\CatalogItem;
use App\Models\Reservation;
use App\Models\ReservationPayment;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReservationController extends Controller
{
    public function index()
    {
        return Inertia::render('reservations/index', [
            'reservations' => Reservation::with(['product', 'payments'])->orderByDesc('id')->get(),
            'products' => CatalogItem::where('active', true)->orderBy('name')->get(['id', 'name', 'category', 'stock', 'price_clp']),
            'statuses' => Funeraria::RESERVATION_STATUSES,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $product = CatalogItem::findOrFail($data['product_id']);

        if ($product->stock < 1) {
            return back()->with('error', 'El producto seleccionado no tiene stock disponible.');
        }

        DB::transaction(function () use ($data, $product) {
            $reservation = Reservation::create([
                ...$data,
                'folio' => $this->nextFolio(),
                'paid_amount' => 0,
            ]);

            if ($data['paid_amount'] > 0) {
                $reservation->payments()->create([
                    'amount' => $data['paid_amount'],
                    'paid_on' => now()->toDateString(),
                    'note' => 'Abono inicial',
                ]);
                $reservation->update(['paid_amount' => $data['paid_amount']]);
            }

            $product->decrement('stock');
        });

        return redirect()->route('reservas.index')->with('success', 'Reserva registrada y stock descontado.');
    }

    public function update(Request $request, Reservation $reservation)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'product_id' => 'required|exists:catalog_items,id',
            'total_value' => 'required|integer|min:0',
            'status' => 'required|in:'.implode(',', Funeraria::RESERVATION_STATUSES),
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($data, $reservation) {
            if ((int) $data['product_id'] !== $reservation->product_id) {
                CatalogItem::findOrFail($reservation->product_id)->increment('stock');
                $product = CatalogItem::findOrFail($data['product_id']);
                if ($product->stock < 1) {
                    throw new \RuntimeException('El producto seleccionado no tiene stock disponible.');
                }
                $product->decrement('stock');
            }

            $reservation->update($data);
        });

        return redirect()->route('reservas.index')->with('success', 'Reserva actualizada.');
    }

    public function destroy(Reservation $reservation)
    {
        DB::transaction(function () use ($reservation) {
            $reservation->product->increment('stock');
            $reservation->delete();
        });

        return redirect()->route('reservas.index')->with('success', 'Reserva anulada y stock restaurado.');
    }

    public function payment(Request $request, Reservation $reservation)
    {
        $data = $request->validate([
            'amount' => 'required|integer|min:1',
            'paid_on' => 'required|date',
            'note' => 'nullable|string|max:255',
        ]);

        if ($data['amount'] > $reservation->pending) {
            return back()->with('error', 'El abono supera el saldo pendiente.');
        }

        DB::transaction(function () use ($data, $reservation) {
            ReservationPayment::create(['reservation_id' => $reservation->id, ...$data]);
            $reservation->increment('paid_amount', $data['amount']);

            if ($reservation->fresh()->pending === 0) {
                $reservation->update(['status' => 'Pagado Total']);
            }
        });

        return back()->with('success', 'Abono registrado correctamente.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'product_id' => 'required|exists:catalog_items,id',
            'total_value' => 'required|integer|min:0',
            'paid_amount' => 'nullable|integer|min:0',
            'status' => 'required|in:'.implode(',', Funeraria::RESERVATION_STATUSES),
            'notes' => 'nullable|string',
        ]);
    }

    private function nextFolio(): string
    {
        return 'RES-'.str_pad((string) (Reservation::max('id') + 1), 5, '0', STR_PAD_LEFT);
    }
}
