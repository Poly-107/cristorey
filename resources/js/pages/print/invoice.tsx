import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { clp, dateES } from '@/components/funeraria/ui';

type Props = {
    invoice: {
        id: number;
        folio: string;
        issue_date: string;
        net_amount: number;
        iva_amount: number;
        afp_discount: number;
        family_copay: number;
        total: number;
        voided_at: string | null;
        void_reason: string | null;
        service: { code: string; deceased_name: string; contractor_name: string | null };
        items: Array<{ description: string; quantity: number; unit_price: number; subtotal: number }>;
    };
    company: { name: string; rut: string; address: string; phone: string };
};

export default function PrintInvoice({ invoice, company }: Props) {
    return (
        <>
            <Head title={`Boleta ${invoice.folio}`} />
            <div className="min-h-screen bg-[#faf8f5] py-6">
                <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end px-4">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#7b68ae] px-4 py-2 text-sm font-medium text-white hover:bg-[#69579b]"
                    >
                        <Printer className="size-4" /> Imprimir / guardar como PDF
                    </button>
                </div>
                <article className="mx-auto max-w-3xl bg-white p-10 text-[#2d2542] shadow-sm">
                    <header className="flex items-start justify-between border-b-2 border-[#7b68ae] pb-6">
                        <div>
                            <h1 className="text-2xl font-semibold">{company.name}</h1>
                            <p className="mt-1 text-sm text-[#6f6878]">RUT {company.rut} · {company.address}</p>
                            <p className="text-sm text-[#6f6878]">{company.phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-[#8b8495]">Boleta</p>
                            <p className="mt-1 text-xl font-semibold text-[#5a4a86]">{invoice.folio}</p>
                            <p className="text-sm text-[#6f6878]">{dateES(invoice.issue_date)}</p>
                            {invoice.voided_at && (
                                <p className="mt-2 inline-flex rounded-full border border-[#efc7c7] bg-[#fff5f5] px-2.5 py-0.5 text-xs font-medium text-[#a33]">ANULADA</p>
                            )}
                        </div>
                    </header>

                    {invoice.voided_at && (
                        <div className="mt-6 rounded-lg border border-[#efc7c7] bg-[#fff5f5] p-4 text-sm text-[#8a3d3d]">
                            <p className="font-semibold">Documento anulado con fecha {dateES(invoice.voided_at)}.</p>
                            <p className="mt-1">Motivo: {invoice.void_reason ?? 'No indicado'}</p>
                        </div>
                    )}

                    <section className="mt-8 rounded-lg border border-[#e5dfd5] p-4 text-sm">
                        <p><span className="text-[#8b8495]">Expediente:</span> <strong>{invoice.service.code}</strong></p>
                        <p className="mt-1"><span className="text-[#8b8495]">Fallecido/a:</span> {invoice.service.deceased_name}</p>
                        <p className="mt-1"><span className="text-[#8b8495]">Contratante:</span> {invoice.service.contractor_name ?? '—'}</p>
                    </section>

                    <section className="mt-8">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7b68ae]">Detalle de cobros</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#e5dfd5] text-left text-xs uppercase text-[#8b8495]">
                                    <th className="py-2">Descripción</th>
                                    <th className="py-2 text-center">Cant.</th>
                                    <th className="py-2 text-right">Unitario</th>
                                    <th className="py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index} className="border-b border-[#f1ece5]">
                                        <td className="py-3">{item.description}</td>
                                        <td className="py-3 text-center">{item.quantity}</td>
                                        <td className="py-3 text-right">{clp(item.unit_price)}</td>
                                        <td className="py-3 text-right">{clp(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
                            <p className="flex justify-between"><span className="text-[#6f6878]">Neto</span><span>{clp(invoice.net_amount)}</span></p>
                            <p className="flex justify-between"><span className="text-[#6f6878]">IVA (19%)</span><span>{clp(invoice.iva_amount)}</span></p>
                            <p className="flex justify-between"><span className="text-[#6f6878]">Cuota Mortuoria AFP</span><span>-{clp(invoice.afp_discount)}</span></p>
                            <p className="flex justify-between"><span className="text-[#6f6878]">Copago familiar</span><span>{clp(invoice.family_copay)}</span></p>
                            <p className="flex justify-between border-t-2 border-[#7b68ae] pt-3 text-lg font-semibold"><span>Total</span><span>{clp(invoice.total)}</span></p>
                        </div>
                    </section>

                    <footer className="mt-16 border-t border-[#e5dfd5] pt-6 text-center text-xs text-[#8b8495]">
                        Documento generado por el sistema de gestión de Funeraria Cristo Rey · Temuco, Chile
                    </footer>
                </article>
            </div>
        </>
    );
}
