<?php

namespace App\Http\Controllers;

use App\Mail\ServiceOrderMail;
use App\Models\CatalogItem;
use App\Models\Service;
use App\Support\Funeraria;
use App\Support\Notifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('product')->orderByDesc('service_date');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('deceased_name', 'like', "%{$search}%")
                    ->orWhere('contractor_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return Inertia::render('services/index', [
            'services' => $query->get(),
            'products' => CatalogItem::where('active', true)->orderBy('name')->get(['id', 'name', 'category', 'stock']),
            'statuses' => Funeraria::SERVICE_STATUSES,
            'rooms' => ['Sala Velatoria 1', 'Sala Velatoria 2', 'Sala Velatoria 3', 'Capilla Central', 'Sala de Ceremonias'],
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $service = Service::create([
            ...$data,
            'code' => $this->nextCode(),
        ]);

        $mailSent = false;
        if ($request->boolean('send_email')) {
            $service->load('product');
            $mailSent = Notifier::send($service->contractor_email, new ServiceOrderMail($service));
        }

        return redirect()->route('expedientes.index')->with(
            'success',
            'Expediente '.$service->code.' creado.'.($mailSent ? ' Correo enviado.' : '')
        );
    }

    public function update(Request $request, Service $service)
    {
        $service->update($this->validateData($request));

        $mailSent = false;
        if ($request->boolean('send_email')) {
            $service->load('product');
            $mailSent = Notifier::send($service->contractor_email, new ServiceOrderMail($service));
        }

        return redirect()->route('expedientes.index')->with(
            'success',
            'Expediente actualizado.'.($mailSent ? ' Correo enviado.' : '')
        );
    }

    public function destroy(Service $service)
    {
        $service->delete();

        return redirect()->route('expedientes.index')->with('success', 'Expediente eliminado.');
    }

    public function print(Service $service)
    {
        $service->load('product');

        return Inertia::render('print/service-order', [
            'service' => $service,
            'company' => $this->company(),
        ]);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'service_date' => 'required|date',
            'deceased_name' => 'required|string|max:255',
            'contractor_name' => 'nullable|string|max:255',
            'contractor_email' => 'nullable|email|max:255',
            'product_id' => 'nullable|exists:catalog_items,id',
            'viewing_room' => 'nullable|string|max:255',
            'status' => 'required|in:'.implode(',', Funeraria::SERVICE_STATUSES),
            'notes' => 'nullable|string',
        ]);
    }

    private function nextCode(): string
    {
        do {
            $code = 'SRV-'.str_pad((string) (Service::max('id') + 1), 5, '0', STR_PAD_LEFT);
        } while (Service::where('code', $code)->exists());

        return $code;
    }

    private function company(): array
    {
        return [
            'name' => 'Funeraria Cristo Rey',
            'address' => 'Av. Alemania 0450, Temuco, Chile',
            'phone' => '+56 45 221 4500',
            'email' => 'contacto@cristorey.cl',
        ];
    }
}
