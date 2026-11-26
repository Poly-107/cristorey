<?php

namespace App\Http\Controllers;

use App\Mail\ServiceOrderMail;
use App\Models\CatalogItem;
use App\Models\FuneralPackage;
use App\Models\Quote;
use App\Models\Service;
use App\Support\Funeraria;
use App\Support\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuoteController extends Controller
{
    public function index()
    {
        return Inertia::render('servicios/cotizaciones', [
            'quotes' => Quote::with(['items', 'package', 'service'])->orderByDesc('id')->get(),
            'packages' => FuneralPackage::where('active', true)->orderBy('sort_order')->orderBy('name')->get(),
            'products' => CatalogItem::where('active', true)->orderBy('name')->get(['id', 'name', 'category', 'stock', 'price_clp']),
            'statuses' => Funeraria::QUOTE_STATUSES,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $items = $this->resolveItems($data);

        [$net, $iva, $total] = $this->calculate($items);

        DB::transaction(function () use ($data, $items, $total) {
            $quote = Quote::create([
                'folio' => $this->nextFolio(),
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'deceased_name' => $data['deceased_name'] ?? null,
                'service_date' => $data['service_date'] ?? null,
                'funeral_package_id' => $data['funeral_package_id'] ?? null,
                'status' => 'Cotizada',
                'total' => $total,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncItems($quote, $items);
        });

        return redirect()->route('servicios.cotizaciones.index')->with('success', 'Cotización registrada.');
    }

    public function update(Request $request, Quote $quote)
    {
        if ($quote->status !== 'Cotizada') {
            return back()->with('error', 'Solo se pueden editar cotizaciones pendientes.');
        }

        $data = $this->validateData($request);
        $items = $this->resolveItems($data);

        [$net, $iva, $total] = $this->calculate($items);

        DB::transaction(function () use ($quote, $data, $items, $total) {
            $quote->update([
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'deceased_name' => $data['deceased_name'] ?? null,
                'service_date' => $data['service_date'] ?? null,
                'funeral_package_id' => $data['funeral_package_id'] ?? null,
                'total' => $total,
                'notes' => $data['notes'] ?? null,
            ]);

            $quote->items()->delete();
            $this->syncItems($quote, $items);
        });

        return redirect()->route('servicios.cotizaciones.index')->with('success', 'Cotización actualizada.');
    }

    public function destroy(Quote $quote)
    {
        if ($quote->status === 'Contratada') {
            return back()->with('error', 'No se puede eliminar una cotización ya contratada.');
        }

        $quote->delete();

        return redirect()->route('servicios.cotizaciones.index')->with('success', 'Cotización eliminada.');
    }

    public function contratar(Request $request, Quote $quote)
    {
        if ($quote->status !== 'Cotizada') {
            return back()->with('error', 'Esta cotización ya fue contratada o anulada.');
        }

        $data = $request->validate(['send_email' => 'boolean']);

        $service = DB::transaction(function () use ($quote) {
            $service = Service::create([
                'code' => $this->nextServiceCode(),
                'service_date' => $quote->service_date?->toDateString() ?? now()->toDateString(),
                'deceased_name' => $quote->deceased_name ?: $quote->customer_name,
                'contractor_name' => $quote->customer_name,
                'contractor_email' => $quote->customer_email,
                'product_id' => null,
                'funeral_package_id' => $quote->funeral_package_id,
                'quote_id' => $quote->id,
                'viewing_room' => null,
                'status' => 'En curso',
                'notes' => 'Cotización '.$quote->folio.'.'.($quote->notes ? ' '.$quote->notes : ''),
            ]);

            $quote->update([
                'status' => 'Contratada',
                'contracted_at' => now(),
            ]);

            return $service;
        });

        $mailSent = false;
        if ($request->boolean('send_email') && $service->contractor_email) {
            $mailSent = Notifier::send($service->contractor_email, new ServiceOrderMail($service->load('product')));
        }

        return redirect()->route('expedientes.index')->with(
            'success',
            'Expediente '.$service->code.' creado desde la cotización '.$quote->folio.'.'.($mailSent ? ' Correo enviado.' : '')
        );
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'deceased_name' => 'nullable|string|max:255',
            'service_date' => 'nullable|date',
            'funeral_package_id' => 'nullable|exists:funeral_packages,id|required_without:items',
            'items' => 'nullable|array|min:1|required_without:funeral_package_id',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unit_price' => 'required_with:items|integer|min:0',
            'notes' => 'nullable|string',
        ]);
    }

    private function resolveItems(array $data): array
    {
        if (! empty($data['items'])) {
            return $data['items'];
        }

        $package = FuneralPackage::findOrFail($data['funeral_package_id']);

        return [[
            'description' => $package->name,
            'quantity' => 1,
            'unit_price' => $package->base_price,
        ]];
    }

    private function calculate(array $items): array
    {
        $net = 0;

        foreach ($items as $item) {
            $net += (int) $item['quantity'] * (int) $item['unit_price'];
        }

        $net = (int) $net;
        $iva = (int) round($net * 0.19);

        return [$net, $iva, $net + $iva];
    }

    private function syncItems(Quote $quote, array $items): void
    {
        foreach ($items as $item) {
            $quantity = (int) $item['quantity'];
            $unitPrice = (int) $item['unit_price'];

            $quote->items()->create([
                'description' => $item['description'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $quantity * $unitPrice,
            ]);
        }
    }

    private function nextFolio(): string
    {
        $prefix = 'COT-'.now()->year.'-';
        $last = Quote::where('folio', 'like', $prefix.'%')->max('folio');
        $sequence = $last ? (int) substr($last, strlen($prefix)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }

    private function nextServiceCode(): string
    {
        do {
            $code = 'SRV-'.str_pad((string) (Service::max('id') + 1), 5, '0', STR_PAD_LEFT);
        } while (Service::where('code', $code)->exists());

        return $code;
    }
}
