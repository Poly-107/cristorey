# Despliegue en AWS — Funeraria Cristo Rey

> El PDF de levantamiento indicaba que AWS no era necesario en la primera etapa. Esta guía corresponde a la **siguiente fase**, donde sí se decide usar AWS.

Arquitectura objetivo:

```text
Route 53 + ACM (HTTPS)
        |
      EC2 (Nginx + PHP-FPM)
        |------ RDS MySQL 8 (privada)
        |------ S3 (imágenes del catálogo)
        |------ SES (correo, opcional)
```

Región recomendada: `sa-east-1` (São Paulo).

---

## 1. Preparar AWS

### IAM

Crear un rol para la instancia EC2 (`CristoReyEC2Role`) con esta política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::cristorey-uploads"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cristorey-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

Adjuntar el rol a la EC2. Así no hace falta poner `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY` en `.env`.

### RDS MySQL

- Motor: **MySQL 8.0**, `db.t3.micro`, 20 GB.
- **Public access: No**.
- Mismo VPC que la EC2.
- Security group de RDS: entrada `3306` solo desde el security group de la EC2.
- Base de datos: `funeraria`.
- Usuario: `funeraria`.
- Descargar el CA bundle y guardarlo en `/etc/ssl/certs/rds-combined-ca-bundle.pem`.

### S3

- Bucket: `cristorey-uploads` (nombre global único; cambiar si ya existe).
- En **Block Public Access** mantén activado el bloqueo de ACLs, pero desactiva **"Block public and cross-account access to buckets and objects through any public bucket or access point policies"**.
- Agrega esta **bucket policy** (reemplaza el nombre del bucket) para servir las imágenes por URL pública:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadCatalogImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cristorey-uploads/*"
    }
  ]
}
```

- El código **no envía ACLs** (`public-read`); usa la política anterior.
- Habilitar **Bucket versioning**.

### EC2

- Ubuntu 24.04, `t3.small` o superior.
- Security group:
  - Entrada `22` solo desde tu IP.
  - Entrada `80` y `443` desde `0.0.0.0/0`.
  - Salida: todo.
- Adjuntar el IAM role creado arriba.

---

## 2. Instalar software en la EC2

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx php8.3-fpm php8.3-cli php8.3-mysql php8.3-xml \
  php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl \
  php8.3-gd unzip git curl

sudo curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
sudo php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Desplegar el código

```bash
sudo mkdir -p /var/www/cristorey
sudo chown -R ubuntu:ubuntu /var/www/cristorey
cd /var/www/cristorey

git clone TU_REPO_REMOTO .

composer install --no-dev --optimize-autoloader
npm ci
npm run build

cp .env.example .env
nano .env
php artisan key:generate
```

### Variables `.env` para producción

```env
APP_NAME="Funeraria Cristo Rey"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tudominio.cl

DB_CONNECTION=mysql
DB_HOST=mi-rds.xxxxxx.sa-east-1.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=funeraria
DB_USERNAME=funeraria
DB_PASSWORD=...
MYSQL_ATTR_SSL_CA=/etc/ssl/certs/rds-combined-ca-bundle.pem

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

FILESYSTEM_DISK=s3
AWS_DEFAULT_REGION=sa-east-1
AWS_BUCKET=cristorey-uploads
AWS_URL=https://cristorey-uploads.s3.sa-east-1.amazonaws.com

MAIL_MAILER=ses
MAIL_FROM_ADDRESS=contacto@cristorey.cl
MAIL_FROM_NAME="Funeraria Cristo Rey"
```

Luego:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> `php artisan storage:link` no es necesario cuando `FILESYSTEM_DISK=s3`.

El seeder ya sube las tres imágenes demo (`ataud.svg`, `urna.svg`, `urna-personalizada.svg`) a S3 cuando el disco por defecto es `s3`.

Si la base ya estaba sembrada antes de cambiar a S3, sube las imágenes manualmente:

```bash
php artisan tinker --execute="foreach (['ataud.svg','urna.svg','urna-personalizada.svg'] as \$f) { Illuminate\Support\Facades\Storage::disk('s3')->put('uploads/catalogo/'.\$f, file_get_contents(public_path('uploads/catalogo/'.\$f))); }"
```

---

## 4. Nginx

`/etc/nginx/sites-available/cristorey`:

```nginx
server {
    listen 80;
    server_name tudominio.cl www.tudominio.cl;
    root /var/www/cristorey/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cristorey /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. HTTPS y dominio

1. Dominio en **Route 53** apuntando a la IP elástica de la EC2.
2. Certificado en **ACM** (`us-east-1` si se usa CloudFront; `sa-east-1` si se usa ALB directo).
3. Validación DNS automática por Route 53.
4. Colocar el certificado en Nginx o, preferiblemente, poner un **ALB** delante de la EC2 con el certificado ACM.
5. Redirigir HTTP → HTTPS.

---

## 6. Correo con SES (opcional)

1. Verificar el dominio en Amazon SES.
2. Salir del SES Sandbox si se enviará a correos externos.
3. Crear credenciales SMTP o usar el rol IAM con `ses:SendEmail`.
4. Configurar:
   - `MAIL_MAILER=ses`, o
   - `MAIL_MAILER=smtp` con `MAIL_HOST=email-smtp.sa-east-1.amazonaws.com`, puerto `587`, `MAIL_SCHEME=tls`.

El correo no bloquea los guardados: si SES falla, la operación principal igual se registra.

---

## 7. Verificación posterior al deploy

```bash
php artisan about
php artisan migrate:status
php artisan route:list | Measure-Object
```

Checklist funcional:

- [ ] Login con `gerencia@cristorey.cl`.
- [ ] El dashboard carga con datos reales desde RDS.
- [ ] `/catalogo` muestra las imágenes servidas desde S3 (`https://...s3...`).
- [ ] Crear un producto con imagen y ver que se guarda en S3.
- [ ] Generar boleta e imprimir.
- [ ] Exportar CSV desde `/informes`.
- [ ] Chofer ve solo sus recorridos.
- [ ] HTTPS activo sin advertencias de certificado.

---

## 8. Backups y monitoreo

- RDS: activar **automated backups** (7 días mínimo).
- S3: versioning habilitado.
- CloudWatch: logs de Nginx (`/var/log/nginx/*`) y Laravel (`storage/logs/laravel.log`).
- Alertas de CloudWatch para CPU > 80% y espacio en disco > 80%.

---

## 9. Nota sobre el PDF original

El documento de levantamiento señalaba:

> hosting compartido o VPS con PHP y MySQL … no justifica … infraestructura cloud distribuida (por ejemplo, AWS o Azure).

Esta guía aplica porque el proyecto avanzó a una fase posterior. La lógica de negocio no cambió: solo infraestructura, variables de entorno y el disco de archivos de Laravel.
