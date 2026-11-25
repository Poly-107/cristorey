import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
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

type Absence = {
    id: number;
    user_id: number | null;
    worker_name: string;
    position: string;
    reason: string;
    start_date: string;
    end_date: string;
    status: string;
    notes: string | null;
};

type Props = {
    absences: Absence[];
    users: Array<{ id: number; name: string; role: string }>;
    reasons: string[];
    statuses: string[];
};

type FormState = {
    user_id: string;
    worker_name: string;
    position: string;
    reason: string;
    start_date: string;
    end_date: string;
    status: string;
    notes: string;
};

const emptyForm = (reasons: string[], statuses: string[]): FormState => ({
    user_id: '',
    worker_name: '',
    position: '',
    reason: reasons[0] ?? '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    status: statuses[0] ?? 'Pendiente',
    notes: '',
});

export default function Absences({ absences, users, reasons, statuses }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Absence | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm(reasons, statuses));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm(reasons, statuses));
        setOpen(true);
    };

    const openEdit = (absence: Absence) => {
        setEditing(absence);
        setForm({
            user_id: absence.user_id ? String(absence.user_id) : '',
            worker_name: absence.worker_name,
            position: absence.position,
            reason: absence.reason,
            start_date: absence.start_date.slice(0, 10),
            end_date: absence.end_date.slice(0, 10),
            status: absence.status,
            notes: absence.notes ?? '',
        });
        setOpen(true);
    };

    const submit = () => {
        const data = { ...form, user_id: form.user_id || null };
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) router.put(`/ausencias/${editing.id}`, data, options);
        else router.post('/ausencias', data, options);
    };

    return (
        <>
            <Head title="Registro de Ausencias" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Registro de Ausencias del Personal"
                    subtitle="Controle permisos administrativos, licencias médicas y días compensatorios."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Registrar ausencia</Button>}
                />

                <Card padded={false}>
                    {absences.length === 0 ? (
                        <div className="p-5"><EmptyState message="No hay ausencias registradas." /></div>
                    ) : (
                        <TableShell>
                            <thead>
                                <tr>
                                    <Th>Trabajador</Th>
                                    <Th>Cargo</Th>
                                    <Th>Motivo</Th>
                                    <Th>Desde</Th>
                                    <Th>Hasta</Th>
                                    <Th>Estado</Th>
                                    <Th>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {absences.map((absence) => (
                                    <tr key={absence.id}>
                                        <Td className="font-medium">{absence.worker_name}</Td>
                                        <Td className="text-[#7a7285]">{absence.position}</Td>
                                        <Td>{absence.reason}</Td>
                                        <Td>{dateES(absence.start_date)}</Td>
                                        <Td>{dateES(absence.end_date)}</Td>
                                        <Td><Badge tone={toneForStatus(absence.status)}>{absence.status}</Badge></Td>
                                        <Td>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" title="Editar" onClick={() => openEdit(absence)}><Pencil className="size-4" /></Button>
                                                <Button variant="ghost" title="Eliminar" onClick={() => deleteRecord(`/ausencias/${absence.id}`)}><Trash2 className="size-4" /></Button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    )}
                </Card>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar ausencia' : 'Registrar ausencia'} wide>
                <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Trabajador (opcional, del sistema)">
                            <select
                                className="funeraria-input"
                                value={form.user_id}
                                onChange={(e) => {
                                    const user = users.find((u) => String(u.id) === e.target.value);
                                    setForm({ ...form, user_id: e.target.value, worker_name: user?.name ?? form.worker_name, position: user?.role ?? form.position });
                                }}
                            >
                                <option value="">Seleccione o escriba manualmente</option>
                                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Nombre del trabajador">
                            <input className="funeraria-input" value={form.worker_name} onChange={(e) => setForm({ ...form, worker_name: e.target.value })} required />
                        </Field>
                        <Field label="Cargo">
                            <input className="funeraria-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
                        </Field>
                        <Field label="Motivo">
                            <select className="funeraria-input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                                {reasons.map((reason) => <option key={reason}>{reason}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha desde"><input type="date" className="funeraria-input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></Field>
                        <Field label="Fecha hasta"><input type="date" className="funeraria-input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></Field>
                        <Field label="Estado">
                            <select className="funeraria-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                        </Field>
                        <Field label="Observaciones (opcional)"><input className="funeraria-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Registrar ausencia'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
