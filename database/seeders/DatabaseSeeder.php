<?php

namespace Database\Seeders;

use App\Models\Absence;
use App\Models\CalendarEvent;
use App\Models\CatalogItem;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\Trip;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\Funeraria;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = collect([
            ['name' => 'Renato Osses', 'email' => 'gerencia@cristorey.cl', 'role' => 'dueno'],
            ['name' => 'Encargado / Asistente', 'email' => 'encargado@cristorey.cl', 'role' => 'encargado'],
            ['name' => 'Mostrador / Atención', 'email' => 'mostrador@cristorey.cl', 'role' => 'mostrador'],
            ['name' => 'Chofer / Logística', 'email' => 'chofer@cristorey.cl', 'role' => 'chofer'],
        ])->map(fn (array $data) => User::updateOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'role' => $data['role'],
                'password' => Hash::make('password123'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        ));

        if (config('filesystems.default') === 's3') {
            foreach (['ataud.svg', 'urna.svg', 'urna-personalizada.svg'] as $demoImage) {
                Storage::disk('s3')->put(
                    'uploads/catalogo/'.$demoImage,
                    File::get(public_path('uploads/catalogo/'.$demoImage)),
                );
            }
        }

        $products = collect([
            ['name' => 'Ataúd Roble Nacional', 'category' => 'Ataúdes', 'length' => 200, 'width' => 70, 'height' => 60, 'material' => 'Roble', 'price' => 489000, 'stock' => 6, 'min' => 3, 'image' => 'uploads/catalogo/ataud.svg'],
            ['name' => 'Ataúd Nogal Premium', 'category' => 'Ataúdes', 'length' => 205, 'width' => 72, 'height' => 62, 'material' => 'Nogal', 'price' => 679000, 'stock' => 4, 'min' => 2, 'image' => 'uploads/catalogo/ataud.svg'],
            ['name' => 'Ataúd Familiar Económico', 'category' => 'Ataúdes', 'length' => 190, 'width' => 65, 'height' => 58, 'material' => 'Pino', 'price' => 329000, 'stock' => 10, 'min' => 3, 'image' => 'uploads/catalogo/ataud.svg'],
            ['name' => 'Urna Cineraria Mármol', 'category' => 'Urnas Cinerarias', 'length' => 30, 'width' => 30, 'height' => 45, 'material' => 'Mármol', 'price' => 189000, 'stock' => 8, 'min' => 3, 'image' => 'uploads/catalogo/urna.svg'],
            ['name' => 'Urna Cineraria Latón', 'category' => 'Urnas Cinerarias', 'length' => 28, 'width' => 28, 'height' => 42, 'material' => 'Latón', 'price' => 129000, 'stock' => 12, 'min' => 4, 'image' => 'uploads/catalogo/urna.svg'],
            ['name' => 'Urna Personalizada Grabada', 'category' => 'Urnas Personalizadas', 'length' => 32, 'width' => 32, 'height' => 48, 'material' => 'Cerámica', 'price' => 249000, 'stock' => 5, 'min' => 2, 'image' => 'uploads/catalogo/urna-personalizada.svg'],
            ['name' => 'Urna Personalizada Retrato', 'category' => 'Urnas Personalizadas', 'length' => 34, 'width' => 34, 'height' => 50, 'material' => 'Cerámica esmaltada', 'price' => 289000, 'stock' => 2, 'min' => 3, 'image' => 'uploads/catalogo/urna-personalizada.svg'],
        ])->map(fn (array $p) => CatalogItem::create([
            'name' => $p['name'], 'category' => $p['category'], 'length_cm' => $p['length'], 'width_cm' => $p['width'],
            'height_cm' => $p['height'], 'material' => $p['material'], 'price_clp' => $p['price'], 'stock' => $p['stock'],
            'min_stock' => $p['min'], 'image_path' => $p['image'], 'reference_url' => null, 'active' => true,
        ]));

        $services = collect([
            ['Juan Pablo Sandoval', 'María Sandoval', 'maria.sandoval@example.cl', 0, 'Sala Velatoria 1', 'En curso', -3],
            ['Rosa Elvira Contreras', 'Pedro Contreras', 'pedro.contreras@example.cl', 1, 'Capilla Central', 'Urgente', -1],
            ['Luis Alberto Fuentes', 'Ana Fuentes', 'ana.fuentes@example.cl', 3, 'Sala Velatoria 2', 'Documentos pendientes', 2],
            ['Carmen Gloria Vidal', 'Luis Vidal', null, 4, 'Sala de Ceremonias', 'En curso', 5],
            ['Héctor Ramírez Muñoz', 'Silvia Ramírez', 'silvia.ramirez@example.cl', 6, 'Sala Velatoria 3', 'En curso', 8],
            ['Antonia Beltrán Soto', 'Familia Beltrán', null, 2, 'Capilla Central', 'Documentos pendientes', 12],
        ])->map(function (array $s, int $index) use ($products) {
            return Service::create([
                'code' => 'SRV-'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),
                'service_date' => now()->addDays($s[6])->toDateString(),
                'deceased_name' => trim($s[0]),
                'contractor_name' => trim($s[1]),
                'contractor_email' => $s[2],
                'product_id' => $products[$s[3]]->id,
                'viewing_room' => $s[4],
                'status' => $s[5],
                'notes' => 'Servicio registrado por el sistema de gestión funeraria.',
            ]);
        });

        $reservationData = [
            ['Ataúd Roble Nacional', 'Familia Herrera', 489000, 150000, 'Reservado/Abonado'],
            ['Urna Personalizada Grabada', 'Claudia Pizarro', 249000, 249000, 'Pagado Total'],
            ['Urna Cineraria Mármol', 'Sergio Araya', 189000, 80000, 'Entregado'],
        ];

        foreach ($reservationData as $index => [$productName, $customer, $total, $paid, $status]) {
            $product = $products->firstWhere('name', $productName);
            $reservation = Reservation::create([
                'folio' => 'RES-'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),
                'product_id' => $product->id,
                'customer_name' => $customer,
                'customer_email' => 'cliente'.($index + 1).'@example.cl',
                'total_value' => $total,
                'paid_amount' => $paid,
                'status' => $status,
            ]);
            $reservation->payments()->create([
                'amount' => $paid,
                'paid_on' => now()->subDays(10 - $index)->toDateString(),
                'note' => 'Abono inicial',
            ]);
            $product->decrement('stock');
        }

        foreach ($services->take(3) as $index => $service) {
            $net = $index === 1 ? 1200000 : 350000 + $index * 50000;
            $iva = (int) round($net * 0.19);
            $afp = $index === 1 ? Funeraria::afpAmount() : 0;
            $copay = $index === 2 ? 50000 : 0;

            $invoice = Invoice::create([
                'folio' => 'BOL-'.now()->year.'-'.str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT),
                'service_id' => $service->id,
                'issue_date' => $service->service_date,
                'net_amount' => $net,
                'iva_amount' => $iva,
                'afp_discount' => $afp,
                'family_copay' => $copay,
                'total' => max(0, $net + $iva + $copay - $afp),
                'email_sent' => false,
            ]);

            $invoice->items()->createMany([
                ['description' => 'Servicio funerario - '.$service->deceased_name, 'quantity' => 1, 'unit_price' => $net - 40000, 'subtotal' => $net - 40000],
                ['description' => 'Traslado y gestiones administrativas', 'quantity' => 1, 'unit_price' => 40000, 'subtotal' => 40000],
            ]);
        }

        $voided = Invoice::create([
            'folio' => 'BOL-'.now()->year.'-000004',
            'service_id' => $services[3]->id,
            'issue_date' => now()->subDays(4)->toDateString(),
            'net_amount' => 300000,
            'iva_amount' => 57000,
            'afp_discount' => 0,
            'family_copay' => 0,
            'total' => 357000,
            'email_sent' => false,
            'voided_at' => now()->subDays(2),
            'void_reason' => 'Monto del copago ingresado incorrectamente.',
        ]);
        $voided->items()->create([
            'description' => 'Servicio funerario - '.$services[3]->deceased_name,
            'quantity' => 1, 'unit_price' => 300000, 'subtotal' => 300000,
        ]);

        Absence::create([
            'user_id' => $users[3]->id, 'worker_name' => $users[3]->name, 'position' => 'Chofer / Logística',
            'reason' => 'Permiso Administrativo', 'start_date' => now()->addDays(3)->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(), 'status' => 'Aprobada',
        ]);
        Absence::create([
            'user_id' => $users[2]->id, 'worker_name' => $users[2]->name, 'position' => 'Mostrador / Atención',
            'reason' => 'Día Compensatorio', 'start_date' => now()->addDays(6)->toDateString(),
            'end_date' => now()->addDays(6)->toDateString(), 'status' => 'Pendiente',
        ]);

        $vehicles = collect([
            ['Carroza Principal', 'AB-1234', 'Carroza', 6],
            ['Carroza Auxiliar', 'CD-5678', 'Carroza', 4],
            ['Furgón de Traslado', 'EF-9012', 'Furgón', 2],
        ])->map(fn (array $v) => Vehicle::create([
            'name' => $v[0], 'plate' => $v[1], 'type' => $v[2], 'capacity' => $v[3], 'status' => 'Disponible',
        ]));

        Trip::create([
            'vehicle_id' => $vehicles[0]->id, 'driver_id' => $users[3]->id, 'service_id' => $services[0]->id,
            'destination' => 'Cementerio Municipal de Temuco', 'trip_date' => now()->toDateString(),
            'start_time' => '10:30', 'status' => 'Programado', 'notes' => 'Traslado privado',
        ]);
        Trip::create([
            'vehicle_id' => $vehicles[1]->id, 'driver_id' => $users[3]->id, 'service_id' => $services[1]->id,
            'destination' => 'Crematorio Parque Aurora', 'trip_date' => now()->toDateString(),
            'start_time' => '15:00', 'status' => 'En curso', 'notes' => 'Coordinar con familia',
        ]);
        Trip::create([
            'vehicle_id' => $vehicles[2]->id, 'driver_id' => null, 'service_id' => $services[2]->id,
            'destination' => 'Clínica Regional', 'trip_date' => now()->addDay()->toDateString(),
            'start_time' => '09:00', 'status' => 'Programado',
        ]);

        $events = [
            ['Velatorio de '.$services[0]->deceased_name, 'Velatorio', 0, '19:00', '21:00', 'Sala Velatoria 1'],
            ['Ceremonia de '.$services[1]->deceased_name, 'Ceremonia', 1, '11:00', '12:30', 'Capilla Central'],
            ['Traslado al cementerio', 'Traslado', 2, '10:00', null, 'Cementerio Municipal'],
            ['Velatorio de '.$services[3]->deceased_name, 'Velatorio', 5, '18:00', '20:00', 'Sala de Ceremonias'],
        ];

        foreach ($events as [$title, $type, $offset, $start, $end, $location]) {
            CalendarEvent::create([
                'title' => $title, 'type' => $type,
                'event_date' => now()->addDays($offset)->toDateString(),
                'start_time' => $start, 'end_time' => $end, 'location' => $location,
            ]);
        }
    }
}
