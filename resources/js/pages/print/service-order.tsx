import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { clp, dateES } from '@/components/funeraria/ui';

type Props = {
    service: {
        id: number;
        code: string;
        service_date: string;
        deceased_name: string;
        contractor_name: string | null;
        contractor_email: string | null;
        viewing_room: string | null;
        status: string;
        notes: string | null;
        product: { name: string; category: string; material: string | null; price_clp: number } | null;
    };
    company: { name: string; address: string; phone: string; email: string };
};

export default function PrintServiceOrder({ service, company }: Props) {
    return (
        <>
            <Head title={`Orden de servicio ${service.code}`} />
            <div className="min-h-screen bg-[#faf8f5] py-6">
                <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end px-4">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#7b68ae] px-4 py-2 text-sm font-medium text-white hover:bg-[#69579b]"
                    >
                        <Printer className="size-4" /> Imprimir orden
                    </button>
                </div>
                <article className="mx-auto max-w-3xl bg-white p-10 text-[#2d2542] shadow-sm">
                    <header className="flex items-start justify-between border-b-2 border-[#7b68ae] pb-6">
                        <div>
                            <h1 className="text-2xl font-semibold">{company.name}</h1>
                            <p className="mt-1 text-sm text-[#6f6878]">{company.address}</p>
                            <p className="text-sm text-[#6f6878]">{company.phone} · {company.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-[#8b8495]">Orden de servicio</p>
                            <p className="mt-1 text-xl font-semibold text-[#5a4a86]">{service.code}</p>
                            <p className="text-sm text-[#6f6878]">{dateES(service.service_date)}</p>
                        </div>
                    </header>

                    <section className="mt-8">
                        <h2 className="mb-4 border-b border-[#e5dfd5] pb-2 text-sm font-semibold uppercase tracking-wide text-[#7b68ae]">Datos del servicio</h2>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div><dt className="text-xs text-[#8b8495]">Fallecido/a</dt><dd className="mt-1 font-medium">{service.deceased_name}</dd></div>
                            <div><dt className="text-xs text-[#8b8495]">Contratante</dt><dd className="mt-1 font-medium">{service.contractor_name ?? '—'}</dd></div>
                            <div><dt className="text-xs text-[#8b8495]">Correo contratante</dt><dd className="mt-1">{service.contractor_email ?? '—'}</dd></div>
                            <div><dt className="text-xs text-[#8b8495]">Sala velatoria</dt><dd className="mt-1">{service.viewing_room ?? '—'}</dd></div>
                            <div><dt className="text-xs text-[#8b8495]">Estado</dt><dd className="mt-1">{service.status}</dd></div>
                            <div><dt className="text-xs text-[#8b8495]">Fecha de servicio</dt><dd className="mt-1">{dateES(service.service_date)}</dd></div>
                        </dl>
                    </section>

                    <section className="mt-8">
                        <h2 className="mb-4 border-b border-[#e5dfd5] pb-2 text-sm font-semibold uppercase tracking-wide text-[#7b68ae]">Producto asignado</h2>
                        {service.product ? (
                            <div className="rounded-lg border border-[#e5dfd5] p-4">
                                <p className="font-medium">{service.product.name}</p>
                                <p className="mt-1 text-sm text-[#6f6878]">
                                    {service.product.category} · {service.product.material ?? 'Material no indicado'}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-[#5a4a86]">{clp(service.product.price_clp)}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-[#8b8495]">Sin producto asignado.</p>
                        )}
                    </section>

                    {service.notes && (
                        <section className="mt-8">
                            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#7b68ae]">Observaciones</h2>
                            <p className="text-sm leading-relaxed text-[#5f576e]">{service.notes}</p>
                        </section>
                    )}

                    <footer className="mt-16 border-t border-[#e5dfd5] pt-6 text-center text-xs text-[#8b8495]">
                        Documento generado por el sistema de gestión de Funeraria Cristo Rey · Temuco, Chile
                    </footer>
                </article>
            </div>
        </>
    );
}
