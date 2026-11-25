import { Head, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Field, Modal, PageHeader } from '@/components/funeraria/ui';

type Event = {
    id: number;
    title: string;
    type: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    service_id: number | null;
    notes: string | null;
};

type Props = {
    events: Event[];
    services: Array<{ id: number; code: string; deceased_name: string }>;
    month: string;
    types: string[];
};

type FormState = {
    title: string;
    type: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location: string;
    service_id: string;
    notes: string;
};

const emptyForm = (types: string[], date: string): FormState => ({
    title: '', type: types[0] ?? 'Velatorio', event_date: date,
    start_time: '', end_time: '', location: '', service_id: '', notes: '',
});

const typeTone = (type: string) =>
    type === 'Velatorio' ? 'lavender' : type === 'Ceremonia' ? 'green' : 'amber';

export default function Calendar({ events, services, month, types }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Event | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(types, `${month}-01`));

    const [year, monthNumber] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNumber - 1, 1);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const pad = (value: number) => String(value).padStart(2, '0');
    const dateKey = (day: number) => `${year}-${pad(monthNumber)}-${pad(day)}`;
    const byDate = events.reduce<Record<string, Event[]>>((acc, event) => {
        const key = event.event_date.slice(0, 10);
        (acc[key] ??= []).push(event);
        return acc;
    }, {});

    const changeMonth = (delta: number) => {
        const next = new Date(year, monthNumber - 1 + delta, 1);
        router.get('/calendario', { month: `${next.getFullYear()}-${pad(next.getMonth() + 1)}` }, { preserveState: true });
    };

    const openCreate = (day?: number) => {
        setEditing(null);
        setForm(emptyForm(types, day ? dateKey(day) : `${month}-01`));
        setOpen(true);
    };

    const openEdit = (event: Event) => {
        setEditing(event);
        setForm({
            title: event.title,
            type: event.type,
            event_date: event.event_date.slice(0, 10),
            start_time: event.start_time ?? '',
            end_time: event.end_time ?? '',
            location: event.location ?? '',
            service_id: event.service_id ? String(event.service_id) : '',
            notes: event.notes ?? '',
        });
        setOpen(true);
    };

    const submit = () => {
        const data = {
            ...form,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            service_id: form.service_id || null,
        };
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) router.put(`/calendario/${editing.id}`, data, options);
        else router.post('/calendario', data, options);
    };

    const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <>
            <Head title="Calendario" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Calendario Mensual"
                    subtitle="Velatorios, ceremonias y traslados programados."
                    actions={
                        <>
                            <Button variant="light" onClick={() => changeMonth(-1)}><ChevronLeft className="size-4" /> Mes anterior</Button>
                            <Button variant="light" onClick={() => changeMonth(1)}>Mes siguiente <ChevronRight className="size-4" /></Button>
                            <Button onClick={() => openCreate()}><Plus className="size-4" /> Nuevo evento</Button>
                        </>
                    }
                />

                <Card padded={false}>
                    <div className="flex items-center gap-2 border-b border-[#e5dfd5] px-5 py-4">
                        <CalendarDays className="size-5 text-[#7b68ae]" />
                        <h2 className="text-lg font-semibold capitalize">
                            {firstDay.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                        </h2>
                        <span className="ml-auto text-xs text-[#8b8495]">{events.length} eventos este mes</span>
                    </div>
                    <div className="grid grid-cols-7 border-b border-[#e5dfd5] bg-[#faf8f5]">
                        {weekdays.map((day) => (
                            <div key={day} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8b8495]">{day.slice(0, 3)}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {Array.from({ length: offset }, (_, index) => (
                            <div key={`blank-${index}`} className="min-h-28 border-r border-b border-[#f1ece5] bg-[#fcfbfa]" />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, index) => {
                            const day = index + 1;
                            const key = dateKey(day);
                            const dayEvents = byDate[key] ?? [];
                            const isToday = key === new Date().toISOString().slice(0, 10);
                            return (
                                <div key={key} className="min-h-28 border-r border-b border-[#f1ece5] p-2 last:border-r-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? 'bg-[#7b68ae] text-white' : 'text-[#6f6878]'}`}>{day}</span>
                                        <button type="button" onClick={() => openCreate(day)} className="cursor-pointer text-[#b6adbf] hover:text-[#7b68ae]" title="Agregar evento"><Plus className="size-3.5" /></button>
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.map((event) => (
                                            <div key={event.id} className="group rounded border border-[#e5dfd5] bg-white px-1.5 py-1">
                                                <div className="flex items-start justify-between gap-1">
                                                    <button type="button" className="cursor-pointer text-left text-[11px] leading-tight font-medium text-[#2d2542]" onClick={() => openEdit(event)}>
                                                        {event.start_time && <span className="text-[#7b68ae]">{event.start_time} </span>}
                                                        {event.title}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Eliminar evento"
                                                        className="cursor-pointer text-[#c2bacb] opacity-0 group-hover:opacity-100 hover:text-[#9b4148]"
                                                        onClick={() => window.confirm('¿Eliminar este evento?') && router.delete(`/calendario/${event.id}`, { preserveScroll: true })}
                                                    ><Trash2 className="size-3" /></button>
                                                </div>
                                                <Badge tone={typeTone(event.type)}>{event.type}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar evento' : 'Nuevo evento'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Título" className="sm:col-span-2">
                            <input className="funeraria-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </Field>
                        <Field label="Tipo de evento">
                            <select className="funeraria-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                {types.map((type) => <option key={type}>{type}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha"><input type="date" className="funeraria-input" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required /></Field>
                        <Field label="Hora inicio"><input type="time" className="funeraria-input" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></Field>
                        <Field label="Hora término"><input type="time" className="funeraria-input" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></Field>
                        <Field label="Lugar o sala"><input className="funeraria-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
                        <Field label="Expediente vinculado (opcional)">
                            <select className="funeraria-input" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                                <option value="">Sin vincular</option>
                                {services.map((service) => <option key={service.id} value={service.id}>{service.code} · {service.deceased_name}</option>)}
                            </select>
                        </Field>
                        <Field label="Notas (opcional)" className="sm:col-span-2"><textarea rows={2} className="funeraria-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Agregar evento'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
