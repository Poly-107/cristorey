import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Checkbox,
    EmptyState,
    Field,
    Modal,
    PageHeader,
    StatCard,
    Td,
    Th,
    TableShell,
    clp,
    dateES,
} from '@/components/funeraria/ui';

type Item = {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
};

type Invoice = {
    id: number;
    folio: string;
    service_id: number | null;
    reservation_id: number | null;
    issue_date: string;
    net_amount: number;
    iva_amount: number;
    afp_discount: number;
    family_copay: number;
    total: number;
    email_sent: boolean;
    voided_at: string | null;
    void_reason: string | null;
    service: { id: number; code: string; deceased_name: string; contractor_name: string | null } | null;
    reservation: ReservationOption | null;
    items: Item[];
};

type ReservationOption = {
    id: number;
    folio: string;
    customer_name: string;
    customer_email: string | null;
    total_value: number;
    paid_amount: number;
    status: string;
    product: { id: number; name: string } | null;
};

type Props = {
    invoices: Invoice[];
    services: Array<{ id: number; code: string; deceased_name: string; contractor_name: string | null; contractor_email: string | null }>;
    reservations: ReservationOption[];
    selectedReservation: ReservationOption | null;
    ufValue: number;
    afpUf: number;
    filters: { search?: string };
};

type ItemForm = { description: string; quantity: string; unit_price: string };
type FormState = {
    service_id: string;
    reservation_id: string;
    issue_date: string;
    apply_afp: boolean;
    family_copay: string;
    send_email: boolean;
};

const itemFromReservation = (reservation: ReservationOption | null): ItemForm[] => reservation
    ? [{
        description: `Reserva ${reservation.folio} · ${reservation.customer_name}${reservation.product ? ` · ${reservation.product.name}` : ''}`,
        quantity: '1',
        unit_price: String(reservation.total_value),
    }]
    : [{ description: '', quantity: '1', unit_price: '' }];

