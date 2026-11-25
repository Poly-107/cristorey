import { Head, router, usePage } from '@inertiajs/react';
import { CarFront, CirclePlay, Flag, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    CardTitle,
    EmptyState,
    Field,
    Modal,
    PageHeader,
    StatCard,
    Td,
    Th,
    TableShell,
    dateES,
    deleteRecord,
    toneForStatus,
} from '@/components/funeraria/ui';

type Vehicle = { id: number; name: string; plate: string; type: string; capacity: number; status: string };
type Trip = {
    id: number;
    vehicle_id: number;
    driver_id: number | null;
    destination: string;
    trip_date: string;
    start_time: string | null;
    end_time: string | null;
    status: string;
    notes: string | null;
    vehicle: Vehicle;
    driver: { id: number; name: string } | null;
    service: { id: number; code: string } | null;
};

type Props = {
    vehicles: Vehicle[];
    trips: Trip[];
    drivers: Array<{ id: number; name: string; role: string }>;
    services: Array<{ id: number; code: string; deceased_name: string }>;
    date: string;
    statuses: string[];
    isDriver: boolean;
};

export default function Fleet({ vehicles, trips, drivers, services, date, isDriver }: Props) {
    const { auth } = usePage().props;
    const [vehicleOpen, setVehicleOpen] = useState(false);
    const [tripOpen, setTripOpen] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({ name: '', plate: '', type: 'Carroza', capacity: '4' });
    const [tripForm, setTripForm] = useState({
        vehicle_id: vehicles[0] ? String(vehicles[0].id) : '',
        driver_id: drivers[0] ? String(drivers[0].id) : '',
        service_id: '',
        destination: '',
        trip_date: date,
        start_time: '',
        notes: '',
    });

    const inProgress = trips.filter((trip) => trip.status === 'En curso').length;

    const saveVehicle = () => {
        router.post('/flota/vehiculos', vehicleForm, { preserveScroll: true, onSuccess: () => setVehicleOpen(false) });
    };

    const saveTrip = () => {
        router.post('/flota/recorridos', {
            ...tripForm,
            driver_id: tripForm.driver_id || null,
            service_id: tripForm.service_id || null,
            start_time: tripForm.start_time || null,
        }, { preserveScroll: true, onSuccess: () => setTripOpen(false) });
    };

    return (
        <>
            <Head title="Hoja de Ruta de Flota" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Hoja de Ruta de Flota"
                    subtitle={isDriver
                        ? 'Sus recorridos asignados: inicie y finalice cada traslado.'
                        : 'Inicie y finalice recorridos de carrozas y vehículos; coordine los traslados del día.'}
                    actions={
                        <>
                            <input
                                type="date"
                                className="funeraria-input w-auto"
                                value={date}
                                onChange={(e) => router.get('/flota', { date: e.target.value }, { preserveState: true })}
                            />
                            {!isDriver && (
                                <>
                                    <Button variant="light" onClick={() => setVehicleOpen(true)}><Plus className="size-4" /> Vehículo</Button>
                                    <Button onClick={() => setTripOpen(true)}><Plus className="size-4" /> Recorrido</Button>
                                </>
                            )}
                        </>
                    }
                />

                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    <StatCard label="Vehículos en flota" value={vehicles.length} icon={<CarFront className="size-5" />} />
                    <StatCard label="Recorridos del día" value={trips.length} tone="blue" icon={<Flag className="size-5" />} />
                    <StatCard label="Recorridos en curso" value={inProgress} tone="amber" icon={<CirclePlay className="size-5" />} />
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardTitle subtitle="Estado actual de carrozas y vehículos">Flota disponible</CardTitle>
                        <div className="space-y-3">
                            {vehicles.map((vehicle) => (
                                <div key={vehicle.id} className="flex items-center justify-between rounded-lg border border-[#e5dfd5] p-3">
                                    <div>
                                        <p className="text-sm font-medium">{vehicle.name}</p>
                                        <p className="text-xs text-[#8b8495]">{vehicle.plate} · {vehicle.type} · {vehicle.capacity} pasajeros</p>
                                    </div>
                                    <Badge tone={toneForStatus(vehicle.status)}>{vehicle.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card padded={false} className="lg:col-span-2">
                        <div className="px-5 pt-5"><CardTitle subtitle={`Recorridos programados para ${dateES(date)}`}>Detalle de recorridos</CardTitle></div>
                        {trips.length === 0 ? (
                            <div className="p-5"><EmptyState message="No hay recorridos para la fecha seleccionada." /></div>
                        ) : (
                            <TableShell>
                                <thead>
                                    <tr>
                                        <Th>Vehículo</Th>
                                        <Th>Chofer</Th>
                                        <Th>Destino</Th>
                                        <Th>Horas</Th>
                                        <Th>Estado</Th>
                                        <Th>Acciones</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.map((trip) => (
                                        <tr key={trip.id}>
                                            <Td className="font-medium">{trip.vehicle.name}</Td>
                                            <Td className="text-[#7a7285]">{trip.driver?.name ?? 'Sin asignar'}</Td>
                                            <Td>{trip.destination}<p className="text-xs text-[#8b8495]">{trip.service?.code ?? 'Sin expediente'}</p></Td>
                                            <Td className="text-[#7a7285]">{trip.start_time ?? '—'} / {trip.end_time ?? '—'}</Td>
                                            <Td><Badge tone={toneForStatus(trip.status)}>{trip.status}</Badge></Td>
                                            <Td>
                                                <div className="flex gap-1">
                                                    {(!isDriver || trip.driver_id === auth.user.id) && trip.status !== 'En curso' && trip.status !== 'Finalizado' && (
                                                        <Button variant="light" title="Iniciar recorrido" onClick={() => router.post(`/flota/recorridos/${trip.id}/iniciar`, {}, { preserveScroll: true })}>
                                                            <CirclePlay className="size-4" /> Iniciar
                                                        </Button>
                                                    )}
                                                    {(!isDriver || trip.driver_id === auth.user.id) && trip.status === 'En curso' && (
                                                        <Button title="Finalizar recorrido" onClick={() => router.post(`/flota/recorridos/${trip.id}/finalizar`, {}, { preserveScroll: true })}>
                                                            <Flag className="size-4" /> Finalizar
                                                        </Button>
                                                    )}
                                                    {!isDriver && (
                                                        <Button variant="ghost" title="Eliminar" onClick={() => deleteRecord(`/flota/recorridos/${trip.id}`, '¿Eliminar este recorrido?')}><Trash2 className="size-4" /></Button>
                                                    )}
                                                </div>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </TableShell>
                        )}
                    </Card>
                </div>
            </div>

            <Modal open={vehicleOpen} onClose={() => setVehicleOpen(false)} title="Agregar vehículo a la flota">
                <form onSubmit={(e) => { e.preventDefault(); saveVehicle(); }} className="space-y-4">
                    <Field label="Nombre"><input className="funeraria-input" value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} required /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Patente"><input className="funeraria-input" value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required /></Field>
                        <Field label="Tipo"><input className="funeraria-input" value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} required /></Field>
                        <Field label="Capacidad"><input type="number" min={1} className="funeraria-input" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} required /></Field>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setVehicleOpen(false)}>Cancelar</Button>
                        <Button type="submit">Agregar vehículo</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={tripOpen} onClose={() => setTripOpen(false)} title="Programar recorrido" wide>
                <form onSubmit={(e) => { e.preventDefault(); saveTrip(); }} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Vehículo">
                            <select className="funeraria-input" value={tripForm.vehicle_id} onChange={(e) => setTripForm({ ...tripForm, vehicle_id: e.target.value })} required>
                                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plate}</option>)}
                            </select>
                        </Field>
                        <Field label="Chofer">
                            <select className="funeraria-input" value={tripForm.driver_id} onChange={(e) => setTripForm({ ...tripForm, driver_id: e.target.value })}>
                                <option value="">Sin asignar</option>
                                {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Expediente (opcional)">
                            <select className="funeraria-input" value={tripForm.service_id} onChange={(e) => setTripForm({ ...tripForm, service_id: e.target.value })}>
                                <option value="">Sin vincular</option>
                                {services.map((service) => <option key={service.id} value={service.id}>{service.code} · {service.deceased_name}</option>)}
                            </select>
                        </Field>
                        <Field label="Destino"><input className="funeraria-input" value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} required /></Field>
                        <Field label="Fecha"><input type="date" className="funeraria-input" value={tripForm.trip_date} onChange={(e) => setTripForm({ ...tripForm, trip_date: e.target.value })} required /></Field>
                        <Field label="Hora de inicio"><input type="time" className="funeraria-input" value={tripForm.start_time} onChange={(e) => setTripForm({ ...tripForm, start_time: e.target.value })} /></Field>
                        <Field label="Notas (opcional)" className="sm:col-span-2"><textarea rows={2} className="funeraria-input" value={tripForm.notes} onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })} /></Field>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setTripOpen(false)}>Cancelar</Button>
                        <Button type="submit">Programar recorrido</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
