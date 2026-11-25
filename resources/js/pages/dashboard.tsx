import { Head, Link, usePage } from '@inertiajs/react';
import {
    Archive,
    CalendarDays,
    ClipboardList,
    FileText,
    Receipt,
    Truck,
    Users,
} from 'lucide-react';
import { Badge, Card, CardTitle, PageHeader, StatCard, clp, dateES, toneForStatus } from '@/components/funeraria/ui';
import { dashboard } from '@/routes';

type Props = {
    stats: { services: number; urgent: number; stock: number; reservations: number; invoices: number };
    byStatus: Record<string, number>;
    stockByCategory: Record<string, number>;
    financial: {
        invoices_total: number;
        payments_received: number;
        pending_balance: number;
        invoice_count: number;
        voided_count: number;
        active_users: number;
        low_stock: number;
        pending_absences: number;
        trips_in_progress: number;
        monthly: Record<string, number>;
        aging: Record<string, number>;
    } | null;
    upcoming: Array<{ id: number; title: string; type: string; event_date: string; start_time: string | null; location: string | null }>;
    myTrips: Array<{ id: number; destination: string; trip_date: string; start_time: string | null; status: string; vehicle: { name: string }; driver: { name: string } | null }>;
    recentServices: Array<{ id: number; code: string; deceased_name: string; service_date: string; status: string; viewing_room: string | null }>;
    constants: { statuses: string[]; categories: string[] };
};

