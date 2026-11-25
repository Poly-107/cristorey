<?php

namespace App\Http\Controllers;

use App\Models\CatalogItem;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CatalogController extends Controller
{
    public function index()
    {
        return Inertia::render('catalog/index', [
            'items' => CatalogItem::orderBy('category')->orderBy('name')->get(),
            'categories' => Funeraria::CATEGORIES,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        unset($data['image']);
        $data['image_path'] = $this->storeImage($request);

        CatalogItem::create($data);

        return redirect()->route('catalogo.index')->with('success', 'Producto agregado al catálogo.');
    }

    public function update(Request $request, CatalogItem $catalogItem)
    {
        $data = $this->validateData($request);
        unset($data['image']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $this->storeImage($request);
        } elseif ($request->boolean('remove_image')) {
            $data['image_path'] = null;
        }

        $catalogItem->update($data);

        return redirect()->route('catalogo.index')->with('success', 'Producto actualizado.');
    }

    public function destroy(CatalogItem $catalogItem)
    {
        if ($catalogItem->services()->exists() || $catalogItem->reservations()->exists()) {
            return back()->with('error', 'No se puede eliminar: el producto está asociado a expedientes o reservas. Puede desactivarlo.');
        }

        $catalogItem->delete();

        return redirect()->route('catalogo.index')->with('success', 'Producto eliminado.');
    }

    private function validateData(Request $request): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:'.implode(',', Funeraria::CATEGORIES),
            'length_cm' => 'required|integer|min:1',
            'width_cm' => 'required|integer|min:1',
            'height_cm' => 'required|integer|min:1',
            'material' => 'nullable|string|max:255',
            'price_clp' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'reference_url' => 'nullable|url|max:500',
            'active' => 'boolean',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $data['active'] = $request->boolean('active');

        return $data;
    }

    private function storeImage(Request $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        $file = $request->file('image');
        $name = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            .'-'.time().'.'.$file->getClientOriginalExtension();

        if (config('filesystems.default') === 's3') {
            $path = Storage::disk('s3')->putFileAs('catalogo', $file, $name);

            return $path === false ? null : $path;
        }

        $directory = public_path('uploads/catalogo');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $file->move($directory, $name);

        return 'uploads/catalogo/'.$name;
    }
}
