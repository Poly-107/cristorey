<?php

namespace App\Http\Controllers;

use App\Models\FuneralPackage;
use App\Models\Quote;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FuneralPackageController extends Controller
{
    public function index()
    {
        return Inertia::render('servicios/index', [
            'packages' => FuneralPackage::orderBy('sort_order')->orderBy('name')->get(),
            'categories' => Funeraria::SERVICE_PACKAGE_CATEGORIES,
            'quotesCount' => Quote::count(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        FuneralPackage::create([
            ...$data,
            'includes' => $data['includes'] ?? [],
            'code' => $this->nextCode(),
        ]);

        return redirect()->route('servicios.index')->with('success', 'Servicio funerario agregado al catálogo.');
    }

    public function update(Request $request, FuneralPackage $funeralPackage)
    {
        $data = $this->validateData($request);

        $funeralPackage->update([
            ...$data,
            'includes' => $data['includes'] ?? [],
        ]);

        return redirect()->route('servicios.index')->with('success', 'Servicio funerario actualizado.');
    }

    public function destroy(FuneralPackage $funeralPackage)
    {
        $funeralPackage->delete();

        return redirect()->route('servicios.index')->with('success', 'Servicio funerario eliminado del catálogo.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:'.implode(',', Funeraria::SERVICE_PACKAGE_CATEGORIES),
            'description' => 'nullable|string',
            'base_price' => 'required|integer|min:0',
            'includes' => 'nullable|array',
            'includes.*' => 'string|max:255',
            'active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);
    }

    private function nextCode(): string
    {
        do {
            $code = 'PAQ-'.str_pad((string) (FuneralPackage::max('id') + 1), 4, '0', STR_PAD_LEFT);
        } while (FuneralPackage::where('code', $code)->exists());

        return $code;
    }
}