function Bars({ data, total }: { data: Record<string, number | string>; total: number }) {
    const entries = Object.entries(data).map(([label, value]) => ({
        label,
        value,
        numeric: typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, '')) || 0,
    }));
    const max = Math.max(1, ...entries.map((entry) => entry.numeric));

    return (
        <div className="space-y-4">
            {entries.map(({ label, value, numeric }) => (
                <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-[#5f576e]">{label}</span>
                        <span className="font-medium text-[#2d2542]">{value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#f1ecf8]">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#7b68ae] to-[#a493ce]"
                            style={{ width: `${Math.max(3, (numeric / max) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
            {entries.length === 0 && <p className="text-sm text-[#8b8495]">Sin datos registrados.</p>}
            <p className="pt-1 text-xs text-[#8b8495]">Total considerado: {total}</p>
        </div>
    );
}

function monthLabel(key: string): string {
    return new Date(`${key}-01T12:00:00`).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
}

export default function Dashboard({
    stats,
    byStatus,
    stockByCategory,
    financial,
    upcoming,
    myTrips,
    recentServices,
}: Props) {
    const { role, roleLabel, can } = usePage().props;
    const isDriver = role === 'chofer';

    return (
        <>
            <Head title="Panel General" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title={isDriver ? 'Mi hoja de ruta' : 'Panel General'}
                    subtitle={`Bienvenido/a al sistema de gestión · Perfil: ${roleLabel}`}
                    actions={
                        can.flota ? (
                            <Link
                                href="/flota"
                                className="inline-flex items-center gap-2 rounded-lg border border-[#e5dfd5] bg-white px-3 py-2 text-sm font-medium text-[#5a4a86] hover:bg-[#f1ecf8]"
                            >
                                <Truck className="size-4" /> Ver hoja de ruta
                            </Link>
                        ) : undefined
                    }
                />

                {!isDriver && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard label="Expedientes" value={stats.services} icon={<FileText className="size-5" />} />
                            <StatCard label="Urgentes" value={stats.urgent} tone="amber" icon={<ClipboardList className="size-5" />} hint="Requieren atención inmediata" />
                            <StatCard label="Stock disponible" value={stats.stock} tone="green" icon={<Archive className="size-5" />} />
                            <StatCard label="Reservas activas" value={stats.reservations} tone="blue" icon={<CalendarDays className="size-5" />} />
                        </div>

                        <div className="mt-5 grid gap-5 lg:grid-cols-2">
                            <Card>
                                <CardTitle subtitle="Distribución de los expedientes registrados">Expedientes por estado</CardTitle>
                                <Bars data={byStatus} total={stats.services} />
                            </Card>
                            <Card>
                                <CardTitle subtitle="Unidades disponibles por línea de producto">Stock por categoría</CardTitle>
                                <Bars data={stockByCategory} total={stats.stock} />
                            </Card>
                        </div>
                    </>
                )}

                {financial && (
                    <Card className="mt-5 border-[#ddd3ef] bg-[#fcfbfe]">
                        <div className="mb-4 flex items-center gap-2">
                            <Users className="size-5 text-[#7b68ae]" />
                            <div>
                                <h2 className="text-base font-semibold">Resumen financiero y administrativo</h2>
                                <p className="text-xs text-[#8b8495]">Información exclusiva de Dueño / Gerencia</p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="Recaudación total" value={clp(financial.invoices_total)} icon={<Receipt className="size-5" />} hint={`${financial.invoice_count} boletas emitidas`} />
                            <StatCard label="Abonos recibidos" value={clp(financial.payments_received)} tone="green" icon={<ClipboardList className="size-5" />} />
                            <StatCard label="Saldos por cobrar" value={clp(financial.pending_balance)} tone="amber" icon={<FileText className="size-5" />} />
                            <StatCard label="Colaboradores activos" value={financial.active_users} tone="blue" icon={<Users className="size-5" />} />
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-[#5f576e] sm:grid-cols-4">
                            <p>Productos con stock bajo: <strong className="text-[#2d2542]">{financial.low_stock}</strong></p>
                            <p>Ausencias pendientes: <strong className="text-[#2d2542]">{financial.pending_absences}</strong></p>
                            <p>Recorridos en curso: <strong className="text-[#2d2542]">{financial.trips_in_progress}</strong></p>
                            <p>Boletas anuladas: <strong className="text-[#2d2542]">{financial.voided_count}</strong></p>
                        </div>
                        <div className="mt-6 grid gap-5 lg:grid-cols-2">
                            <Card>
                                <CardTitle subtitle="Facturación de los últimos 6 meses">Evolución mensual</CardTitle>
                                <Bars
                                    data={Object.fromEntries(Object.entries(financial.monthly).map(([key, value]) => [monthLabel(key), clp(value)]))}
                                    total={financial.invoices_total}
                                />
                            </Card>
                            <Card>
                                <CardTitle subtitle="Saldos por cobrar según antigüedad">Antigüedad de deuda</CardTitle>
                                <Bars
                                    data={Object.fromEntries(Object.entries(financial.aging).map(([key, value]) => [key, clp(value)]))}
                                    total={financial.pending_balance}
                                />
                            </Card>
                        </div>
                    </Card>
                )}

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <Card>
                        <CardTitle subtitle={isDriver ? 'Traslados programados para hoy' : 'Próximos velatorios, ceremonias y traslados'}>
                            {isDriver ? 'Mis recorridos de hoy' : 'Agenda próxima'}
                        </CardTitle>
                        {isDriver ? (
                            <div className="space-y-3">
                                {myTrips.length === 0 && <p className="text-sm text-[#8b8495]">No hay recorridos para hoy.</p>}
                                {myTrips.map((trip) => (
                                    <div key={trip.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5dfd5] p-3">
                                        <div>
                                            <p className="text-sm font-medium">{trip.destination}</p>
                                            <p className="mt-0.5 text-xs text-[#8b8495]">
                                                {trip.vehicle.name} · {trip.start_time ?? 'Hora por definir'} · {trip.driver?.name ?? 'Sin chofer'}
                                            </p>
                                        </div>
                                        <Badge tone={toneForStatus(trip.status)}>{trip.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcoming.length === 0 && <p className="text-sm text-[#8b8495]">No hay eventos próximos.</p>}
                                {upcoming.map((event) => (
                                    <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5dfd5] p-3">
                                        <div>
                                            <p className="text-sm font-medium">{event.title}</p>
                                            <p className="mt-0.5 text-xs text-[#8b8495]">
                                                {dateES(event.event_date)} · {event.start_time ?? '—'} · {event.location ?? 'Sin sala'}
                                            </p>
                                        </div>
                                        <Badge>{event.type}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {!isDriver && (
                        <Card>
                            <CardTitle subtitle="Últimos servicios registrados">Expedientes recientes</CardTitle>
                            <div className="space-y-3">
                                {recentServices.map((service) => (
                                    <div key={service.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5dfd5] p-3">
                                        <div>
                                            <p className="text-sm font-medium">{service.deceased_name}</p>
                                            <p className="mt-0.5 text-xs text-[#8b8495]">
                                                {service.code} · {dateES(service.service_date)} · {service.viewing_room ?? 'Sin sala'}
                                            </p>
                                        </div>
                                        <Badge tone={toneForStatus(service.status)}>{service.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Panel General', href: dashboard().url }],
};
