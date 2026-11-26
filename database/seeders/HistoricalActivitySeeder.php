<?php

namespace Database\Seeders;

use App\Models\Absence;
use App\Models\CalendarEvent;
use App\Models\CatalogItem;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\ReservationPayment;
use App\Models\Service;
use App\Models\Trip;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\Funeraria;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Carga histórica de enero a octubre de 2026.
 *
 * Reglas:
 * - No modifica DatabaseSeeder, migraciones, controladores ni vistas.
 * - No crea CatalogItem ni sube imágenes: usa solo el catálogo existente en RDS/S3.
 * - No descuenta stock: son operaciones históricas, no ventas nuevas.
 * - Idempotente: firstOrCreate por code/folio/clave determinista.
 */
class HistoricalActivitySeeder extends Seeder
{
    /** 30 fechas entre el 05-01-2026 y el 28-10-2026, con más actividad en junio-agosto. */
    private const SERVICE_DATES = [
        '2026-01-06', '2026-01-15', '2026-01-26',
        '2026-02-04', '2026-02-13', '2026-02-24',
        '2026-03-05', '2026-03-17', '2026-03-26',
        '2026-04-07', '2026-04-16', '2026-04-27',
        '2026-05-06', '2026-05-20',
        '2026-06-03', '2026-06-11', '2026-06-19', '2026-06-27',
        '2026-07-06', '2026-07-14', '2026-07-22', '2026-07-29',
        '2026-08-04', '2026-08-12', '2026-08-20', '2026-08-28',
        '2026-09-08', '2026-09-21',
        '2026-10-07', '2026-10-19',
    ];

    /** 18 fechas de reserva; ninguna entra en noviembre, donde están las pruebas recientes. */
    private const RESERVATION_DATES = [
        '2026-01-09', '2026-01-23',
        '2026-02-10', '2026-02-21',
        '2026-03-11', '2026-03-25',
        '2026-04-09', '2026-04-23',
        '2026-05-12',
        '2026-06-08', '2026-06-24',
        '2026-07-10', '2026-07-24',
        '2026-08-11', '2026-08-25',
        '2026-09-10', '2026-09-24',
        '2026-10-13',
    ];

    private const DECEASED_NAMES = [
        'María Elena Rojas Fuentes', 'José Antonio Vergara López', 'Carmela Gloria Soto Medina',
        'Luis Hernán Bravo Cáceres', 'Ana María Delgado Pizarro', 'Pedro Pablo Ruiz Sandoval',
        'Gloria Andrea Muñoz Herrera', 'Rodrigo Alejandro Silva Tapia', 'Marta Elvira Contreras Ruiz',
        'Fernando José Aguilar Vega', 'Silvia Alejandra Flores Mena', 'Jorge Luis Paredes Cortés',
        'Elena Beatriz Romero Valdés', 'Miguel Ángel Sepúlveda Cruz', 'Patricia Irene Gutiérrez Núñez',
        'Cristián Andrés Molina Araya', 'Rosa Amelia Tapia Bravo', 'Manuel Jesús Cárcamo Oyarzo',
        'Lucy Elizabeth Carrasco Díaz', 'Óscar Eduardo Beltrán Soto', 'Norma Gladys Fuentes Alarcón',
        'Hugo Alberto Aranda Muñoz', 'Beatriz Carmen Cubillos Gómez', 'Ramón Ignacio Herrera Vidal',
        'Eliana Margarita Osorio Retamal', 'Juan Carlos Fuentes Ríos', 'Sonia Elizabeth Amaya Salas',
        'Alejandro Fabián Miranda Leiva', 'Mónica Loreto Peña Navarro', 'Sergio Eduardo Valenzuela Ruiz',
    ];

