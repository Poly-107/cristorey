<?php

namespace App\Support;

final class Funeraria
{
    public const ROLES = ['dueno', 'encargado', 'mostrador', 'chofer'];

    public const ROLE_LABELS = [
        'dueno' => 'Dueño / Gerencia',
        'encargado' => 'Encargado / Asistente',
        'mostrador' => 'Mostrador / Atención',
        'chofer' => 'Chofer / Logística',
    ];

    public const CATEGORIES = ['Ataúdes', 'Urnas Cinerarias', 'Urnas Personalizadas'];

    public const SERVICE_STATUSES = ['En curso', 'Urgente', 'Documentos pendientes'];

    public const RESERVATION_STATUSES = ['Reservado/Abonado', 'Pagado Total', 'Entregado'];

    public const ABSENCE_REASONS = ['Permiso Administrativo', 'Licencia Médica', 'Día Compensatorio'];

    public const ABSENCE_STATUSES = ['Pendiente', 'Aprobada', 'Rechazada'];

    public const EVENT_TYPES = ['Velatorio', 'Ceremonia', 'Traslado'];

    public const TRIP_STATUSES = ['Programado', 'En curso', 'Finalizado'];

    /** Servicios comerciales mostrados en la landing; no crean registros ni reemplazan Expedientes. */
    public const LANDING_SERVICES = [
        [
            'title' => 'Servicio funerario completo',
            'description' => 'Coordinación integral desde la recepción hasta la despedida, con un responsable en cada etapa.',
            'includes' => ['Preparación y presentación', 'Sala velatoria', 'Gestiones administrativas'],
            'action' => 'Coordinar servicio',
        ],
        [
            'title' => 'Reserva anticipada',
            'description' => 'Asegure ataúdes y urnas con abonos parciales. El saldo se cancela antes de emitir la boleta.',
            'includes' => ['Ataúdes y urnas en stock', 'Abonos simples', 'Boleta al pagar el total'],
            'action' => 'Consultar reserva',
        ],
        [
            'title' => 'Velatorio y ceremonia',
            'description' => 'Espacios de despedida adaptados a la tradición y necesidades de cada familia.',
            'includes' => ['Salas velatorias', 'Capilla Central', 'Acompañamiento del equipo'],
            'action' => 'Consultar salas',
        ],
        [
            'title' => 'Traslados y cremación',
            'description' => 'Gestión de recorridos, traslados y coordinación con cementerios y crematorios.',
            'includes' => ['Carrozas y furgón', 'Coordinación de horarios', 'Gestiones con cementerio'],
            'action' => 'Consultar traslado',
        ],
    ];

    public const REPORT_TYPES = [
        'servicios' => 'Expedientes',
        'reservas' => 'Reservas',
        'boletas' => 'Boletas',
        'ausencias' => 'Ausencias',
    ];

    /** Valor de referencia de la UF usado para el cálculo de la Cuota Mortuoria. */
    public static function ufValue(): int
    {
        return (int) config('funeraria.uf_value', 39000);
    }

    public static function afpUf(): int
    {
        return (int) config('funeraria.afp_uf', 15);
    }

    public static function afpAmount(): int
    {
        return self::afpUf() * self::ufValue();
    }

    public static function roleLabel(?string $role): string
    {
        return self::ROLE_LABELS[$role] ?? 'Sin rol';
    }

    public static function permissions(?string $role): array
    {
        $basic = [
            'dashboard' => true,
            'expedientes' => false,
            'catalogo' => false,
            'reservas' => false,
            'boletas' => false,
            'informes' => false,
            'ausencias' => false,
            'calendario' => false,
            'flota' => false,
            'usuarios' => false,
            'finanzas' => false,
        ];

        return match ($role) {
            'dueno' => array_map(fn () => true, $basic),
            'encargado' => [...$basic, 'expedientes' => true, 'catalogo' => true, 'reservas' => true, 'informes' => true, 'ausencias' => true, 'calendario' => true, 'flota' => true],
            'mostrador' => [...$basic, 'expedientes' => true, 'catalogo' => true, 'reservas' => true, 'boletas' => true, 'calendario' => true],
            'chofer' => [...$basic, 'flota' => true],
            default => $basic,
        };
    }

    public static function money(float|int $amount): string
    {
        return '$'.number_format($amount, 0, ',', '.');
    }
}
