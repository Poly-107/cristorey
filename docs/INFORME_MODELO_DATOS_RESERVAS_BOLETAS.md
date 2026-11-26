# Informe técnico: modelo de datos, reservas y boletas

**Fecha:** 26-11-2026  
**Proyecto:** Sistema de Gestión Funeraria Cristo Rey  
**Origen:** QA de Leo y Felipe — caso de prueba *“erick aguayo”*: la reserva se guarda en *Reservas* pero no aparece en *Boletas y Cobros*.  
**Alcance:** Revisión estática del código local. No se modificó código ni se accedió a RDS.

---

## 1. Dónde están los archivos involucrados

### Controladores

```text
app/Http/Controllers/ReservationController.php
app/Http/Controllers/InvoiceController.php
app/Http/Controllers/ServiceController.php
```

### Modelos Eloquent

```text
app/Models/Reservation.php
app/Models/Invoice.php
app/Models/Service.php
app/Models/CatalogItem.php
app/Models/ReservationPayment.php
app/Models/InvoiceItem.php
```

### Migraciones

```text
database/migrations/2026_11_22_000002_create_services_table.php
database/migrations/2026_11_22_000003_create_reservations_table.php
database/migrations/2026_11_22_000004_create_invoices_table.php
```

### Rutas y vistas

```text
routes/web.php
resources/js/pages/reservations/index.tsx
resources/js/pages/invoices/index.tsx
resources/js/pages/services/index.tsx
```

---

## 2. Cómo se comunican los módulos

**No hay varias bases de datos.** Existe una sola base (`funeraria` en RDS / SQLite en local). Los módulos comparten tablas mediante **foreign keys**:

```text
catalog_items  ←── services.product_id
services       ←── invoices.service_id
invoices       ←── invoice_items.invoice_id

catalog_items  ←── reservations.product_id
reservations   ←── reservation_payments.reservation_id
```

### Evidencia en las migraciones

`2026_11_22_000003_create_reservations_table.php`:

```php
Schema::create('reservations', function (Blueprint $table) {
    $table->id();
    $table->string('folio')->unique();
    $table->foreignId('product_id')->constrained('catalog_items')->cascadeOnDelete();
    $table->string('customer_name');
    $table->string('customer_email')->nullable();
    $table->unsignedInteger('total_value')->default(0);
    $table->unsignedInteger('paid_amount')->default(0);
    $table->string('status')->default('Reservado/Abonado');
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

`2026_11_22_000004_create_invoices_table.php`:

```php
Schema::create('invoices', function (Blueprint $table) {
    $table->id();
    $table->string('folio')->unique();
    $table->foreignId('service_id')->constrained()->cascadeOnDelete();
    $table->date('issue_date');
    $table->unsignedInteger('net_amount')->default(0);
    $table->unsignedInteger('iva_amount')->default(0);
    $table->unsignedInteger('afp_discount')->default(0);
    $table->unsignedInteger('family_copay')->default(0);
    $table->unsignedInteger('total')->default(0);
    $table->boolean('email_sent')->default(false);
    $table->timestamps();
});
```

**Punto clave:** `invoices` tiene `service_id`, pero **no tiene `reservation_id`**.

### Evidencia en los modelos

`app/Models/Reservation.php`:

```php
public function product(): BelongsTo
{
    return $this->belongsTo(CatalogItem::class);
}

public function payments(): HasMany
{
    return $this->hasMany(ReservationPayment::class)->orderBy('paid_on');
}
```

`app/Models/Invoice.php`:

```php
public function service(): BelongsTo
{
    return $this->belongsTo(Service::class);
}

