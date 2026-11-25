import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Field,
    Modal,
    PageHeader,
    Td,
    Th,
    TableShell,
    deleteRecord,
    dateES,
} from '@/components/funeraria/ui';

type UserRecord = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
};

type Props = { users: UserRecord[]; roles: Record<string, string> };

type FormState = { name: string; email: string; password: string; role: string; is_active: boolean };

const emptyForm: FormState = { name: '', email: '', password: '', role: 'mostrador', is_active: true };

export default function Users({ users, roles }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<UserRecord | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (user: UserRecord) => {
        setEditing(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            is_active: user.is_active,
        });
        setOpen(true);
    };

    const submit = () => {
        const url = editing ? `/usuarios/${editing.id}` : '/usuarios';
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        const data: Record<string, string | boolean> = {
            name: form.name,
            email: form.email,
            role: form.role,
            is_active: form.is_active,
        };
        if (form.password) data.password = form.password;

        if (editing) router.put(url, data, options);
        else router.post(url, { ...data, password: form.password }, options);
    };

    return (
        <>
            <Head title="Usuarios y Roles" />
            <div className="p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title="Gestión de Usuarios y Roles"
                    subtitle="Módulo exclusivo de Dueño / Gerencia. Administre los accesos de los colaboradores."
                    actions={<Button onClick={openCreate}><Plus className="size-4" /> Nuevo colaborador</Button>}
                />

                <Card padded={false}>
                    <TableShell>
                        <thead>
                            <tr>
                                <Th>Colaborador</Th>
                                <Th>Correo</Th>
                                <Th>Rol</Th>
                                <Th>Estado</Th>
                                <Th>Ingreso</Th>
                                <Th>Acciones</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <Td className="font-medium">{user.name}</Td>
                                    <Td className="text-[#7a7285]">{user.email}</Td>
                                    <Td><Badge>{roles[user.role] ?? user.role}</Badge></Td>
                                    <Td>
                                        <Badge tone={user.is_active ? 'green' : 'gray'}>
                                            {user.is_active ? 'Activa' : 'Desactivada'}
                                        </Badge>
                                    </Td>
                                    <Td className="text-[#7a7285]">{dateES(user.created_at)}</Td>
                                    <Td>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" onClick={() => openEdit(user)} title="Editar"><Pencil className="size-4" /></Button>
                                            <Button
                                                variant="ghost"
                                                title={user.is_active ? 'Desactivar' : 'Activar'}
                                                onClick={() =>
                                                    router.put(`/usuarios/${user.id}`, {
                                                        name: user.name,
                                                        email: user.email,
                                                        role: user.role,
                                                        is_active: !user.is_active,
                                                    }, { preserveScroll: true })
                                                }
                                            >
                                                {user.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                                            </Button>
                                            <Button variant="ghost" onClick={() => deleteRecord(`/usuarios/${user.id}`)} title="Eliminar"><Trash2 className="size-4" /></Button>
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableShell>
                </Card>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar colaborador' : 'Nuevo colaborador'}>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                    className="space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre completo">
                            <input className="funeraria-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </Field>
                        <Field label="Correo electrónico">
                            <input type="email" className="funeraria-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </Field>
                        <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} hint="Mínimo 8 caracteres">
                            <input type="password" className="funeraria-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={8} />
                        </Field>
                        <Field label="Rol del sistema">
                            <select className="funeraria-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </Field>
                    </div>
                    <Checkbox checked={form.is_active} onChange={(value) => setForm({ ...form, is_active: value })} label="Cuenta activa (puede iniciar sesión)" />
                    <div className="flex justify-end gap-2 border-t border-[#e5dfd5] pt-4">
                        <Button variant="light" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editing ? 'Guardar cambios' : 'Crear colaborador'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
