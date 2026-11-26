import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export function clp(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);
    return '$' + amount.toLocaleString('es-CL', { maximumFractionDigits: 0 });
}

export function dateES(value: string | null | undefined): string {
    if (!value) return '—';
    const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.\d+)?Z?)?$/);
    const date = new Date(dateOnly ? `${dateOnly[1]}T12:00:00` : value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#2d2542]">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-[#7a7285]">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Card({
    children,
    className = '',
    padded = true,
}: {
    children: ReactNode;
    className?: string;
    padded?: boolean;
}) {
    return (
        <section className={`funeraria-card ${padded ? 'p-5' : ''} ${className}`}>
            {children}
        </section>
    );
}

export function CardTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-base font-semibold text-[#2d2542]">{children}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#7a7285]">{subtitle}</p>}
        </div>
    );
}

const badgeTones: Record<string, string> = {
    lavender: 'bg-[#f1ecf8] text-[#5a4a86] border-[#ddd3ef]',
    green: 'bg-[#eaf5ee] text-[#2f6b45] border-[#cbe6d5]',
    amber: 'bg-[#fdf3df] text-[#8a651c] border-[#f0dfb5]',
    red: 'bg-[#fbeaea] text-[#9b4148] border-[#f0cccc]',
    gray: 'bg-[#f5f2ed] text-[#6f6878] border-[#e5dfd5]',
};

export function Badge({
    children,
    tone = 'lavender',
}: {
    children: ReactNode;
    tone?: keyof typeof badgeTones | string;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone] ?? badgeTones.gray}`}
        >
            {children}
        </span>
    );
}

export function toneForStatus(status: string): string {
    const value = status.toLowerCase();
    if (['urgente', 'rechazada', 'vencido', 'anulada', 'anulado', 'cancelada', 'cancelado'].includes(value)) return 'red';
    if (['pagado total', 'entregado', 'aprobada', 'finalizado', 'disponible'].includes(value)) return 'green';
    if (['en curso', 'en ruta', 'pendiente', 'documentos pendientes', 'reservado/abonado', 'programado'].includes(value)) return 'amber';
    return 'lavender';
}

export function StatCard({
    label,
    value,
    hint,
    icon,
    tone = 'lavender',
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: ReactNode;
    tone?: 'lavender' | 'green' | 'amber' | 'blue';
}) {
    const tones = {
        lavender: 'bg-[#f1ecf8] text-[#5a4a86]',
        green: 'bg-[#eaf5ee] text-[#2f6b45]',
        amber: 'bg-[#fdf3df] text-[#8a651c]',
        blue: 'bg-[#e9eff7] text-[#3d5f87]',
    };

    return (
        <Card className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8b8495]">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#2d2542]">{value}</p>
                {hint && <p className="mt-1 text-xs text-[#8b8495]">{hint}</p>}
            </div>
            {icon && (
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
                    {icon}
                </div>
            )}
        </Card>
    );
}

export function Button({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    disabled = false,
    className = '',
    title,
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'light' | 'danger' | 'ghost';
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    title?: string;
}) {
    const variants = {
        primary: 'bg-[#7b68ae] text-white hover:bg-[#69579b] border-[#7b68ae]',
        light: 'bg-white text-[#5a4a86] hover:bg-[#f1ecf8] border-[#e5dfd5]',
        danger: 'bg-white text-[#9b4148] hover:bg-[#fbeaea] border-[#f0cccc]',
        ghost: 'bg-transparent text-[#6f6878] hover:bg-[#f1ecf8] border-transparent',
    };

    return (
        <button
            type={type}
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

export function Field({
    label,
    children,
    hint,
    className = '',
}: {
    label: string;
    children: ReactNode;
    hint?: string;
    className?: string;
}) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1.5 block text-xs font-medium text-[#5f576e]">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-[#8b8495]">{hint}</span>}
        </label>
    );
}

export function Modal({
    open,
    onClose,
    title,
    children,
    wide = false,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    wide?: boolean;
}) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2d2542]/40 p-4 backdrop-blur-sm sm:p-8">
            <div
                className={`funeraria-card my-auto w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} overflow-hidden`}
            >
                <div className="flex items-center justify-between border-b border-[#e5dfd5] px-5 py-4">
                    <h2 className="text-base font-semibold text-[#2d2542]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-md p-1 text-[#7a7285] hover:bg-[#f1ecf8]"
                        aria-label="Cerrar"
                    >
                        <X className="size-5" />
                    </button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
            </div>
        </div>
    );
}

export function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed border-[#e5dfd5] bg-[#faf8f5] px-4 py-10 text-center text-sm text-[#8b8495]">
            {message}
        </div>
    );
}

export function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-[#e5dfd5]">
            <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
        </div>
    );
}

export function Th({ children }: { children: ReactNode }) {
    return (
        <th className="border-b border-[#e5dfd5] bg-[#faf8f5] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#7a7285]">
            {children}
        </th>
    );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <td className={`border-b border-[#f1ece5] px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function deleteRecord(url: string, message = '¿Está seguro de eliminar este registro?') {
    if (window.confirm(message)) {
        router.delete(url, { preserveScroll: true });
    }
}

export function Checkbox({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5f576e]">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="size-4 accent-[#7b68ae]"
            />
            {label}
        </label>
    );
}