    private const CONTRACTOR_NAMES = [
        'Felipe Rojas Fuentes', 'Andrea Vergara López', 'Marcelo Soto Medina',
        'Jacqueline Bravo Cáceres', 'Cristina Delgado Pizarro', 'Pablo Ruiz Sandoval',
        'Esteban Muñoz Herrera', 'Claudia Silva Tapia', 'Ricardo Contreras Ruiz',
        'María José Aguilar Vega', 'Natalia Flores Mena', 'Luis Paredes Cortés',
        'Bernardita Romero Valdés', 'Claudia Sepúlveda Cruz', 'Patricio Gutiérrez Núñez',
        'Fernanda Molina Araya', 'Loreto Tapia Bravo', 'Javiera Cárcamo Oyarzo',
        'Enrique Carrasco Díaz', 'Soledad Beltrán Soto', 'Andrés Fuentes Alarcón',
        'Verónica Aranda Muñoz', 'Sebastián Cubillos Gómez', 'Paula Herrera Vidal',
        'Mauricio Osorio Retamal', 'Daniela Fuentes Ríos', 'Gabriela Amaya Salas',
        'Tomás Miranda Leiva', 'Macarena Peña Navarro', 'Ignacio Valenzuela Ruiz',
    ];

    private const CUSTOMER_NAMES = [
        'Familia Rojas Fuentes', 'Andrea Vergara', 'Marcelo Soto',
        'Jacqueline Bravo', 'Cristina Delgado', 'Pablo Ruiz',
        'Esteban Muñoz', 'Claudia Silva', 'Ricardo Contreras',
        'María José Aguilar', 'Natalia Flores', 'Luis Paredes',
        'Bernardita Romero', 'Patricio Gutiérrez', 'Fernanda Molina',
        'Loreto Tapia', 'Enrique Carrasco', 'Soledad Beltrán',
    ];

    private const VIEWING_ROOMS = ['Sala Velatoria 1', 'Sala Velatoria 2', 'Capilla Central'];

    private const DESTINATIONS = [
        'Cementerio Municipal de Temuco',
        'Crematorio Parque Aurora',
        'Cementerio Católico de Temuco',
        'Clínica Regional de Temuco',
        'Cementerio La Pampa',
        'Crematorio Los Ángeles',
    ];

    public function run(): void
    {
        $products = CatalogItem::orderBy('id')->get();

        if ($products->isEmpty()) {
            throw new \RuntimeException(
                'HistoricalActivitySeeder requiere productos en catalog_items. No se crearon productos nuevos para proteger las imágenes de S3.'
            );
        }

        DB::transaction(function () use ($products) {
            $productList = $products->values()->all();
            $services = $this->seedServices($productList);
            $this->seedServiceInvoices($services, $productList);

            $reservations = $this->seedReservations($productList);
            $this->seedReservationInvoices($reservations, $productList);

            $this->seedExtras($services);
        });

        $this->command?->info('HistoricalActivitySeeder: historial 2026 cargado o verificado sin duplicados.');
    }

