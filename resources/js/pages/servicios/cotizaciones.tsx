import { Head, Link, router } from '@inertiajs/react';
import { Archive, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Field,
    Modal,
    PageHeader,
    TableShell,
    Td,
    Th,
    clp,
    dateES,
    deleteRecord,
} from '@/components/funeraria/ui';

type QuoteItem = {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
};

type Quote = {
    id: number;
    folio: string;
    customer_name: string;
    customer_email: string | null;
    deceased_name: string | null;
    service_date: string | null;
    funeral_package_id: number | null;
    status: string;
    total: number;
    notes: string | null;
    contracted_at: string | null;
    package: { id: number; name: string } | null;
    service: { id: number; code: string } | null;
    items: QuoteItem[];
};

type Package = { id: number; code: string; name: string; base_price: number };
type Product = { id: number; name: string; category: string; stock: number; price_clp: number };

type Props = {
    quotes: Quote[];
    packages: Package[];
    products: Product[];
    statuses: string[];
};

type ItemForm = { description: string; quantity: string; unit_price: string };
type FormState = {
    customer_name: string;
    customer_email: string;
    deceased_name: string;
    service_date: string;
    funeral_package_id: string;
    notes: string;
    items: ItemForm[];
};

const emptyForm = (): FormState => ({
    customer_name: '',
    customer_email: '',
    deceased_name: '',
    service_date: new Date().toISOString().slice(0, 10),
    funeral_package_id: '',
    notes: '',
    items: [{ description: '', quantity: '1', unit_price: '0' }],
});

const statusTone = (status: string) =>
    status === 'Contratada' ? 'green' : status === 'Cotizada' ? 'amber' : 'red';

