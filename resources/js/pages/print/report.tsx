import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { dateES } from '@/components/funeraria/ui';

type Props = {
    typeLabel: string;
    filters: { start: string; end: string };
    columns: string[];
    rows: Array<{ id: number; cells: string[] }>;
};

export default function PrintReport({ typeLabel, filters, columns, rows }: Props) {
    return (
        <>
            <Head title={`Informe de ${typeLabel}`} />
            <div className="min-h-screen bg-[#faf8f5] py-6">
                <div className="no-print mx-auto mb-4 flex max-w-6xl justify-end px-4">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#7b68ae] px-4 py-2 text-sm font-medium text-white hover:bg-[#69579b]"
                    >
                        <Printer className="size-4" /> Imprimir / guardar como PDF
                    </button>
                </div>
                <article className="mx-auto max-w-6xl bg-white p-10 text-[#2d2542] shadow-sm">
                    <header className="flex items-start justify-between border-b-2 border-[#7b68ae] pb-5">
                        <div>
                            <h1 className="text-2xl font-semibold">Funeraria Cristo Rey</h1>
                            <p className="mt-1 text-sm text-[#6f6878]">Informe de {typeLabel.toLowerCase()} por rango de fechas</p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-semibold text-[#5a4a86]">{dateES(filters.start)} – {dateES(filters.end)}</p>
                            <p className="mt-1 text-[#8b8495]">{rows.length} registros</p>
                        </div>
                    </header>

                    <table className="mt-8 w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#e5dfd5] text-xs uppercase text-[#8b8495]">
                                {columns.map((column) => <th key={column} className="py-2">{column}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-b border-[#f1ece5]">
                                    {row.cells.map((cell, index) => (
                                        <td key={index} className={`py-2.5 ${index === 0 ? 'font-medium text-[#5a4a86]' : ''}`}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <footer className="mt-16 border-t border-[#e5dfd5] pt-6 text-center text-xs text-[#8b8495]">
                        Documento generado por el sistema de gestión de Funeraria Cristo Rey · Temuco, Chile
                    </footer>
                </article>
            </div>
        </>
    );
}
