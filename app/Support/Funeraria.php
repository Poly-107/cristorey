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

    public const QUOTE_STATUSES = ['Cotizada', 'Contratada', 'Anulada'];

    public const SERVICE_PACKAGE_CATEGORIES = [
        'Servicio completo',
        'Reserva anticipada',
        'Velatorio y ceremonia',
        'Traslados y cremación',
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
            'servicios' => false,
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
            'encargado' => [...$basic, 'servicios' => true, 'expedientes' => true, 'catalogo' => true, 'reservas' => true, 'informes' => true, 'ausencias' => true, 'calendario' => true, 'flota' => true],
            'mostrador' => [...$basic, 'servicios' => true, 'expedientes' => true, 'catalogo' => true, 'reservas' => true, 'boletas' => true, 'calendario' => true],
            'chofer' => [...$basic, 'flota' => true],
            default => $basic,
        };
    }

    public static function money(float|int $amount): string
    {
        return '$'.number_format($amount, 0, ',', '.');
    }
}
