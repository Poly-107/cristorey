<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Service;
use App\Support\Funeraria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $type = $this->type($request);
        $filters = $this->filters($request, $type);

        return Inertia::render('reports/index', [
            ...$this->build($type, $filters),
            'type' => $type,
            'types' => Funeraria::REPORT_TYPES,
            'filters' => $filters,
        ]);
    }

    public function print(Request $request)
    {
        $type = $this->type($request);
        $filters = $this->filters($request, $type);

        return Inertia::render('print/report', [
            ...$this->build($type, $filters),
            'type' => $type,
            'typeLabel' => Funeraria::REPORT_TYPES[$type],
            'filters' => $filters,
        ]);
    }

    public function export(Request $request, string $format)
    {
        $type = $this->type($request);
        $filters = $this->filters($request, $type);
        $report = $this->build($type, $filters);

        $headers = $report['columns'];
        $rows = array_map(fn (array $row) => $row['cells'], $report['rows']);
        $filename = 'informe-'.$type;

        if ($format === 'excel') {
            $html = "\xEF\xBB\xBF".'<html><head><meta charset="UTF-8"></head><body><table border="1">';
            $html .= '<tr>'.implode('', array_map(fn ($h) => '<th>'.e($h).'</th>', $headers)).'</tr>';
            foreach ($rows as $row) {
                $html .= '<tr>'.implode('', array_map(fn ($cell) => '<td>'.e((string) $cell).'</td>', $row)).'</tr>';
            }
            $html .= '</table></body></html>';

            return response($html, 200, [
                'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="'.$filename.'.xls"',
            ]);
        }

        $csv = "\xEF\xBB\xBF".implode(';', $headers)."\n";
        foreach ($rows as $row) {
            $csv .= implode(';', array_map(fn ($cell) => '"'.str_replace('"', '""', (string) $cell).'"', $row))."\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'.csv"',
        ]);
    }

    private function type(Request $request): string
    {
        $type = (string) $request->input('type', 'servicios');

        return array_key_exists($type, Funeraria::REPORT_TYPES) ? $type : 'servicios';
    }

    private function filters(Request $request, string $type): array
    {
        return [
            'type' => $type,
            'start' => $request->input('start', now()->startOfMonth()->toDateString()),
            'end' => $request->input('end', now()->endOfMonth()->toDateString()),
        ];
    }

    private function build(string $type, array $filters): array
    {
        return match ($type) {
            'reservas' => $this->reservations($filters),
            'boletas' => $this->invoices($filters),
            'ausencias' => $this->absences($filters),
            default => $this->services($filters),
        };
    }

    private function services(array $filters): array
    {
        $items = Service::with('product')
            ->whereBetween('service_date', [$filters['start'], $filters['end']])
            ->orderBy('service_date')->get();

        return [
            'columns' => ['Folio', 'Fecha', 'Fallecido/a', 'Contratante', 'Producto', 'Sala velatoria', 'Estado'],
            'rows' => $items->map(fn (Service $service) => [
                'id' => $service->id,
                'cells' => [
                    $service->code,
                    $this->date($service->service_date),
                    $service->deceased_name,
                    $service->contractor_name ?? '—',
                    $service->product?->name ?? '—',
                    $service->viewing_room ?? '—',
                    $service->status,
                ],
            ])->all(),
            'summary' => [
                ['label' => 'Servicios en el período', 'value' => (string) $items->count()],
                ['label' => 'Urgentes', 'value' => (string) $items->where('status', 'Urgente')->count()],
                ['label' => 'Documentos pendientes', 'value' => (string) $items->where('status', 'Documentos pendientes')->count()],
            ],
        ];
    }

    private function reservations(array $filters): array
    {
        $items = Reservation::with('product')
            ->whereBetween('created_at', [$filters['start'].' 00:00:00', $filters['end'].' 23:59:59'])
            ->orderByDesc('id')->get();

        return [
            'columns' => ['Folio', 'Fecha', 'Cliente', 'Producto', 'Total', 'Abonado', 'Saldo', 'Estado'],
            'rows' => $items->map(fn (Reservation $reservation) => [
                'id' => $reservation->id,
                'cells' => [
                    $reservation->folio,
                    $this->date($reservation->created_at),
                    $reservation->customer_name,
                    $reservation->product?->name ?? '—',
                    Funeraria::money($reservation->total_value),
                    Funeraria::money($reservation->paid_amount),
                    Funeraria::money($reservation->pending),
                    $reservation->status,
                ],
            ])->all(),
            'summary' => [
                ['label' => 'Reservas en el período', 'value' => (string) $items->count()],
                ['label' => 'Total abonado', 'value' => Funeraria::money((int) $items->sum('paid_amount'))],
                ['label' => 'Saldo por cobrar', 'value' => Funeraria::money((int) $items->sum('pending'))],
            ],
        ];
    }

    private function invoices(array $filters): array
    {
        $items = Invoice::with('service')
            ->whereBetween('issue_date', [$filters['start'], $filters['end']])
            ->orderBy('issue_date')->get();

        return [
            'columns' => ['Folio', 'Fecha', 'Expediente', 'Fallecido/a', 'Neto', 'IVA', 'AFP', 'Copago', 'Total', 'Estado'],
            'rows' => $items->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'cells' => [
                    $invoice->folio,
                    $this->date($invoice->issue_date),
                    $invoice->service?->code ?? '—',
                    $invoice->service?->deceased_name ?? '—',
                    Funeraria::money($invoice->net_amount),
                    Funeraria::money($invoice->iva_amount),
                    $invoice->afp_discount > 0 ? '-'.Funeraria::money($invoice->afp_discount) : Funeraria::money(0),
                    Funeraria::money($invoice->family_copay),
                    Funeraria::money($invoice->total),
                    $invoice->voided_at ? 'Anulada' : 'Vigente',
                ],
            ])->all(),
            'summary' => [
                ['label' => 'Boletas vigentes', 'value' => (string) $items->whereNull('voided_at')->count()],
                ['label' => 'Total emitido', 'value' => Funeraria::money((int) $items->whereNull('voided_at')->sum('total'))],
                ['label' => 'Anuladas', 'value' => (string) $items->whereNotNull('voided_at')->count()],
            ],
        ];
    }

    private function absences(array $filters): array
    {
        $items = Absence::whereBetween('start_date', [$filters['start'], $filters['end']])
            ->orderBy('start_date')->get();

        return [
            'columns' => ['Trabajador', 'Cargo', 'Motivo', 'Desde', 'Hasta', 'Estado'],
            'rows' => $items->map(fn (Absence $absence) => [
                'id' => $absence->id,
                'cells' => [
                    $absence->worker_name,
                    $absence->position,
                    $absence->reason,
                    $this->date($absence->start_date),
                    $this->date($absence->end_date),
                    $absence->status,
                ],
            ])->all(),
            'summary' => [
                ['label' => 'Ausencias en el período', 'value' => (string) $items->count()],
                ['label' => 'Aprobadas', 'value' => (string) $items->where('status', 'Aprobada')->count()],
                ['label' => 'Pendientes', 'value' => (string) $items->where('status', 'Pendiente')->count()],
            ],
        ];
    }

    private function date(mixed $value): string
    {
        return date('d/m/Y', strtotime((string) $value));
    }
}
