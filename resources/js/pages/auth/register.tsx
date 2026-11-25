import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { home } from '@/routes';

export default function Register() {
    return (
        <>
            <Head title="Registro no disponible" />
            <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                    El registro público no está habilitado. Las cuentas son creadas por Dueño / Gerencia.
                </p>
                <TextLink href={home().url}>Volver al inicio</TextLink>
            </div>
        </>
    );
}

Register.layout = {
    title: 'Registro no disponible',
    description: 'Solo gerencia puede crear cuentas en el sistema.',
};
