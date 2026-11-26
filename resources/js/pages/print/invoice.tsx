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
        service: { code: string; deceased_name: string; contractor_name: string | null } | null;
        reservation: { folio: string; customer_name: string; product: { name: string } | null } | null;
        items: Array<{ description: string; quantity: number; unit_price: number; subtotal: number }>;
    };
    company: { name: string; rut: string; address: string; phone: string };
};

export default function PrintInvoice({ invoice, company }: Props) {
    const origin = invoice.service
        ? `Expediente ${invoice.service.code}`
        : `Reserva ${invoice.reservation?.folio ?? ''}`;

    return (
        <>
            <Head title={`Boleta ${invoice.folio}`} />
            <div className="min-h-screen bg-[#faf8f5] py-6">
                <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end px-4">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2d2542] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a4a86]"
                    >
                        <Printer className="size-4" /> Imprimir / guardar PDF
                    </button>
                </div>
                <main className="mx-auto max-w-3xl bg-white px-8 py-10 shadow-sm">
                    <header className="mb-8 flex items-start justify-between border-b border-[#e5dfd5] pb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-[#2d2542]">{company.name}</h1>
                            <p className="text-sm text-[#6f6878]">RUT {company.rut}</p>
                            <p className="text-sm text-[#6f6878]">{company.address}</p>
                            <p className="text-sm text-[#6f6878]">{company.phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-[#5a4a86]">{invoice.folio}</p>
                            <p className="text-sm text-[#6f6878]">{dateES(invoice.issue_date)}</p>
                            {invoice.voided_at && <p className="mt-1 text-sm font-semibold text-[#9b4148]">ANULADA</p>}
                        </div>
                    </header>

                    <section className="mb-8 rounded-lg border border-[#e5dfd5] p-4 text-sm">
                        <p><strong>Origen:</strong> {origin}</p>
                        <p>
                            <strong>Cliente:</strong>{' '}
                            {invoice.service
                                ? (invoice.service.contractor_name ?? invoice.service.deceased_name)
                                : (invoice.reservation?.customer_name ?? '—')}
                        </p>
                        {invoice.reservation?.product && <p><strong>Producto reservado:</strong> {invoice.reservation.product.name}</p>}
                    </section>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#e5dfd5] text-left text-[#6f6878]">
                                <th className="py-2">Descripción</th>
                                <th className="py-2 text-center">Cant.</th>
                                <th className="py-2 text-right">P. unitario</th>
                                <th className="py-2 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index} className="border-b border-[#f1ede6]">
                                    <td className="py-2">{item.description}</td>
                                    <td className="py-2 text-center">{item.quantity}</td>
                                    <td className="py-2 text-right">{clp(item.unit_price)}</td>
                                    <td className="py-2 text-right">{clp(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <section className="mt-8 ml-auto max-w-sm space-y-1.5 text-sm">
                        <p className="flex justify-between"><span>Neto</span><span>{clp(invoice.net_amount)}</span></p>
                        <p className="flex justify-between"><span>IVA (19%)</span><span>{clp(invoice.iva_amount)}</span></p>
                        <p className="flex justify-between"><span>Cuota Mortuoria AFP</span><span>-{clp(invoice.afp_discount)}</span></p>
                        <p className="flex justify-between"><span>Copago familiar</span><span>{clp(invoice.family_copay)}</span></p>
                        <p className="mt-3 flex justify-between border-t border-[#e5dfd5] pt-3 text-base font-semibold text-[#2d2542]">
                            <span>Total</span><span>{clp(invoice.total)}</span>
                        </p>
                    </section>

                    {invoice.void_reason && (
                        <p className="mt-8 rounded-lg bg-[#fbeaea] p-3 text-sm text-[#9b4148]">
                            <strong>Motivo de anulación:</strong> {invoice.void_reason}
                        </p>
                    )}

                    <footer className="mt-10 border-t border-[#e5dfd5] pt-5 text-center text-xs text-[#8b8495]">
                        Gracias por confiar en nosotros · Funeraria Cristo Rey · Temuco, Chile
                    </footer>
                </main>
            </div>
        </>
    );
}
