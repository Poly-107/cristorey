Estimado/a {{ $service->contractor_name ?? 'cliente' }}:

Adjuntamos la información de la orden de servicio {{ $service->code }} de Funeraria Cristo Rey.

Fallecido/a: {{ $service->deceased_name }}
Fecha de servicio: {{ $service->service_date->format('d/m/Y') }}
Producto: {{ $service->product?->name ?? 'No especificado' }}
Sala velatoria: {{ $service->viewing_room ?? 'Por confirmar' }}
Estado: {{ $service->status }}

Con cariño y respeto,
Funeraria Cristo Rey - Temuco, Chile
