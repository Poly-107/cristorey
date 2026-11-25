<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
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
        $query = Invoice::with(['service', 'items'])->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($query) use ($search) {
                $query->where('folio', 'like', "%{$search}%")
                    ->orWhereHas('service', fn ($query) => $query->where('code', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('invoices/index', [
            'invoices' => $query->get(),
            'services' => Service::orderByDesc('service_date')->get(['id', 'code', 'deceased_name', 'contractor_name', 'contractor_email']),
            'ufValue' => Funeraria::ufValue(),
            'afpUf' => Funeraria::afpUf(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $amounts = $this->calculate($data, $request);

        $invoice = DB::transaction(function () use ($data, $amounts) {
            $invoice = Invoice::create([
                'folio' => $this->nextFolio(),
                'service_id' => $data['service_id'],
                'issue_date' => $data['issue_date'],
                ...$amounts,
            ]);

            $this->syncItems($invoice, $data['items']);

            return $invoice;
        });

        $service = Service::findOrFail($data['service_id']);
        $mailSent = false;
        if ($request->boolean('send_email')) {
            $mailSent = Notifier::send($service->contractor_email, new InvoiceMail($invoice->load('service')));
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
        $amounts = $this->calculate($data, $request);

        DB::transaction(function () use ($invoice, $data, $amounts) {
            $invoice->update([
                'service_id' => $data['service_id'],
                'issue_date' => $data['issue_date'],
                ...$amounts,
            ]);

            $invoice->items()->delete();
            $this->syncItems($invoice, $data['items']);
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
        $invoice->load(['items', 'service.product']);

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
            'service_id' => 'required|exists:services,id',
            'issue_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'apply_afp' => 'boolean',
            'family_copay' => 'nullable|integer|min:0',
            'send_email' => 'boolean',
        ]);
    }

    private function calculate(array $data, Request $request): array
    {
        $net = 0;
        foreach ($data['items'] as $item) {
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