export default function Cotizaciones({ quotes, packages, products, statuses }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Quote | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm());

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setOpen(true);
    };

    const openEdit = (quote: Quote) => {
        setEditing(quote);
        setForm({
            customer_name: quote.customer_name,
            customer_email: quote.customer_email ?? '',
            deceased_name: quote.deceased_name ?? '',
            service_date: quote.service_date ? quote.service_date.slice(0, 10) : '',
            funeral_package_id: quote.funeral_package_id ? String(quote.funeral_package_id) : '',
            notes: quote.notes ?? '',
            items: quote.items.length
                ? quote.items.map((item) => ({
                      description: item.description,
                      quantity: String(item.quantity),
                      unit_price: String(item.unit_price),
                  }))
                : [{ description: '', quantity: '1', unit_price: '0' }],
        });
        setOpen(true);
    };

    const selectPackage = (id: string) => {
        const packageItem = packages.find((item) => item.id === Number(id));
        setForm((current) => ({
            ...current,
            funeral_package_id: id,
            items: packageItem && (current.items.length === 0 || current.items.every((item) => !item.description))
                ? [{ description: packageItem.name, quantity: '1', unit_price: String(packageItem.base_price) }]
                : current.items,
        }));
    };

    const addProduct = (id: string) => {
        const product = products.find((item) => item.id === Number(id));
        if (!product) return;

        setForm((current) => ({
            ...current,
            items: [
                ...current.items,
                { description: product.name, quantity: '1', unit_price: String(product.price_clp) },
            ],
        }));
    };

    const updateItem = (index: number, patch: Partial<ItemForm>) => {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, position) => (position === index ? { ...item, ...patch } : item)),
        }));
    };

    const submit = () => {
        const data = {
            ...form,
            funeral_package_id: form.funeral_package_id || null,
            service_date: form.service_date || null,
            items: form.items.filter((item) => item.description.trim()),
        };
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };

        if (editing) router.put(`/servicios/cotizaciones/${editing.id}`, data, options);
        else router.post('/servicios/cotizaciones', data, options);
    };

    const contratar = (quote: Quote) => {
        if (!window.confirm(`¿Contratar ${quote.folio}? Se creará un expediente y la cotización quedará cerrada.`)) return;

        router.post(`/servicios/cotizaciones/${quote.id}/contratar`, { send_email: true }, { preserveScroll: true });
    };

    const estimate = form.items.reduce(
        (total, item) => total + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0,
    );
    const iva = Math.round(estimate * 0.19);

    return (
        <>
            <Head title="Cotizaciones de servicios" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Cotizaciones de servicios funerarios"
                    subtitle="Arme una propuesta desde un paquete o producto; al contratar se genera el expediente."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Nueva cotización</Button>}
                />

                <div className="mb-5 flex flex-wrap gap-2">
                    <Link
                        href="/servicios"
                        className="inline-flex items-center gap-2 rounded-full border border-[#e5dfd5] bg-white px-3.5 py-1.5 text-sm text-[#5f576e] transition hover:bg-[#f1ecf8]"
                    >
                        Paquetes ({packages.length})
                    </Link>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#7b68ae] bg-[#7b68ae] px-3.5 py-1.5 text-sm text-white">
                        Cotizaciones ({quotes.length})
                    </span>
                </div>

                <div className="mb-5 rounded-lg border border-[#e5dfd5] bg-[#faf8f5] p-3 text-sm text-[#6f6878]">
                    La cotización no descuenta stock ni emite boletas. Al contratar se crea el expediente
                    y desde ahí continúa: reserva → abonos → pago total → boleta. El IVA y el AFP se
                    calculan definitivamente al emitir la boleta.
                </div>

                <Card padded={false}>
                    {quotes.length === 0 ? (
                        <div className="p-5"><EmptyState message="No hay cotizaciones registradas." /></div>
                    ) : (
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Folio</Th>
                                    <Th>Cliente</Th>
                                    <Th>Fecha servicio</Th>
                                    <Th>Servicio / ítems</Th>
                                    <Th>Total estimado</Th>
                                    <Th>Estado</Th>
                                    <Th>Expediente</Th>
                                    <Th>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map((quote) => (
                                    <tr key={quote.id}>
                                        <Td className="font-medium text-[#5a4a86]">{quote.folio}</Td>
                                        <Td>
                                            <div>{quote.customer_name}</div>
                                            <div className="text-xs text-[#8b8495]">{quote.customer_email ?? '—'}</div>
                                        </Td>
                                        <Td className="text-[#7a7285]">{dateES(quote.service_date)}</Td>
                                        <Td className="text-[#7a7285]">
                                            <div>{quote.package?.name ?? 'Ítems libres'}</div>
                                            <div className="text-xs text-[#a49cac]">{quote.items.length} ítem(s)</div>
                                        </Td>
                                        <Td className="font-medium">{clp(quote.total)}</Td>
                                        <Td><Badge tone={statusTone(quote.status)}>{quote.status}</Badge></Td>
                                        <Td className="text-[#7a7285]">
                                            {quote.service ? (
                                                <Link href="/expedientes" className="font-medium text-[#5a4a86] hover:underline">
                                                    {quote.service.code}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </Td>
                                        <Td>
                                            <div className="flex flex-wrap gap-1">
                                                {quote.status === 'Cotizada' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => contratar(quote)}
                                                        className="inline-flex items-center gap-1 rounded-lg border-2 border-green-800 bg-gradient-to-r from-green-400 to-green-600 px-3 py-1.5 text-xs font-semibold text-black shadow-sm transition hover:from-green-500 hover:to-green-700"
                                                    >
                                                        Contratar
                                                    </button>
                                                )}
                                                {quote.status === 'Cotizada' && (
                                                    <Button variant="ghost" title="Editar" onClick={() => openEdit(quote)}><Pencil className="size-4" /></Button>
                                                )}
                                                {quote.status !== 'Contratada' && (
                                                    <Button
                                                        variant="ghost"
                                                        title="Eliminar"
                                                        onClick={() => deleteRecord(`/servicios/cotizaciones/${quote.id}`, '¿Eliminar esta cotización?')}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
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

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar cotización' : 'Nueva cotización'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Cliente / contratante">
                            <input className="funeraria-input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                        </Field>
                        <Field label="Correo (opcional)">
                            <input type="email" className="funeraria-input" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                        </Field>
                        <Field label="Nombre del fallecido/a (opcional)">
                            <input className="funeraria-input" value={form.deceased_name} onChange={(e) => setForm({ ...form, deceased_name: e.target.value })} />
                        </Field>
                        <Field label="Fecha estimada del servicio">
                            <input type="date" className="funeraria-input" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} />
                        </Field>
                        <Field label="Paquete de servicio" className="sm:col-span-2">
                            <select className="funeraria-input" value={form.funeral_package_id} onChange={(e) => selectPackage(e.target.value)}>
                                <option value="">Sin paquete (ítems libres)</option>
                                {packages.map((item) => (
                                    <option key={item.id} value={item.id}>{item.code} · {item.name} · {clp(item.base_price)}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="rounded-lg border border-[#e5dfd5] bg-[#faf8f5] p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-[#2d2542]">Ítems de la cotización</p>
                            <Field label="Agregar producto del catálogo" className="sm:w-72">
                                <select className="funeraria-input" value="" onChange={(e) => addProduct(e.target.value)}>
                                    <option value="">Seleccionar producto…</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} · {clp(product.price_clp)} · stock {product.stock}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <div className="mt-4 space-y-3">
                            {form.items.map((item, index) => (
                                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_90px_130px_auto] sm:items-end">
                                    <Field label="Descripción">
                                        <input
                                            className="funeraria-input"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, { description: e.target.value })}
                                            placeholder="Ej.: Servicio completo"
                                        />
                                    </Field>
                                    <Field label="Cant.">
                                        <input type="number" min={1} className="funeraria-input" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} />
                                    </Field>
                                    <Field label="Precio unitario">
                                        <input type="number" min={0} className="funeraria-input" value={item.unit_price} onChange={(e) => updateItem(index, { unit_price: e.target.value })} />
                                    </Field>
                                    <Button
                                        variant="ghost"
                                        title="Quitar ítem"
                                        onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, position) => position !== index) }))}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="light"
                            className="mt-3"
                            onClick={() => setForm((current) => ({ ...current, items: [...current.items, { description: '', quantity: '1', unit_price: '0' }] }))}
                        >
                            <Plus className="size-4" /> Agregar ítem
                        </Button>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e5dfd5] pt-4 text-sm">
                            <span className="text-[#7a7285]">Neto {clp(estimate)} · IVA 19% {clp(iva)}</span>
                            <span className="font-semibold text-[#2d2542]">Total estimado: {clp(estimate + iva)}</span>
                        </div>
                    </div>

                    <Field label="Observaciones (opcional)">
                        <textarea rows={3} className="funeraria-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </Field>

                    <p className="flex items-center gap-2 text-xs text-[#8b8495]">
                        <Archive className="size-4 text-[#7b68ae]" />
                        {statuses.join(' · ')}. Solo se pueden editar cotizaciones en estado Cotizada.
                    </p>

                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Guardar cotización'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
