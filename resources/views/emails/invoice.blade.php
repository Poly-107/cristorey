Estimado/a cliente:

Adjuntamos el comprobante de la boleta {{ $invoice->folio }} de Funeraria Cristo Rey.

Origen: {{ $invoice->service ? 'Expediente '.$invoice->service->code : 'Reserva '.$invoice->reservation?->folio }}
Fecha: {{ $invoice->issue_date->format('d/m/Y') }}
Neto: ${{ number_format($invoice->net_amount, 0, ',', '.') }}
IVA (19%): ${{ number_format($invoice->iva_amount, 0, ',', '.') }}
Cuota Mortuoria AFP: -${{ number_format($invoice->afp_discount, 0, ',', '.') }}
Copago familiar: ${{ number_format($invoice->family_copay, 0, ',', '.') }}
Total: ${{ number_format($invoice->total, 0, ',', '.') }}

Gracias por confiar en nosotros.
Funeraria Cristo Rey - Temuco, Chile
