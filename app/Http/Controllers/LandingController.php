<?php

namespace App\Http\Controllers;

use App\Models\CatalogItem;
use App\Models\FuneralPackage;
use Inertia\Inertia;

class LandingController extends Controller
{
    /**
     * Página pública: solo lectura del catálogo activo.
     * No crea reservas ni expedientes; el equipo los registra en el sistema.
     */
    public function index()
    {
        $products = CatalogItem::where('active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->take(6)
            ->get(['id', 'name', 'category', 'price_clp', 'stock', 'image_path']);

        return Inertia::render('welcome', [
            'products' => $products,
            'servicePackages' => FuneralPackage::where('active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'base_price', 'includes']),
            'flow' => ['Reserva', 'Abonos', 'Pago total', 'Boleta'],
        ]);
    }
}
