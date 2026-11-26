<?php

namespace Database\Seeders;

use App\Models\FuneralPackage;
use Illuminate\Database\Seeder;

class FuneralPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'code' => 'PAQ-0001',
                'name' => 'Servicio funerario completo',
                'category' => 'Servicio completo',
                'description' => 'Coordinación integral desde la recepción hasta la despedida, con un responsable en cada etapa.',
                'base_price' => 790000,
                'includes' => ['Preparación y presentación', 'Sala velatoria', 'Gestiones administrativas'],
                'sort_order' => 1,
            ],
            [
                'code' => 'PAQ-0002',
                'name' => 'Reserva anticipada',
                'category' => 'Reserva anticipada',
                'description' => 'Asegure urnas y ataúdes con abonos parciales. Productos y saldo se cotizan por separado.',
                'base_price' => 150000,
                'includes' => ['Gestión de reserva', 'Abonos simples', 'Boleta al pagar el total'],
                'sort_order' => 2,
            ],
            [
                'code' => 'PAQ-0003',
                'name' => 'Velatorio y ceremonia',
                'category' => 'Velatorio y ceremonia',
                'description' => 'Espacios de despedida adaptados a la tradición y necesidades de cada familia.',
                'base_price' => 320000,
                'includes' => ['Salas velatorias', 'Capilla Central', 'Acompañamiento del equipo'],
                'sort_order' => 3,
            ],
            [
                'code' => 'PAQ-0004',
                'name' => 'Traslados y cremación',
                'category' => 'Traslados y cremación',
                'description' => 'Gestión de recorridos, traslados y coordinación con cementerios y crematorios.',
                'base_price' => 210000,
                'includes' => ['Carrozas y furgón', 'Coordinación de horarios', 'Gestiones con cementerio'],
                'sort_order' => 4,
            ],
        ];

        foreach ($packages as $package) {
            FuneralPackage::firstOrCreate(
                ['code' => $package['code']],
                [...$package, 'active' => true]
            );
        }
    }
}
