<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Service;
use App\Support\Funeraria;
use App\Support\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['service', 'reservation', 'items'])->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($query) use ($search) {
                $query->where('folio', 'like', "%{$search}%")
                    ->orWhereHas('service', fn ($query) => $query->where('code', 'like', "%{$search}%"))
                    ->orWhereHas('reservation', fn ($query) => $query->where('customer_name', 'like', "%{$search}%"));
            });
        }

        $reservations = Reservation::with('product')
            ->orderByDesc('id')
            ->get(['id', 'folio', 'product_id', 'customer_name', 'customer_email', 'total_value', 'paid_amount', 'status']);

        $reservationId = (int) $request->query('reservation_id', 0);
        $selectedReservation = $reservationId > 0
            ? $reservations->first(fn (Reservation $reservation) => $reservation->id === $reservationId)
            : null;

        return Inertia::render('invoices/index', [
            'invoices' => $query->get(),
            'services' => Service::orderByDesc('service_date')->get(['id', 'code', 'deceased_name', 'contractor_name', 'contractor_email']),
            'reservations' => $reservations,
            'selectedReservation' => $selectedReservation,
            'ufValue' => Funeraria::ufValue(),
            'afpUf' => Funeraria::afpUf(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        if ($request->filled('service_id') && $request->filled('reservation_id')) {
            return back()->with('error', 'Elija solo un origen: expediente o reserva.');
        }

        $reservation = ! empty($data['reservation_id'])
            ? Reservation::with('product')->findOrFail($data['reservation_id'])
            : null;

        $items = $data['items'] ?? [];
        if (! $items && $reservation) {
            $items = [[
                'description' => $reservation->product
                    ? 'Reserva '.$reservation->folio.' · '.$reservation->product->name
                    : 'Reserva '.$reservation->folio.' · '.$reservation->customer_name,
                'quantity' => 1,
                'unit_price' => $reservation->total_value,
            ]];
        }

        $amounts = $this->calculate($data, $request, $items);

        $invoice = DB::transaction(function () use ($data, $amounts, $items) {
            $invoice = Invoice::create([
                'folio' => $this->nextFolio(),
                'service_id' => $data['service_id'] ?? null,
                'reservation_id' => $data['reservation_id'] ?? null,
                'issue_date' => $data['issue_date'],
                ...$amounts,
            ]);

            $this->syncItems($invoice, $items);

            return $invoice;
        });

        $recipient = ! empty($data['service_id'])
            ? Service::find($data['service_id'])?->contractor_email
            : $reservation?->customer_email;

        $mailSent = false;
        if ($request->boolean('send_email') && $recipient) {
            $mailSent = Notifier::send($recipient, new InvoiceMail($invoice->load(['service', 'reservation'])));
            if ($mailSent) {
                $invoice->update(['email_sent' => true]);
            }
        }

        return redirect()->route('boletas.index')->with(
            'success',
            'Boleta '.$invoice->folio.' emitida.'.($mailSent ? ' Comprobante enviado.' : '')
        );
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->voided_at) {
            return back()->with('error', 'No se puede editar una boleta anulada.');
        }

        $data = $this->validateData($request);

        if ($request->filled('service_id') && $request->filled('reservation_id')) {
            return back()->with('error', 'Elija solo un origen: expediente o reserva.');
        }

        $items = $data['items'] ?? [];
        if (! $items && $invoice->reservation_id) {
            $reservation = $invoice->load('reservation.product')->reservation;
            $items = [[
                'description' => $reservation?->product
                    ? 'Reserva '.$reservation->folio.' · '.$reservation->product->name
                    : 'Reserva '.($reservation?->folio ?? '').' · '.($reservation?->customer_name ?? 'Cliente'),
                'quantity' => 1,
                'unit_price' => $reservation?->total_value ?? 0,
            ]];
        }

        $amounts = $this->calculate($data, $request, $items);

        DB::transaction(function () use ($invoice, $data, $amounts, $items) {
            $invoice->update([
                'service_id' => $data['service_id'] ?? null,
                'reservation_id' => $data['reservation_id'] ?? null,
                'issue_date' => $data['issue_date'],
                ...$amounts,
            ]);

            $invoice->items()->delete();
            $this->syncItems($invoice, $items);
        });

        return redirect()->route('boletas.index')->with('success', 'Boleta '.$invoice->folio.' actualizada.');
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'reason' => 'required|string|min:5|max:255',
        ]);

        $invoice->update([
            'voided_at' => now(),
            'void_reason' => $data['reason'],
        ]);

        return redirect()->route('boletas.index')->with('success', 'Boleta '.$invoice->folio.' anulada.');
    }

    public function print(Invoice $invoice)
    {
        $invoice->load(['items', 'service.product', 'reservation.product']);

        return Inertia::render('print/invoice', [
            'invoice' => $invoice,
            'company' => [
                'name' => 'Funeraria Cristo Rey',
                'rut' => '76.123.456-7',
                'address' => 'Av. Alemania 0450, Temuco, Chile',
                'phone' => '+56 45 221 4500',
            ],
        ]);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'service_id' => 'nullable|exists:services,id|required_without:reservation_id',
            'reservation_id' => 'nullable|exists:reservations,id|required_without:service_id',
            'issue_date' => 'required|date',
            'items' => 'nullable|array|min:1|required_without:reservation_id',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unit_price' => 'required_with:items|integer|min:0',
            'apply_afp' => 'boolean',
            'family_copay' => 'nullable|integer|min:0',
            'send_email' => 'boolean',
        ]);
    }

    private function calculate(array $data, Request $request, array $items): array
    {
        $net = 0;
        foreach ($items as $item) {
            $net += $item['quantity'] * $item['unit_price'];
        }

        $iva = (int) round($net * 0.19);
        $afp = $request->boolean('apply_afp') ? Funeraria::afpAmount() : 0;
        $copay = (int) ($data['family_copay'] ?? 0);

        return [
            'net_amount' => $net,
            'iva_amount' => $iva,
            'afp_discount' => $afp,
            'family_copay' => $copay,
            'total' => max(0, $net + $iva + $copay - $afp),
        ];
    }

    private function syncItems(Invoice $invoice, array $items): void
    {
        foreach ($items as $item) {
            $invoice->items()->create([
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal' => $item['quantity'] * $item['unit_price'],
            ]);
        }
    }

    private function nextFolio(): string
    {
        $prefix = 'BOL-'.now()->year.'-';
        $last = Invoice::where('folio', 'like', $prefix.'%')->max('folio');
        $sequence = $last ? (int) substr($last, strlen($prefix)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