export default function Invoices({ invoices, services, reservations, selectedReservation, ufValue, afpUf }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Invoice | null>(null);
    const [voiding, setVoiding] = useState<Invoice | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [form, setForm] = useState<FormState>({
        service_id: selectedReservation ? '' : (services[0] ? String(services[0].id) : ''),
        reservation_id: selectedReservation ? String(selectedReservation.id) : '',
        issue_date: new Date().toISOString().slice(0, 10),
        apply_afp: false,
        family_copay: '0',
        send_email: false,
    });
    const [items, setItems] = useState<ItemForm[]>(itemFromReservation(selectedReservation));

    useEffect(() => {
        if (!selectedReservation) return;
        const id = Number(selectedReservation.id);
        setForm((current) => ({ ...current, service_id: '', reservation_id: String(id) }));
        setItems(itemFromReservation(selectedReservation));
        setOpen(true);
    }, [selectedReservation]);

    const activeInvoices = useMemo(() => invoices.filter((invoice) => !invoice.voided_at), [invoices]);

    const net = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0),
        [items]
    );
    const iva = Math.round(net * 0.19);
    const afp = form.apply_afp ? ufValue * afpUf : 0;
    const copay = Number(form.family_copay) || 0;
    const total = Math.max(0, net + iva + copay - afp);

    const collected = activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const afpTotal = activeInvoices.reduce((sum, invoice) => sum + invoice.afp_discount, 0);

    const openCreate = () => {
        setEditing(null);
        setForm({
            service_id: services[0] ? String(services[0].id) : '',
            reservation_id: '',
            issue_date: new Date().toISOString().slice(0, 10),
            apply_afp: false,
            family_copay: '0',
            send_email: false,
        });
        setItems([{ description: '', quantity: '1', unit_price: '' }]);
        setOpen(true);
    };

    const openEdit = (invoice: Invoice) => {
        setEditing(invoice);
        setForm({
            service_id: invoice.service_id ? String(invoice.service_id) : '',
            reservation_id: invoice.reservation_id ? String(invoice.reservation_id) : '',
            issue_date: invoice.issue_date,
            apply_afp: invoice.afp_discount > 0,
            family_copay: String(invoice.family_copay),
            send_email: false,
        });
        setItems(invoice.items.map((item) => ({
            description: item.description,
            quantity: String(item.quantity),
            unit_price: String(item.unit_price),
        })));
        setOpen(true);
    };

    const updateItem = (index: number, patch: Partial<ItemForm>) => {
        setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const submit = () => {
        const payload = {
            ...form,
            family_copay: copay,
            items: items.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
            })),
        };

        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) {
            router.put(`/boletas/${editing.id}`, payload, options);
        } else {
            router.post('/boletas', payload, options);
        }
    };

    const voidInvoice = () => {
        if (!voiding) return;
        router.delete(`/boletas/${voiding.id}`, {
            data: { reason: voidReason },
            preserveScroll: true,
            onSuccess: () => {
                setVoiding(null);
                setVoidReason('');
            },
        });
    };

    return (
        <>
            <Head title="Boletas y Detalle de Cobros" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Boletas y Detalle de Cobros"
                    subtitle="Emita desde un expediente o desde una reserva. Desglose de ítems, IVA, Cuota Mortuoria AFP y copago familiar."
                    actions={<Button onClick={openCreate} disabled={services.length === 0}><Plus className="size-4" /> Emitir boleta</Button>}
                />

                <div className="mb-5 rounded-lg border border-[#d8e8d5] bg-[#f4fbf2] p-3 text-sm text-[#2f6b45]">
                    <strong>Flujo:</strong> la reserva se crea primero; luego se registran abonos, se completa el pago total y recién se emite la boleta. Aquí puede ver boletas de <strong>Expediente</strong> y <strong>Desde reserva</strong>. «Anulada» es solo el estado de una boleta anulada.
                </div>

                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    <StatCard label="Boletas vigentes" value={activeInvoices.length} icon={<Printer className="size-5" />} />
                    <StatCard label="Total facturado" value={clp(collected)} tone="green" icon={<Printer className="size-5" />} />
                    <StatCard label="Descuento AFP aplicado" value={clp(afpTotal)} tone="amber" icon={<Printer className="size-5" />} />
                </div>

                <Card padded={false}>
                    {invoices.length === 0 ? (
                        <div className="p-5"><EmptyState message="Todavía no se han emitido boletas." /></div>
                    ) : (
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Folio</Th>
                                    <Th>Origen</Th>
                                    <Th>Fecha</Th>
                                    <Th>Neto</Th>
                                    <Th>IVA</Th>
                                    <Th>AFP</Th>
                                    <Th>Copago</Th>
                                    <Th>Total</Th>
                                    <Th>Estado</Th>
                                    <Th>Correo</Th>
                                    <Th>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className={invoice.voided_at ? 'opacity-60' : ''}>
                                        <Td className="font-medium text-[#5a4a86]">{invoice.folio}</Td>
                                        <Td>
                                            <Badge tone={invoice.reservation_id ? 'green' : 'lavender'}>
                                                {invoice.reservation_id
                                                    ? `Desde reserva ${invoice.reservation?.folio ?? ''}`
                                                    : `Expediente ${invoice.service?.code ?? ''}`}
                                            </Badge>
                                        </Td>
                                        <Td>{dateES(invoice.issue_date)}</Td>
                                        <Td>{clp(invoice.net_amount)}</Td>
                                        <Td>{clp(invoice.iva_amount)}</Td>
                                        <Td>-{clp(invoice.afp_discount)}</Td>
                                        <Td>{clp(invoice.family_copay)}</Td>
                                        <Td className="font-semibold">{clp(invoice.total)}</Td>
                                        <Td>
                                            <Badge tone={invoice.voided_at ? 'red' : 'green'}>
                                                {invoice.voided_at ? 'Anulada' : 'Vigente'}
                                            </Badge>
                                        </Td>
                                        <Td><Badge tone={invoice.email_sent ? 'green' : 'gray'}>{invoice.email_sent ? 'Enviada' : 'No enviada'}</Badge></Td>
                                        <Td>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" title="Imprimir / guardar como PDF" onClick={() => window.open(`/boletas/${invoice.id}/imprimir`, '_blank')}><Printer className="size-4" /></Button>
                                                {!invoice.voided_at && (
                                                    <>
                                                        <Button variant="ghost" title="Editar boleta" onClick={() => openEdit(invoice)}><Pencil className="size-4" /></Button>
                                                        <Button variant="ghost" title="Anular boleta" onClick={() => setVoiding(invoice)}><Trash2 className="size-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </Card>
                <p className="mt-3 text-xs text-[#8b8495]">Las boletas anuladas se conservan para auditoría y no se consideran en los totales.</p>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Editar boleta ${editing.folio}` : 'Emitir boleta'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Expediente vinculado (opcional)">
                            <select
                                className="funeraria-input"
                                value={form.service_id}
                                onChange={(e) => setForm({ ...form, service_id: e.target.value, reservation_id: e.target.value ? '' : form.reservation_id })}
                            >
                                <option value="">Sin expediente</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>{service.code} · {service.deceased_name}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Reserva vinculada (opcional)">
                            <select
                                className="funeraria-input"
                                value={form.reservation_id}
                                onChange={(e) => {
                                    const reservationId = e.target.value;
                                    const reservation = reservations.find((item) => String(item.id) === reservationId) ?? null;
                                    setForm({ ...form, reservation_id: reservationId, service_id: reservationId ? '' : form.service_id });
                                    if (reservation) setItems(itemFromReservation(reservation));
                                }}
                            >
                                <option value="">Sin reserva</option>
                                {reservations.map((reservation) => (
                                    <option key={reservation.id} value={reservation.id}>
                                        {reservation.folio} · {reservation.customer_name} · {reservation.status}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Fecha de emisión">
                            <input type="date" className="funeraria-input" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} required />
                        </Field>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-[#2d2542]">Detalle de cobros</h3>
                            <Button variant="light" onClick={() => setItems([...items, { description: '', quantity: '1', unit_price: '' }])}>+ Agregar ítem</Button>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_90px_130px_36px]">
                                    <input
                                        className="funeraria-input"
                                        placeholder="Descripción del ítem"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, { description: e.target.value })}
                                        required
                                    />
                                    <input type="number" min={1} className="funeraria-input" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} required />
                                    <input type="number" min={0} className="funeraria-input" placeholder="Precio unitario" value={item.unit_price} onChange={(e) => updateItem(index, { unit_price: e.target.value })} required />
                                    <Button
                                        variant="ghost"
                                        title="Quitar ítem"
                                        disabled={items.length === 1}
                                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                                    ><Trash2 className="size-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-[#8b8495]">Todos los campos de cada ítem son obligatorios.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3 rounded-lg border border-[#e5dfd5] bg-[#faf8f5] p-4">
                            <Checkbox
                                checked={form.apply_afp}
                                onChange={(value) => setForm({ ...form, apply_afp: value })}
                                label={`Aplicar Cuota Mortuoria AFP (${afpUf} UF · ${clp(ufValue)} c/u)`}
                            />
                            <Field label="Copago familiar (CLP)">
                                <input type="number" min={0} className="funeraria-input" value={form.family_copay} onChange={(e) => setForm({ ...form, family_copay: e.target.value })} />
                            </Field>
                            {!editing && (
                                <Checkbox
                                    checked={form.send_email}
                                    onChange={(value) => setForm({ ...form, send_email: value })}
                                    label="Enviar comprobante al correo del contratante (opcional)"
                                />
                            )}
                        </div>
                        <div className="rounded-lg border border-[#ddd3ef] bg-[#fcfbfe] p-4 text-sm">
                            <p className="mb-3 font-semibold text-[#5a4a86]">Resumen del cálculo</p>
                            <div className="space-y-1.5 text-[#6f6878]">
                                <p className="flex justify-between"><span>Neto</span><span>{clp(net)}</span></p>
                                <p className="flex justify-between"><span>IVA (19%)</span><span>{clp(iva)}</span></p>
                                <p className="flex justify-between"><span>Cuota Mortuoria AFP</span><span>-{clp(afp)}</span></p>
                                <p className="flex justify-between"><span>Copago familiar</span><span>{clp(copay)}</span></p>
                            </div>
                            <p className="mt-3 flex justify-between border-t border-[#e5dfd5] pt-3 text-base font-semibold text-[#2d2542]">
                                <span>Total a cobrar</span><span>{clp(total)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Emitir boleta'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(voiding)} onClose={() => setVoiding(null)} title={`Anular boleta ${voiding?.folio ?? ''}`}>
                <form onSubmit={(event) => { event.preventDefault(); voidInvoice(); }} className="space-y-4">
                    <p className="text-sm text-[#6f6878]">La boleta se conservará en el historial y dejará de considerarse en los totales.</p>
                    <Field label="Motivo de la anulación">
                        <textarea
                            rows={3}
                            className="funeraria-input"
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            placeholder="Ej.: Monto incorrecto en el copago familiar"
                            required
                            minLength={5}
                        />
                    </Field>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setVoiding(null)}>Cancelar</Button>
                        <Button type="submit">Anular boleta</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
