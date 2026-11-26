import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
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
    clp,
    deleteRecord,
} from '@/components/funeraria/ui';

type Package = {
    id: number;
    code: string;
    name: string;
    category: string;
    description: string | null;
    base_price: number;
    includes: string[];
    active: boolean;
    sort_order: number;
};

type Props = {
    packages: Package[];
    categories: string[];
    quotesCount: number;
};

type FormState = {
    name: string;
    category: string;
    description: string;
    base_price: string;
    includes: string;
    active: boolean;
    sort_order: string;
};

const emptyForm = (categories: string[]): FormState => ({
    name: '',
    category: categories[0] ?? '',
    description: '',
    base_price: '0',
    includes: '',
    active: true,
    sort_order: '0',
});

export default function Servicios({ packages, categories, quotesCount }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Package | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(categories));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm(categories));
        setOpen(true);
    };

    const openEdit = (item: Package) => {
        setEditing(item);
        setForm({
            name: item.name,
            category: item.category,
            description: item.description ?? '',
            base_price: String(item.base_price),
            includes: (item.includes ?? []).join('\n'),
            active: item.active,
            sort_order: String(item.sort_order),
        });
        setOpen(true);
    };

    const submit = () => {
        const data = {
            ...form,
            base_price: Number(form.base_price),
            sort_order: Number(form.sort_order),
            includes: form.includes
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
        };
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };

        if (editing) router.put(`/servicios/${editing.id}`, data, options);
        else router.post('/servicios', data, options);
    };

    return (
        <>
            <Head title="Servicios funerarios" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Servicios funerarios"
                    subtitle="Paquetes cotizables con precio base. No consumen stock: el inventario se reserva después."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Nuevo servicio</Button>}
                />

                <div className="mb-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#7b68ae] bg-[#7b68ae] px-3.5 py-1.5 text-sm text-white">
                        Paquetes ({packages.length})
                    </span>
                    <Link
                        href="/servicios/cotizaciones"
                        className="inline-flex items-center gap-2 rounded-full border border-[#e5dfd5] bg-white px-3.5 py-1.5 text-sm text-[#5f576e] transition hover:bg-[#f1ecf8]"
                    >
                        <ClipboardList className="size-4" />
                        Cotizaciones ({quotesCount})
                    </Link>
                </div>

                <div className="mb-5 rounded-lg border border-[#e5dfd5] bg-[#faf8f5] p-3 text-sm text-[#6f6878]">
                    Flujo: cotizar el servicio → contratar → se crea el expediente → reserva → abonos → pago total → boleta.
                    La cotización no descuenta stock ni emite boletas.
                </div>

                {packages.length === 0 ? (
                    <Card><EmptyState message="No hay servicios funerarios en el catálogo." /></Card>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {packages.map((item) => (
                            <Card key={item.id} padded={false} className="flex flex-col overflow-hidden">
                                <div className="flex items-start justify-between gap-3 border-b border-[#e5dfd5] bg-[#faf8f5] p-5">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-[#7b68ae] uppercase">{item.code}</p>
                                        <h3 className="mt-1 font-semibold text-[#2d2542]">{item.name}</h3>
                                        <p className="mt-1 text-xs text-[#8b8495]">{item.category}</p>
                                    </div>
                                    <Badge tone={item.active ? 'green' : 'gray'}>{item.active ? 'Activo' : 'Inactivo'}</Badge>
                                </div>
                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-sm leading-relaxed text-[#6f6878]">{item.description || 'Sin descripción.'}</p>
                                    <ul className="mt-4 space-y-1.5 text-xs text-[#7a7285]">
                                        {(item.includes ?? []).map((detail) => (
                                            <li key={detail}>· {detail}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-5 flex items-center justify-between border-t border-[#e5dfd5] pt-4">
                                        <span className="text-lg font-semibold text-[#5a4a86]">{clp(item.base_price)}</span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" title="Editar" onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>
                                            <Button
                                                variant="ghost"
                                                title="Eliminar"
                                                onClick={() => deleteRecord(`/servicios/${item.id}`, '¿Eliminar este servicio del catálogo?')}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar servicio funerario' : 'Nuevo servicio funerario'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre del servicio" className="sm:col-span-2">
                            <input className="funeraria-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </Field>
                        <Field label="Categoría">
                            <select className="funeraria-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {categories.map((category) => <option key={category}>{category}</option>)}
                            </select>
                        </Field>
                        <Field label="Precio base (CLP)">
                            <input type="number" min={0} className="funeraria-input" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} required />
                        </Field>
                        <Field label="Descripción" className="sm:col-span-2">
                            <textarea rows={2} className="funeraria-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </Field>
                        <Field label="Incluye (uno por línea)" className="sm:col-span-2">
                            <textarea rows={4} className="funeraria-input" value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} placeholder={'Sala velatoria\nGestiones administrativas'} />
                        </Field>
                        <Field label="Orden de exhibición">
                            <input type="number" min={0} className="funeraria-input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                        </Field>
                    </div>
                    <Checkbox checked={form.active} onChange={(value) => setForm({ ...form, active: value })} label="Servicio activo (visible en la landing y cotizaciones)" />
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Agregar servicio'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