public function items(): HasMany
{
    return $this->hasMany(InvoiceItem::class);
}
```

No existe `Reservation::invoices()` ni `Invoice::reservation()`.

---

## 3. Flujo implementado hoy

### Reserva (`POST /reservas`)

`ReservationController@store`:

1. Valida cliente, producto, valor total, abono inicial, estado y notas.
2. Verifica stock.
3. Crea la reserva con folio propio y `paid_amount`.
4. Si hay abono inicial, crea un `ReservationPayment`.
5. Descuenta 1 al stock del producto.

Abonos posteriores: `POST /reservas/{reservation}/abonos`. Si `pending` llega a 0, el estado pasa a `Pagado Total`.

### Boleta (`POST /boletas`)

`InvoiceController@store`:

1. Requiere un **`service_id` existente** (un expediente).
2. Recibe ítems, fecha, AFP opcional y copago.
3. Calcula: `neto + IVA 19% + copago − AFP`, con mínimo 0.
4. Crea la boleta con folio `BOL-{año}-{000001}` y sus `invoice_items`.
5. Opcionalmente envía correo.

**Ningún controlador llama al otro.** No hay sincronización automática entre `reservations` e `invoices`.

---

## 4. Por qué “erick aguayo” no aparece en Boletas y Cobros

1. Felipe creó una **reserva**, que se guardó en la tabla `reservations`.
2. El módulo **Boletas y Cobros** lista únicamente la tabla `invoices` (`InvoiceController@index`).
3. No hay columna `reservation_id` en `invoices`.
4. No hay relación Eloquent entre ambos modelos.
5. Por lo tanto, la reserva **no puede aparecer** en el listado de boletas sin que exista una boleta creada explícitamente desde un `service_id`.

Además, no existe un mantenedor de `customers`: el cliente es texto libre (`customer_name` en reservas, `contractor_name` en expedientes). Por eso “crear un cliente nuevo” equivale a crear otra reserva/expediente con otro nombre.

---

## 5. ¿Está en el código local o en el entorno remoto?

**Está en el código local.** El modelo de datos funciona para lo que fue diseñado, pero el diseño original no vinculó reservas con boletas. La instancia EC2 ejecuta este mismo código contra RDS; no hay lógica de sincronización oculta en AWS.

Para descartar que el remoto corra otra versión:

```bash
cd /var/www/cristorey
git log -1 --oneline
php artisan migrate:status
```

Y verificar el esquema en RDS:

```sql
DESCRIBE invoices;
```

Debe aparecer `service_id` y **no** `reservation_id`. Si apareciera `reservation_id`, el remoto tendría una migración que no está en local.

---

## 6. Conclusiones

1. No hay error de base de datos ni pérdida de datos: la reserva se guarda correctamente en su tabla.
2. La ausencia en boletas es **consecuencia del diseño**: no existe vínculo `reservations → invoices`.
3. El flujo actual es: **Expediente → Boleta**, y por otro lado **Reserva → Abonos**, dos caminos independientes.
4. No hay entidad `Customer`, por lo que no se puede “reutilizar un cliente” entre módulos.
5. La ambigüedad reportada por el tester es real: la interfaz no explica que primero hay que crear un expediente para emitir la boleta.

---

## 7. Propuesta para la siguiente iteración

| # | Cambio | Archivos afectados |
|---|---|---|
| 1 | Nueva migración `add_reservation_id_to_invoices_table` (FK nullable a `reservations`). | `database/migrations/` |
| 2 | Relaciones `Invoice::reservation()` y `Reservation::invoices()`. | `app/Models/Invoice.php`, `app/Models/Reservation.php` |
| 3 | Botón **“Emitir boleta”** en `/reservas` que pase cliente, monto y `reservation_id`. | `resources/js/pages/reservations/index.tsx` |
| 4 | Aceptar `reservation_id` en `validateData()` y `store()`; hacer `service_id` opcional cuando venga de reserva. | `app/Http/Controllers/InvoiceController.php` |
| 5 | Mostrar en `/boletas` las boletas generadas desde reservas y su origen. | `resources/js/pages/invoices/index.tsx` |
| 6 | Definir cancelación con estado explícito (`Cancelada`) en reservas/boletas. | Controladores, modelos, vistas |
| 7 | Si se decide, habilitar `encargado` en la ruta `role:dueno,mostrador` de boletas. | `routes/web.php`, `app/Support/Funeraria.php` |

> Nota: cualquier cambio debe pasar por `git push` local → `git pull` en EC2 → `php artisan migrate --force` → `npm run build` → recacheo de Laravel.

---

## 8. Estado del diagnóstico original

Documento generado para envío a revisión. La sección 9 registra la implementación posterior.

---

## 9. Implementación realizada (26-11-2026)

Se aplicó la propuesta de forma **aditiva**, sin `migrate:fresh`, sin `db:seed` y sin borrar datos.

### Cambios

| Archivo | Cambio |
|---|---|
| `database/migrations/2026_11_26_000001_add_reservation_id_to_invoices_table.php` | `reservation_id` nullable con FK a `reservations` y `nullOnDelete()`. `service_id` pasa a nullable con `change()`. |
| `app/Models/Invoice.php` | `reservation_id` en `$fillable` y relación `reservation()`. |
| `app/Models/Reservation.php` | Relación `invoices()`. |
| `app/Http/Controllers/InvoiceController.php` | Acepta `service_id` **o** `reservation_id`; precarga desde `?reservation_id=`; muestra/consulta el origen; calcula ítem automático desde la reserva; envía correo al contratante o al cliente de la reserva; imprime el origen. |
| `resources/js/pages/reservations/index.tsx` | Botón verde **“Emitir boleta”** por reserva y texto del orden del flujo. |
| `resources/js/pages/invoices/index.tsx` | Selector de expediente o reserva, badge de origen, precarga y aviso del flujo. |
| `resources/js/pages/services/index.tsx` | Aviso de que la boleta puede emitirse desde el expediente o desde la reserva. |
| `resources/js/components/funeraria/ui.tsx` | `anulada/anulado/cancelada/cancelado` se muestran con tono rojo. |
| `resources/views/emails/invoice.blade.php` | El correo indica origen Expediente/Reserva, sin asumir que toda boleta tiene expediente. |
| `resources/js/pages/print/invoice.tsx` | La boleta impresa indica origen, cliente y producto reservado cuando corresponde. |

### Verificación local

- Copia de seguridad previa: `%TEMP%\cristorey-backup-20261126.sqlite`.
- `php artisan migrate --force`: migración aplicada correctamente con Herd/SQLite, sin `doctrine/dbal`.
- `PRAGMA table_info(invoices)`: `service_id` nullable y `reservation_id` presente.
- `PRAGMA foreign_key_list(invoices)`: `reservation_id → reservations.id` con `ON DELETE SET NULL`; `service_id → services.id` conserva su FK original.
- `php -l` en los cuatro archivos PHP modificados: sin errores.
- `npm run types:check`: sin errores.
- `npm run build`: correcto.

### Notas de despliegue

En EC2, después de hacer `git pull`:

```bash
cd /var/www/cristorey
php artisan migrate --force
npm run build
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

> No cambiaron los permisos de boletas: siguen disponibles solo para `dueno` y `mostrador`.

### Pendiente no incluido

No se creó un estado `Cancelada` en reservas/expedientes; solo se corrigió el tono visual para que una boleta «Anulada» se lea como tal. Tampoco se habilitó `encargado` para vender boletas.
