import { Head, router } from '@inertiajs/react';
import { CircleDollarSign, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Field,
    Modal,
    PageHeader,
    StatCard,
    Td,
    Th,
    TableShell,
    clp,
    deleteRecord,
    toneForStatus,
} from '@/components/funeraria/ui';

type Payment = { id: number; amount: number; paid_on: string; note: string | null };
type Reservation = {
    id: number;
    folio: string;
    customer_name: string;
    customer_email: string | null;
    product_id: number;
    total_value: number;
    paid_amount: number;
    pending: number;
    status: string;
    notes: string | null;
    product: { id: number; name: string } | null;
    payments: Payment[];
};

type Props = {
    reservations: Reservation[];
    products: Array<{ id: number; name: string; category: string; stock: number; price_clp: number }>;
    statuses: string[];
};

type FormState = {
    customer_name: string;
    customer_email: string;
    product_id: string;
    total_value: string;
    paid_amount: string;
    status: string;
    notes: string;
};

const emptyForm = (statuses: string[]): FormState => ({
    customer_name: '', customer_email: '', product_id: '', total_value: '',
    paid_amount: '0', status: statuses[0] ?? 'Reservado/Abonado', notes: '',
});

export default function Reservations({ reservations, products, statuses }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Reservation | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(statuses));
    const [paymentFor, setPaymentFor] = useState<Reservation | null>(null);
    const [payment, setPayment] = useState({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '' });

    const totalPending = reservations.reduce((sum, item) => sum + item.pending, 0);
    const totalPaid = reservations.reduce((sum, item) => sum + item.paid_amount, 0);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm(statuses));
        setOpen(true);
    };

    const openEdit = (item: Reservation) => {
        setEditing(item);
        setForm({
            customer_name: item.customer_name,
            customer_email: item.customer_email ?? '',
            product_id: String(item.product_id),
            total_value: String(item.total_value),
            paid_amount: String(item.paid_amount),
            status: item.status,
            notes: item.notes ?? '',
        });
        setOpen(true);
    };

    const submit = () => {
        const data = {
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            product_id: form.product_id,
            total_value: form.total_value,
            status: form.status,
            notes: form.notes,
            ...(editing ? {} : { paid_amount: form.paid_amount }),
        };
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) router.put(`/reservas/${editing.id}`, data, options);
        else router.post('/reservas', data, options);
    };

    const submitPayment = () => {
        if (!paymentFor) return;
        router.post(`/reservas/${paymentFor.id}/abonos`, payment, {
            preserveScroll: true,
            onSuccess: () => { setPaymentFor(null); setPayment({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '' }); },
        });
    };

    return (
        <>
            <Head title="Reservas" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Reserva Anticipada de Urnas y Ataúdes"
                    subtitle="Las reservas descuentan stock automáticamente. Registre abonos y controle el saldo pendiente."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Nueva reserva</Button>}
                />

                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    <StatCard label="Reservas registradas" value={reservations.length} icon={<CircleDollarSign className="size-5" />} />
                    <StatCard label="Abonos recibidos" value={clp(totalPaid)} tone="green" icon={<CircleDollarSign className="size-5" />} />
                    <StatCard label="Saldos pendientes" value={clp(totalPending)} tone="amber" icon={<CircleDollarSign className="size-5" />} />
                </div>

                <Card padded={false}>
                    {reservations.length === 0 ? (
                        <div className="p-5"><EmptyState message="Todavía no hay reservas registradas." /></div>
                    ) : (
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Folio</Th>
                                    <Th>Cliente</Th>
                                    <Th>Producto</Th>
                                    <Th>Valor total</Th>
                                    <Th>Abonado</Th>
                                    <Th>Saldo</Th>
                                    <Th>Estado</Th>
                                    <Th>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.map((item) => (
                                    <tr key={item.id}>
                                        <Td className="font-medium text-[#5a4a86]">{item.folio}</Td>
                                        <Td>
                                            <p className="font-medium">{item.customer_name}</p>
                                            <p className="text-xs text-[#8b8495]">{item.customer_email ?? 'Sin correo'}</p>
                                        </Td>
                                        <Td className="text-[#7a7285]">{item.product?.name ?? '—'}</Td>
                                        <Td>{clp(item.total_value)}</Td>
                                        <Td className="text-[#2f6b45]">{clp(item.paid_amount)}</Td>
                                        <Td className="font-medium">{clp(item.pending)}</Td>
                                        <Td><Badge tone={toneForStatus(item.status)}>{item.status}</Badge></Td>
                                        <Td>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="light"
                                                    title="Registrar abono"
                                                    disabled={item.pending === 0}
                                                    onClick={() => { setPaymentFor(item); setPayment({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '' }); }}
                                                >
                                                    <CircleDollarSign className="size-4" /> Abonar
                                                </Button>
                                                <Button variant="ghost" title="Editar" onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>
                                                <Button variant="ghost" title="Anular reserva" onClick={() => deleteRecord(`/reservas/${item.id}`, '¿Anular la reserva y restaurar el stock?')}><Trash2 className="size-4" /></Button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </Card>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar reserva' : 'Nueva reserva'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre del cliente" className="sm:col-span-2">
                            <input className="funeraria-input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                        </Field>
                        <Field label="Correo (opcional)">
                            <input type="email" className="funeraria-input" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                        </Field>
                        <Field label="Producto reservado">
                            <select className="funeraria-input" value={form.product_id} onChange={(e) => {
                                const product = products.find((p) => String(p.id) === e.target.value);
                                setForm({ ...form, product_id: e.target.value, total_value: product ? String(product.price_clp) : form.total_value });
                            }} required>
                                <option value="">Seleccione un producto</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id} disabled={product.stock === 0}>
                                        {product.name} · stock {product.stock} · {clp(product.price_clp)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Valor total (CLP)">
                            <input type="number" min={0} className="funeraria-input" value={form.total_value} onChange={(e) => setForm({ ...form, total_value: e.target.value })} required />
                        </Field>
                        <Field label="Abono inicial (CLP)" hint={editing ? 'Use el botón Abonar para agregar pagos.' : undefined}>
                            <input type="number" min={0} className="funeraria-input" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} disabled={!!editing} />
                        </Field>
                        <Field label="Estado">
                            <select className="funeraria-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {statuses.map((item) => <option key={item}>{item}</option>)}
                            </select>
                        </Field>
                        <Field label="Observaciones (opcional)" className="sm:col-span-2">
                            <textarea rows={2} className="funeraria-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        </Field>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Crear reserva'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!paymentFor} onClose={() => setPaymentFor(null)} title={`Registrar abono · ${paymentFor?.folio ?? ''}`}>
                {paymentFor && (
                    <form onSubmit={(event) => { event.preventDefault(); submitPayment(); }} className="space-y-4">
                        <p className="text-sm text-[#7a7285]">
                            Cliente: <strong className="text-[#2d2542]">{paymentFor.customer_name}</strong><br />
                            Saldo pendiente antes del abono: <strong className="text-[#2d2542]">{clp(paymentFor.pending)}</strong>
                        </p>
                        <Field label="Monto del abono (CLP)">
                            <input type="number" min={1} max={paymentFor.pending} className="funeraria-input" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required />
                        </Field>
                        <Field label="Fecha del abono">
                            <input type="date" className="funeraria-input" value={payment.paid_on} onChange={(e) => setPayment({ ...payment, paid_on: e.target.value })} required />
                        </Field>
                        <Field label="Detalle (opcional)">
                            <input className="funeraria-input" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
                        </Field>
                        <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                            <Button variant="light" onClick={() => setPaymentFor(null)}>Cancelar</Button>
                            <Button type="submit">Registrar abono</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
}