    /**
     * @param  array<int, CatalogItem>  $products
     * @return \Illuminate\Support\Collection<int, Service>
     */
    private function seedServices(array $products)
    {
        return collect(self::SERVICE_DATES)->map(function (string $date, int $index) use ($products) {
            $code = 'SRV-'.str_pad((string) (101 + $index), 5, '0', STR_PAD_LEFT);
            $contractor = self::CONTRACTOR_NAMES[$index % count(self::CONTRACTOR_NAMES)];
            $createdAt = Carbon::parse($date.' 09:15:00');

            return Service::firstOrCreate(
                ['code' => $code],
                [
                    'service_date' => $date,
                    'deceased_name' => self::DECEASED_NAMES[$index % count(self::DECEASED_NAMES)],
                    'contractor_name' => $contractor,
                    'contractor_email' => Str::slug($contractor).($index + 101).'@'.($index % 2 === 0 ? 'gmail.com' : 'outlook.cl'),
                    'product_id' => $products[$index % count($products)]->id,
                    'viewing_room' => self::VIEWING_ROOMS[$index % count(self::VIEWING_ROOMS)],
                    'status' => ($index + 1) % 5 === 0 ? 'Documentos pendientes' : 'En curso',
                    'notes' => 'Servicio histórico 2026 cargado por HistoricalActivitySeeder.',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );
        });
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Service>  $services
     * @param  array<int, CatalogItem>  $products
     */
    private function seedServiceInvoices($services, array $products): void
    {
        foreach ($services->take(24)->values() as $index => $service) {
            $folio = 'BOL-2026-'.str_pad((string) (101 + $index), 6, '0', STR_PAD_LEFT);
            $product = $products[$index % count($products)];
            $net = $product->price_clp + 40000 + ($index % 4) * 15000;
            $afp = ($index % 5 === 2) ? Funeraria::afpAmount() : 0;

            if ($afp > 0) {
                $net = max($net, 900000);
            }

            $iva = (int) round($net * 0.19);
            $copay = ($index % 6 === 4) ? 25000 + ($index % 3) * 5000 : 0;
            $total = max(0, $net + $iva + $copay - $afp);
            $issuedAt = Carbon::parse($service->service_date->toDateString().' 11:00:00');

            $invoice = Invoice::firstOrCreate(
                ['folio' => $folio],
                [
                    'service_id' => $service->id,
                    'reservation_id' => null,
                    'issue_date' => $service->service_date,
                    'net_amount' => $net,
                    'iva_amount' => $iva,
                    'afp_discount' => $afp,
                    'family_copay' => $copay,
                    'total' => $total,
                    'email_sent' => false,
                    'created_at' => $issuedAt,
                    'updated_at' => $issuedAt,
                ]
            );

            if ($invoice->items()->doesntExist()) {
                $invoice->items()->createMany([
                    [
                        'description' => 'Servicio funerario - '.$service->deceased_name,
                        'quantity' => 1,
                        'unit_price' => $net - 40000,
                        'subtotal' => $net - 40000,
                    ],
                    [
                        'description' => 'Traslado y gestiones administrativas',
                        'quantity' => 1,
                        'unit_price' => 40000,
                        'subtotal' => 40000,
                    ],
                ]);
            }
        }
    }

    /**
     * @param  array<int, CatalogItem>  $products
     * @return \Illuminate\Support\Collection<int, Reservation>
     */
    private function seedReservations(array $products)
    {
        return collect(self::RESERVATION_DATES)->map(function (string $date, int $index) use ($products) {
            $folio = 'RES-'.str_pad((string) (101 + $index), 5, '0', STR_PAD_LEFT);
            $product = $products[($index + 2) % count($products)];
            $customer = self::CUSTOMER_NAMES[$index % count(self::CUSTOMER_NAMES)];
            $total = $product->price_clp;
            $isPaid = $index < 14;
            $paid = $isPaid ? $total : (int) round($total * 0.45);
            $status = $isPaid
                ? (($index % 3 === 0) ? 'Entregado' : 'Pagado Total')
                : 'Reservado/Abonado';
            $createdAt = Carbon::parse($date.' 10:30:00');

            $reservation = Reservation::firstOrCreate(
                ['folio' => $folio],
                [
                    'product_id' => $product->id,
                    'customer_name' => $customer,
                    'customer_email' => Str::slug($customer).($index + 101).'@'.($index % 2 === 0 ? 'gmail.com' : 'outlook.cl'),
                    'total_value' => $total,
                    'paid_amount' => $paid,
                    'status' => $status,
                    'notes' => 'Reserva histórica 2026 cargada por HistoricalActivitySeeder.',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );

            $weights = $isPaid ? [0.40, 0.35] : [1.0];
            $remaining = $paid;

            foreach ($weights as $paymentIndex => $weight) {
                $amount = $paymentIndex === array_key_last($weights)
                    ? $remaining
                    : (int) round($total * $weight);
                $remaining = max(0, $remaining - $amount);
                $note = 'Abono histórico '.($paymentIndex + 1).' · '.$folio;

                ReservationPayment::firstOrCreate(
                    ['reservation_id' => $reservation->id, 'note' => $note],
                    [
                        'amount' => $amount,
                        'paid_on' => Carbon::parse($date)->addDays($paymentIndex * 6)->toDateString(),
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]
                );
            }

            return $reservation;
        });
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Reservation>  $reservations
     * @param  array<int, CatalogItem>  $products
     */
    private function seedReservationInvoices($reservations, array $products): void
    {
        foreach ($reservations->take(8)->values() as $index => $reservation) {
            $folio = 'BOL-2026-'.str_pad((string) (125 + $index), 6, '0', STR_PAD_LEFT);
            $net = (int) $reservation->total_value;
            $iva = (int) round($net * 0.19);
            $issueDate = Carbon::parse($reservation->created_at->toDateString())->addDays(7)->toDateString();
            $issuedAt = Carbon::parse($issueDate.' 11:30:00');
            $product = collect($products)->firstWhere('id', $reservation->product_id);
            $description = 'Reserva '.$reservation->folio.' · '.$reservation->customer_name
                .($product ? ' · '.$product->name : '');

            $invoice = Invoice::firstOrCreate(
                ['folio' => $folio],
                [
                    'service_id' => null,
                    'reservation_id' => $reservation->id,
                    'issue_date' => $issueDate,
                    'net_amount' => $net,
                    'iva_amount' => $iva,
                    'afp_discount' => 0,
                    'family_copay' => 0,
                    'total' => $net + $iva,
                    'email_sent' => false,
                    'created_at' => $issuedAt,
                    'updated_at' => $issuedAt,
                ]
            );

            if ($invoice->items()->doesntExist()) {
                $invoice->items()->create([
                    'description' => $description,
                    'quantity' => 1,
                    'unit_price' => $net,
                    'subtotal' => $net,
                ]);
            }
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Service>  $services
     */
    private function seedExtras($services): void
    {
        $this->seedAbsences();
        $this->seedTrips($services);
        $this->seedCalendarEvents($services);
    }

    private function seedAbsences(): void
    {
        $records = [
            ['chofer', 'Licencia Médica', '2026-03-16', '2026-03-18', 'Aprobada'],
            ['mostrador', 'Permiso Administrativo', '2026-05-07', '2026-05-07', 'Aprobada'],
            ['encargado', 'Día Compensatorio', '2026-07-22', '2026-07-22', 'Aprobada'],
            ['chofer', 'Permiso Administrativo', '2026-09-14', '2026-09-15', 'Aprobada'],
        ];

        foreach ($records as [$role, $reason, $start, $end, $status]) {
            $user = User::where('role', $role)->first();
            $worker = $user?->name ?? Funeraria::ROLE_LABELS[$role];
            $position = Funeraria::ROLE_LABELS[$role];
            $stamp = Carbon::parse($start.' 08:00:00');

            Absence::firstOrCreate(
                [
                    'worker_name' => $worker,
                    'start_date' => Carbon::parse($start)->toDateTimeString(),
                    'reason' => $reason,
                ],
                [
                    'user_id' => $user?->id,
                    'position' => $position,
                    'end_date' => $end,
                    'status' => $status,
                    'notes' => 'Ausencia histórica 2026 cargada por HistoricalActivitySeeder.',
                    'created_at' => $stamp,
                    'updated_at' => $stamp,
                ]
            );
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Service>  $services
     */
    private function seedTrips($services): void
    {
        $vehicles = Vehicle::orderBy('id')->get();

        if ($vehicles->isEmpty()) {
            return;
        }

        $driverId = User::where('role', 'chofer')->first()?->id;

        foreach ($services->take(6)->values() as $index => $service) {
            $note = 'Traslado histórico '.$service->code;
            $tripDate = $service->service_date->toDateString();
            $stamp = Carbon::parse($tripDate.' 08:30:00');

            Trip::firstOrCreate(
                ['service_id' => $service->id, 'notes' => $note],
                [
                    'vehicle_id' => $vehicles[$index % $vehicles->count()]->id,
                    'driver_id' => $driverId,
                    'destination' => self::DESTINATIONS[$index % count(self::DESTINATIONS)],
                    'trip_date' => $tripDate,
                    'start_time' => '09:00',
                    'end_time' => '11:00',
                    'status' => 'Finalizado',
                    'created_at' => $stamp,
                    'updated_at' => $stamp,
                ]
            );
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Service>  $services
     */
    private function seedCalendarEvents($services): void
    {
        foreach ($services->take(6)->values() as $index => $service) {
            $type = Funeraria::EVENT_TYPES[$index % count(Funeraria::EVENT_TYPES)];
            $title = $type.' de '.$service->deceased_name;
            $eventDate = $service->service_date->toDateString();
            $stamp = Carbon::parse($eventDate.' 12:00:00');

            CalendarEvent::firstOrCreate(
                ['title' => $title, 'event_date' => Carbon::parse($eventDate)->toDateTimeString()],
                [
                    'type' => $type,
                    'start_time' => $type === 'Ceremonia' ? '11:00' : '19:00',
                    'end_time' => $type === 'Ceremonia' ? '12:30' : '21:00',
                    'location' => $service->viewing_room ?? 'Capilla Central',
                    'service_id' => $service->id,
                    'notes' => 'Evento histórico 2026 cargado por HistoricalActivitySeeder.',
                    'created_at' => $stamp,
                    'updated_at' => $stamp,
                ]
            );
        }
    }
}
