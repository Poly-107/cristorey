import { Head, router } from '@inertiajs/react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, PageHeader, StatCard, Td, Th, TableShell, dateES, toneForStatus } from '@/components/funeraria/ui';

type ReportRow = { id: number; cells: string[] };
type SummaryItem = { label: string; value: string };

type Props = {
    type: string;
    types: Record<string, string>;
    filters: { type: string; start: string; end: string };
    columns: string[];
    rows: ReportRow[];
    summary: SummaryItem[];
};

const statusValues = ['En curso', 'Urgente', 'Documentos pendientes', 'Reservado/Abonado', 'Pagado Total', 'Entregado', 'Pendiente', 'Aprobada', 'Rechazada', 'Vigente', 'Anulada'];

export default function Reports({ type, types, filters, columns, rows, summary }: Props) {
    const [start, setStart] = useState(filters.start);
    const [end, setEnd] = useState(filters.end);
    const [reportType, setReportType] = useState(type);

    const query = `type=${encodeURIComponent(reportType)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    const apply = (nextType = reportType) => {
        router.get('/informes', { type: nextType, start, end }, { preserveState: true });
    };

    return (
        <>
            <Head title={`Informe de ${types[type] ?? 'servicios'}`} />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Informes por Rango de Fechas"
                    subtitle="Seleccione el tipo de informe, filtre por fechas y exporte a CSV/Excel o genere una vista de impresión."
                    actions={
                        <>
                            <a href={`/informes/exportar/csv?${query}`} className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-3 py-2 text-sm font-medium text-[#5a4a86] hover:bg-[#f1ecf8]">
                                <Download className="size-4" /> CSV
                            </a>
                            <a href={`/informes/exportar/excel?${query}`} className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-3 py-2 text-sm font-medium text-[#5a4a86] hover:bg-[#f1ecf8]">
                                <FileSpreadsheet className="size-4" /> Excel
                            </a>
                            <a href={`/informes/imprimir?${query}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-3 py-2 text-sm font-medium text-[#5a4a86] hover:bg-[#f1ecf8]">
                                <Printer className="size-4" /> Imprimir
                            </a>
                        </>
                    }
                />

                <Card className="mb-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <Field label="Tipo de informe">
                            <select
                                className="funeraria-input"
                                value={reportType}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setReportType(next);
                                    apply(next);
                                }}
                            >
                                {Object.entries(types).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha inicio"><input type="date" className="funeraria-input" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
                        <Field label="Fecha término"><input type="date" className="funeraria-input" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
                        <Button onClick={() => apply()}>Aplicar filtro</Button>
                    </div>
                </Card>

                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    {summary.map((item) => (
                        <StatCard key={item.label} label={item.label} value={item.value} hint={`${dateES(filters.start)} – ${dateES(filters.end)}`} />
                    ))}
                </div>

                <Card padded={false}>
                    {rows.length === 0 ? (
                        <div className="p-5"><EmptyState message="No hay registros en el rango de fechas seleccionado." /></div>
                    ) : (
                        <TableShell>
                            <thead>
                                <tr>{columns.map((column) => <Th key={column}>{column}</Th>)}</tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.cells.map((cell, index) => (
                                            <Td key={index} className={index === 0 ? 'font-medium text-[#5a4a86]' : ''}>
                                                {statusValues.includes(cell) ? (
                                                    <Badge tone={toneForStatus(cell)}>{cell}</Badge>
                                                ) : (
                                                    cell
                                                )}
                                            </Td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </Card>
                <p className="mt-3 text-xs text-[#8b8495]">Total de registros: {rows.length}</p>
            </div>
        </>
    );
}
