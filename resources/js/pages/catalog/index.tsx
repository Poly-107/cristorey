import { Head, router } from '@inertiajs/react';
import { Archive, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

type Item = {
    id: number;
    name: string;
    category: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    material: string | null;
    price_clp: number;
    stock: number;
    min_stock: number;
    reference_url: string | null;
    image_path: string | null;
    image_url: string | null;
    active: boolean;
};

type Props = { items: Item[]; categories: string[] };

type FormState = {
    name: string;
    category: string;
    length_cm: string;
    width_cm: string;
    height_cm: string;
    material: string;
    price_clp: string;
    stock: string;
    min_stock: string;
    reference_url: string;
    active: boolean;
    image: File | null;
    remove_image: boolean;
};

const emptyForm = (category: string): FormState => ({
    name: '', category, length_cm: '', width_cm: '', height_cm: '', material: '',
    price_clp: '', stock: '', min_stock: '3', reference_url: '', active: true, image: null, remove_image: false,
});

export default function Catalog({ items, categories }: Props) {
    const [filter, setFilter] = useState('Todas');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Item | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(categories[0] ?? ''));

    const visible = useMemo(
        () => (filter === 'Todas' ? items : items.filter((item) => item.category === filter)),
        [items, filter]
    );

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm(filter === 'Todas' ? categories[0] ?? '' : filter));
        setOpen(true);
    };

    const openEdit = (item: Item) => {
        setEditing(item);
        setForm({
            name: item.name,
            category: item.category,
            length_cm: String(item.length_cm),
            width_cm: String(item.width_cm),
            height_cm: String(item.height_cm),
            material: item.material ?? '',
            price_clp: String(item.price_clp),
            stock: String(item.stock),
            min_stock: String(item.min_stock),
            reference_url: item.reference_url ?? '',
            active: item.active,
            image: null,
            remove_image: false,
        });
        setOpen(true);
    };

    const submit = () => {
        const data = new FormData();
        data.append('name', form.name);
        data.append('category', form.category);
        data.append('length_cm', form.length_cm);
        data.append('width_cm', form.width_cm);
        data.append('height_cm', form.height_cm);
        data.append('material', form.material);
        data.append('price_clp', form.price_clp);
        data.append('stock', form.stock);
        data.append('min_stock', form.min_stock);
        data.append('reference_url', form.reference_url);
        data.append('active', form.active ? '1' : '0');
        if (form.image) data.append('image', form.image);
        if (form.remove_image) data.append('remove_image', '1');
        if (editing) data.append('_method', 'PUT');

        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) router.post(`/catalogo/${editing.id}`, data, options);
        else router.post('/catalogo', data, options);
    };

    return (
        <>
            <Head title="Urnas y Ataúdes" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Mantenedor de Urnas y Ataúdes"
                    subtitle="Catálogo de productos funerarios, dimensiones, materiales, precios y stock disponible."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Nuevo producto</Button>}
                />

                <div className="mb-5 flex flex-wrap gap-2">
                    {['Todas', ...categories].map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setFilter(category)}
                            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition ${
                                filter === category
                                    ? 'border-[#7b68ae] bg-[#7b68ae] text-white'
                                    : 'border-[#e5dfd5] bg-white text-[#5f576e] hover:bg-[#f1ecf8]'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {visible.length === 0 ? (
                    <EmptyState message="No hay productos en esta categoría." />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {visible.map((item) => (
                            <Card key={item.id} padded={false} className="overflow-hidden">
                                <div className="flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#f1ecf8] to-[#faf8f5]">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-[#a493ce]">
                                            <Archive className="size-12" />
                                            <span className="text-xs">Sin imagen</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-[#2d2542]">{item.name}</h3>
                                            <p className="mt-1 text-xs text-[#8b8495]">{item.category}</p>
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-1">
                                            {item.stock < item.min_stock && <Badge tone="amber">Stock bajo</Badge>}
                                            <Badge tone={item.active ? 'green' : 'gray'}>{item.active ? 'Activo' : 'Inactivo'}</Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1.5 text-sm text-[#6f6878]">
                                        <p>Dimensiones: <span className="font-medium">{item.length_cm} x {item.width_cm} x {item.height_cm} cm</span></p>
                                        <p>Material: <span className="font-medium">{item.material || 'No indicado'}</span></p>
                                        <p>Stock: <span className="font-medium">{item.stock} unidades</span> <span className="text-xs text-[#8b8495]">(mín. {item.min_stock})</span></p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-[#e5dfd5] pt-4">
                                        <span className="text-lg font-semibold text-[#5a4a86]">{clp(item.price_clp)}</span>
                                        <div className="flex gap-1">
                                            {item.reference_url && (
                                                <a href={item.reference_url} target="_blank" rel="noreferrer" className="rounded-md p-2 text-[#7a7285] hover:bg-[#f1ecf8]" title="Referencia externa">
                                                    <ExternalLink className="size-4" />
                                                </a>
                                            )}
                                            <Button variant="ghost" onClick={() => openEdit(item)} title="Editar"><Pencil className="size-4" /></Button>
                                            <Button variant="ghost" onClick={() => deleteRecord(`/catalogo/${item.id}`, '¿Eliminar este producto del catálogo?')} title="Eliminar"><Trash2 className="size-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre del modelo" className="sm:col-span-2">
                            <input className="funeraria-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </Field>
                        <Field label="Categoría">
                            <select className="funeraria-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {categories.map((category) => <option key={category}>{category}</option>)}
                            </select>
                        </Field>
                        <Field label="Material">
                            <input className="funeraria-input" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="Ej.: Roble, mármol, latón" />
                        </Field>
                        <Field label="Largo (cm)"><input type="number" min={1} className="funeraria-input" value={form.length_cm} onChange={(e) => setForm({ ...form, length_cm: e.target.value })} required /></Field>
                        <Field label="Ancho (cm)"><input type="number" min={1} className="funeraria-input" value={form.width_cm} onChange={(e) => setForm({ ...form, width_cm: e.target.value })} required /></Field>
                        <Field label="Alto (cm)"><input type="number" min={1} className="funeraria-input" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} required /></Field>
                        <Field label="Precio (CLP)"><input type="number" min={0} className="funeraria-input" value={form.price_clp} onChange={(e) => setForm({ ...form, price_clp: e.target.value })} required /></Field>
                        <Field label="Stock disponible"><input type="number" min={0} className="funeraria-input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></Field>
                        <Field label="Stock mínimo (alerta)"><input type="number" min={0} className="funeraria-input" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} required /></Field>
                        <Field label="URL de referencia (opcional)">
                            <input type="url" className="funeraria-input" value={form.reference_url} onChange={(e) => setForm({ ...form, reference_url: e.target.value })} placeholder="https://..." />
                        </Field>
                        <Field label="Imagen del catálogo (opcional)" hint="JPG, PNG o WebP · máximo 2 MB">
                            <input type="file" accept="image/*" className="funeraria-input" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })} />
                        </Field>
                    </div>
                    <div className="flex flex-wrap gap-5">
                        <Checkbox checked={form.active} onChange={(value) => setForm({ ...form, active: value })} label="Producto activo" />
                        {editing?.image_path && <Checkbox checked={form.remove_image} onChange={(value) => setForm({ ...form, remove_image: value })} label="Quitar imagen actual" />}
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Agregar producto'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
