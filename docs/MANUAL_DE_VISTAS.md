# Manual de Vistas — Funeraria Cristo Rey

Guía rápida de pantallas, rutas y permisos del sistema. La interfaz está en español y usa el tema crema/lavanda (`#FAF8F5`, `#E5DFD5`, `#7B68AE → #2D2542`).

## Acceso

- Portada pública: `/` — presentación institucional y botón **Acceder al sistema**.
- Login: `/login` — el registro está desactivado; solo gerencia crea usuarios.
- Usuarios de prueba (clave `password123`):

| Correo | Rol | Etiqueta |
|---|---|---|
| `gerencia@cristorey.cl` | `dueno` | Dueño / Gerencia |
| `encargado@cristorey.cl` | `encargado` | Encargado / Asistente |
| `mostrador@cristorey.cl` | `mostrador` | Mostrador / Atención |
| `chofer@cristorey.cl` | `chofer` | Chofer / Logística |

## Matriz de permisos

El rol `dueno` es superuser. El resto se rige por `App\Support\Funeraria::permissions()` y el middleware `role:...` en `routes/web.php`.

| Módulo | Dueño | Encargado | Mostrador | Chofer |
|---|---|---|---|---|
| Panel general | ✓ | ✓ | ✓ | ✓ (sus recorridos) |
| Expedientes | ✓ | ✓ | ✓ | — |
| Urnas y ataúdes | ✓ | ✓ | ✓ | — |
| Reservas y abonos | ✓ | ✓ | ✓ | — |
| Boletas y cobros | ✓ | — | ✓ | — |
| Informes por fecha | ✓ | ✓ | — | — |
| Ausencias | ✓ | ✓ | — | — |
| Calendario | ✓ | ✓ | ✓ | — |
| Hoja de ruta | ✓ | ✓ | — | ✓ (solo sus viajes) |
| Usuarios y roles | ✓ | — | — | — |

## Módulos

### Panel general (`/dashboard`)
Indicadores de expedientes, urgentes, stock y reservas. El bloque financiero es exclusivo del dueño: recaudación, abonos, saldos, antigüedad de deuda y evolución mensual de los últimos 6 meses.

### Expedientes (`/expedientes`)
CRUD de servicios con folio `SRV-00001`, fecha, fallecido/a, contratante, producto, sala velatoria y estado. Orden de servicio imprimible en `/expedientes/{id}/imprimir`.

### Urnas y ataúdes (`/catalogo`)
Mantenedor con medidas (largo/ancho/alto), material, precio, stock, **stock mínimo** (alerta de reposición), URL de referencia e imagen (JPG/PNG/WebP, máx. 2 MB) almacenada en `public/uploads/catalogo`. No se puede eliminar un producto con expedientes o reservas asociadas: debe desactivarse.

### Reservas (`/reservas`)
Folio `RES-00001`, cliente, producto, valor total, abonos y saldo calculado. Al crear se descuenta el stock en una transacción; al anular se restaura. El saldo se actualiza con cada abono y pasa a *Pagado Total* al saldarlo.

### Boletas (`/boletas`)
Emisión y edición de boletas con ítems, IVA 19%, Cuota Mortuoria AFP (15 UF configurables) y copago familiar. El total se calcula siempre en servidor. Se pueden anular con motivo: quedan en el historial marcadas como **Anulada** y se excluyen de los totales. La vista `/boletas/{id}/imprimir` sirve para imprimir o guardar como PDF.

### Informes (`/informes`)
Cuatro tipos: expedientes, reservas, boletas y ausencias. Filtro por rango de fechas, exportación CSV/Excel y vista de impresión (`/informes/imprimir`).

### Ausencias (`/ausencias`)
Registro de permisos y licencias del personal con trabajador, cargo, motivo, fechas y estado.

### Calendario (`/calendario`)
Eventos de velatorio, ceremonia y traslado con fecha, hora y sala.

### Hoja de ruta (`/flota`)
Vehículos y recorridos por fecha, con inicio y fin de viaje (estos actualizan el estado del vehículo). Gerencia/encargado pueden crear vehículos y recorridos; el chofer solo ve **sus** recorridos asignados y puede iniciarlos/finalizarlos.

### Usuarios y roles (`/usuarios`)
Exclusivo de gerencia: alta, edición, cambio de rol y activación/desactivación de colaboradores.

## Configuración relevante

- UF y AFP: variables `FUNERARIA_UF_VALUE` y `FUNERARIA_AFP_UF` en `.env` (ver `config/funeraria.php`).
- Correo: `MAIL_MAILER=log` en entornos locales. `Notifier::send()` no bloquea el guardado si el envío falla.
- Base de datos: SQLite en `database/database.sqlite`.
- Datos demo: `php artisan migrate:fresh --seed --force` reconstruye todas las tablas y ejemplos.
