import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Checkbox,
    EmptyState,
    Field,
    Modal,
    PageHeader,
    Td,
    Th,
    TableShell,
    dateES,
    deleteRecord,
    toneForStatus,
} from '@/components/funeraria/ui';

type Service = {
    id: number;
    code: string;
    service_date: string;
    deceased_name: string;
    contractor_name: string | null;
    contractor_email: string | null;
    product_id: number | null;
    viewing_room: string | null;
    status: string;
    notes: string | null;
    product: { id: number; name: string } | null;
};

type Props = {
    services: Service[];
    products: Array<{ id: number; name: string; category: string; stock: number }>;
    statuses: string[];
    rooms: string[];
    filters: { search?: string; status?: string };
};

type FormState = {
    service_date: string;
    deceased_name: string;
    contractor_name: string;
    contractor_email: string;
    product_id: string;
    viewing_room: string;
    status: string;
    notes: string;
    send_email: boolean;
};

const emptyForm = (statuses: string[], rooms: string[]): FormState => ({
    service_date: new Date().toISOString().slice(0, 10),
    deceased_name: '',
    contractor_name: '',
    contractor_email: '',
    product_id: '',
    viewing_room: rooms[0] ?? '',
    status: statuses[0] ?? 'En curso',
    notes: '',
    send_email: false,
});

export default function Services({ services, products, statuses, rooms, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(statuses, rooms));
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm(statuses, rooms));
        setOpen(true);
    };

    const openEdit = (service: Service) => {
        setEditing(service);
        setForm({
            service_date: service.service_date.slice(0, 10),
            deceased_name: service.deceased_name,
            contractor_name: service.contractor_name ?? '',
            contractor_email: service.contractor_email ?? '',
            product_id: service.product_id ? String(service.product_id) : '',
            viewing_room: service.viewing_room ?? rooms[0] ?? '',
            status: service.status,
            notes: service.notes ?? '',
            send_email: false,
        });
        setOpen(true);
    };

    const submit = () => {
        const data = {
            ...form,
            product_id: form.product_id || null,
            send_email: form.send_email,
        };
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) router.put(`/expedientes/${editing.id}`, data, options);
        else router.post('/expedientes', data, options);
    };

    const applyFilters = () => {
        router.get('/expedientes', { search, status: status || undefined }, { preserveState: true });
    };

    return (
        <>
            <Head title="Expedientes" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Expedientes de Servicios Funerarios"
                    subtitle="Folio correlativo, fecha, fallecido/a, contratante, producto y estado del servicio."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Nuevo expediente</Button>}
                />

                <div className="mb-5 rounded-lg border border-[#e5dfd5] bg-[#faf8f5] p-3 text-sm text-[#6f6878]">
                    Para facturar, emita la boleta desde este expediente o desde la reserva correspondiente. El orden es reserva → abonos → pago total → emisión de boleta.
                </div>

                <Card className="mb-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <Field label="Buscar por folio, fallecido o contratante" className="flex-1">
                            <div className="relative">
                                <Search className="absolute top-2.5 left-3 size-4 text-[#a49cac]" />
                                <input
                                    className="funeraria-input pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    placeholder="Ej.: SRV-00001 o nombre"
                                />
                            </div>
                        </Field>
                        <Field label="Estado" className="sm:w-64">
                            <select className="funeraria-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">Todos los estados</option>
                                {statuses.map((item) => <option key={item}>{item}</option>)}
                            </select>
                        </Field>
                        <Button onClick={applyFilters}>Filtrar</Button>
                    </div>
                </Card>

                <Card padded={false}>
                    {services.length === 0 ? (
                        <div className="p-5"><EmptyState message="No hay expedientes que coincidan con la búsqueda." /></div>
                    ) : (
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Folio</Th>
                                    <Th>Fecha</Th>
                                    <Th>Fallecido/a</Th>
                                    <Th>Contratante</Th>
                                    <Th>Producto</Th>
                                    <Th>Sala</Th>
                                    <Th>Estado</Th>
                                    <Th>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <tr key={service.id}>
                                        <Td className="font-medium text-[#5a4a86]">{service.code}</Td>
                                        <Td>{dateES(service.service_date)}</Td>
                                        <Td className="font-medium">{service.deceased_name}</Td>
                                        <Td className="text-[#7a7285]">{service.contractor_name ?? '—'}</Td>
                                        <Td className="text-[#7a7285]">{service.product?.name ?? '—'}</Td>
                                        <Td className="text-[#7a7285]">{service.viewing_room ?? '—'}</Td>
                                        <Td><Badge tone={toneForStatus(service.status)}>{service.status}</Badge></Td>
                                        <Td>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" title="Ver orden imprimible" onClick={() => window.open(`/expedientes/${service.id}/imprimir`, '_blank')}><Printer className="size-4" /></Button>
                                                <Button variant="ghost" title="Editar" onClick={() => openEdit(service)}><Pencil className="size-4" /></Button>
                                                <Button variant="ghost" title="Eliminar" onClick={() => deleteRecord(`/expedientes/${service.id}`, '¿Eliminar este expediente?')}><Trash2 className="size-4" /></Button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </Card>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar expediente' : 'Nuevo expediente'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Fecha de servicio">
                            <input type="date" className="funeraria-input" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} required />
                        </Field>
                        <Field label="Estado">
                            <select className="funeraria-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {statuses.map((item) => <option key={item}>{item}</option>)}
                            </select>
                        </Field>
                        <Field label="Nombre del fallecido/a" className="sm:col-span-2">
                            <input className="funeraria-input" value={form.deceased_name} onChange={(e) => setForm({ ...form, deceased_name: e.target.value })} required />
                        </Field>
                        <Field label="Nombre del contratante (opcional)">
                            <input className="funeraria-input" value={form.contractor_name} onChange={(e) => setForm({ ...form, contractor_name: e.target.value })} />
                        </Field>
                        <Field label="Correo del contratante (opcional)">
                            <input type="email" className="funeraria-input" value={form.contractor_email} onChange={(e) => setForm({ ...form, contractor_email: e.target.value })} />
                        </Field>
                        <Field label="Producto asignado">
                            <select className="funeraria-input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                                <option value="">Sin producto asignado</option>
                                {products.map((product) => <option key={product.id} value={product.id}>{product.name} · stock {product.stock}</option>)}
                            </select>
                        </Field>
                        <Field label="Sala velatoria">
                            <select className="funeraria-input" value={form.viewing_room} onChange={(e) => setForm({ ...form, viewing_room: e.target.value })}>
                                <option value="">Sin sala</option>
                                {rooms.map((room) => <option key={room}>{room}</option>)}
                            </select>
                        </Field>
                        <Field label="Observaciones (opcional)" className="sm:col-span-2">
                            <textarea rows={3} className="funeraria-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        </Field>
                    </div>
                    <div className="rounded-lg border border-[#e5dfd5] bg-[#faf8f5] p-3">
                        <Checkbox
                            checked={form.send_email}
                            onChange={(value) => setForm({ ...form, send_email: value })}
                            label="Enviar copia de la orden de servicio al correo del contratante (opcional)"
                        />
                        <p className="mt-1 pl-6 text-xs text-[#8b8495]">Si el correo falla, el expediente igualmente se guarda.</p>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Crear expediente'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
