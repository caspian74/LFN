# Línea Frontera · sitio, cuentas de cliente y panel de admin

Sitio de agencia de marketing para Tijuana. Todo corre en Cloudflare (gratis para empezar) y se despliega desde GitHub.

- **Landing** (`/`): portada animada, servicios, proceso, panel de ejemplo, paquetes con botón de compra, calculadora, FAQ y formulario de diagnóstico.
- **Cuentas** (`/auth.html`): registro e inicio de sesión.
- **Portal del cliente** (`/dashboard.html`): KPIs, campañas, contenido por aprobar, SEO local, paquete y pagos, tickets de soporte. Se actualiza solo cada 30 s.
- **Admin** (`/admin.html`): resumen del negocio, clientes (editor de campañas, resultados diarios, contenido, SEO, tareas), leads en kanban, pedidos, tickets, usuarios, **editor de todo el sitio con vista previa en vivo y versiones**, herramientas y registro de actividad.

## Publicar en 6 pasos

1. **GitHub**: crea un repositorio y sube esta carpeta.
2. **Cloudflare → Workers & Pages → Create → Pages → Connect to Git**. Build command: `node scripts/bake.mjs`. Output directory: `public`.
3. **Base de datos**: en la terminal, con Node 22: `npm install`, `npx wrangler login`, `npx wrangler d1 create linea-frontera-db`. Copia el `database_id` a `wrangler.toml`, y corre `npm run db:init`.
4. En el proyecto de Pages: **Settings → Bindings → D1 database**, variable `DB` → `linea-frontera-db`. En **Settings → Variables and Secrets** agrega `ADMIN_SETUP_TOKEN` con una frase larga y secreta.
5. **Dominio**: Custom domains → `lineafrontera.stream` (si el dominio ya está en Cloudflare, se configura solo).
6. **Primer administrador**: abre `https://lineafrontera.stream/auth.html`, toca "Primera vez: configurar administrador", pon tu token, correo y una contraseña de 10+ caracteres. Solo funciona una vez. Después puedes borrar `ADMIN_SETUP_TOKEN`.

Haz un nuevo deploy después de agregar variables o el binding.

## Cobrar con Stripe (opcional; sin esto los pedidos se confirman por WhatsApp)

1. En Stripe crea un producto por paquete con precio mensual recurrente en MXN.
2. En Admin → **Sitio → Paquetes y precios**, pega el `price_…` de cada uno en "Stripe Price ID" y publica.
3. Variables en Cloudflare: `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`.
4. En Stripe → Developers → Webhooks agrega `https://lineafrontera.stream/api/stripe/webhook` con el evento `checkout.session.completed`.
5. Activa el portal de clientes en Stripe (Settings → Billing → Customer portal) para que cada cliente administre su tarjeta y facturas.

Con Stripe, al pagar el paquete se activa solo en la cuenta del cliente. Si prefieres, en lugar del Price ID puedes pegar un Payment Link de Stripe.

## Otras variables (todas opcionales)

| Variable | Para qué |
|---|---|
| `TURNSTILE_SITEKEY` y `TURNSTILE_SECRET` | Captcha de Cloudflare en registro, login y formulario |
| `NOTIFY_WEBHOOK` | Aviso de cada lead nuevo a Discord, Slack o Zapier |
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `RESEND_FROM` | Correo cuando llega un lead |

Google Analytics 4 y Meta Pixel se pegan desde Admin → Sitio → SEO y analítica (sin tocar código).

## Cómo se maneja el día a día

- **Cliente nuevo que se registra**: aparece en Clientes con su ficha vacía. Ábrela y carga campañas, resultados y contenido; él los ve en su panel.
- **Cliente que aún no tiene cuenta**: Clientes → Nuevo cliente. Te da un código; el cliente lo escribe en Cuenta → "¿Ya eras cliente?".
- **Lead del formulario**: Leads → ábrelo → "Escribir por WhatsApp" o "Convertir en cliente".
- **Transferencia**: Pedidos → "Marcar pagado" activa el paquete.
- **Cambiar textos, precios, colores o el orden de secciones**: Sitio. La vista previa se actualiza al escribir y "Publicar cambios" lo manda al sitio. Cada publicación queda en Versiones.
- **Resultados diarios**: en el cliente → Resultados diarios puedes pegar filas desde Excel (fecha, gasto, leads, ventas, ingresos).

## Probar en tu computadora

```
node scripts/bake.mjs        # genera public/index.html
node scripts/dev-server.mjs  # http://localhost:8788  (base SQLite en memoria; token admin: dev-setup-token)
node scripts/test-api.mjs    # 50+ pruebas de la API
```

Si publicas solo la carpeta `public` en un hosting estático sin Functions (por ejemplo GitHub Pages), el sitio entra en **modo demo**: guarda todo en el navegador y muestra un aviso (la primera cuenta que crees es admin). Sirve para enseñarlo, no para operar.

## Seguridad incluida

Contraseñas con PBKDF2-SHA256, sesiones en cookie HttpOnly/Secure con token guardado como hash, protección CSRF, límites de intentos, consultas parametrizadas, todo el texto escapado, validación de enlaces y colores, CSV a prueba de fórmulas, cabeceras CSP, firma verificada en el webhook de Stripe y sin contraseñas escritas en el código.

## Pendiente de tu lado

- Revisa los textos de **aviso de privacidad y términos** con un abogado y agrega tu domicilio.
- Los **testimonios** están vacíos a propósito: en Sitio → Confianza agrégalos cuando tengas reales (si no tienen texto, no se muestran).
- Confirma si tus precios incluyen IVA y ajusta la nota de paquetes.
- Las cifras del panel de ejemplo en la portada son demostrativas y están etiquetadas como tal.
