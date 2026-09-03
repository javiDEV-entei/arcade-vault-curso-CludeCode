# SPEC 03 — Acerca de + formulario de contacto (envío real con Resend)

> **Estado:** implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-02
> **Objetivo:** Portar `about.jsx` a `/acerca-de` con el formulario de contacto enviando emails reales vía Resend a través de un Route Handler server-side.

## Sección 1 — Por qué existe esta spec

SPEC 02 dejó explícitamente fuera "Acerca de / Contacto": `references/templates/home-about/about.jsx` no se portó y el Nav no enlazaba "Acerca de". Esta spec cierra ese pendiente: porta el visual de `about.jsx` tal cual (hero de misión, highlights, divisor animado, sección de contacto) y conecta el formulario a un envío de email real con el servicio Resend, en vez de la simulación de terminal fija que trae el prototipo.

Decisiones ya cerradas por el usuario (no reabrir):

- Ruta: **`/acerca-de`**.
- El envío de email se implementa con un **Route Handler** (`app/api/contact/route.ts`), no con Server Actions. La API key de Resend nunca se expone al cliente.
- El correo destino (`to`) es **`javieroliveradev0239@gmail.com`**, configurado vía env var `CONTACT_TO_EMAIL`.
- El remitente (`from`) es **`onboarding@resend.dev`** (remitente de pruebas de Resend), hardcodeado en el Route Handler — no hay dominio propio verificado todavía.
- La API key vive en `RESEND_API_KEY` (`.env.local`, no comiteado — `.env*` ya está en `.gitignore`). El **valor** de esa key lo proporciona el usuario en el momento de crear el archivo — no se inventa ni se deja un placeholder al implementar.
- El formulario tiene estado real de carga y error (botón "ENVIANDO…" deshabilitado durante el POST; bloque de error con estilo terminal si Resend falla), a diferencia del log de terminal fijo del template que nunca falla.
- Validación: campos no vacíos (igual que el template) **más** validación de formato de email con una regex simple, tanto en el cliente como en el servidor.
- **Sin** protección anti-spam (honeypot, rate limiting, captcha) — queda fuera de esta spec.
- **Sin** persistencia de los mensajes de contacto (no hay base de datos en el proyecto); el mensaje solo se envía por email, no se guarda en ningún sitio.
- El diseño visual del template es la fuente de verdad; el CSS de `about.jsx` (hero, highlights, divisor, sección de contacto, terminal de éxito/error) se copia desde `references/templates/home-about/styles.css` a `app/globals.css` — ninguna de esas clases existe todavía ahí.

## Sección 2 — Alcance

**Dentro:**

- Ruta `/acerca-de` (`app/acerca-de/page.tsx`, Server Component): porta `about.jsx` — hero de misión ("ACERCA DE ARCADE VAULT" + texto de misión), fila de 3 highlights (HEART/BROWSER/PLANT con sus iconos SVG pixel), divisor animado (`.about-divider` con 24 píxeles), y sección de contacto (intro + 3 tips + formulario).
- `app/components/about/ContactForm.tsx` (`"use client"`): formulario controlado con estados `idle | sending | success | error`. Sustituye la simulación de terminal fija del template por:
  - Validación cliente: nombre/email/mensaje no vacíos (trim) + regex de formato de email. Si falla, aplica el mismo efecto `shake` de 400ms que ya tiene el template.
  - Al enviar: `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })`.
  - Mientras espera: botón "▶ ENVIAR MENSAJE" pasa a "ENVIANDO…" y se deshabilita.
  - Éxito (200): reemplaza el form por el bloque `.terminal-success` del template (mismo look, líneas `[OK] Conectando…`, `[OK] Validando…`, `[OK] Transmitiendo…`, línea final con el nombre en mayúsculas), con botón "ENVIAR OTRO MENSAJE" que resetea el estado.
  - Error (Resend/red falla, o respuesta no-200): bloque `.terminal-success` reutilizado con línea final en rojo (`> ERROR: NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO.`) y botón "REINTENTAR" que vuelve a `idle` conservando lo escrito en el form (no se pierde el texto).
- `app/api/contact/route.ts` (Route Handler, runtime Node): `POST` que:
  - Lee `{ name, email, msg }` del body.
  - Revalida en servidor: no vacíos (trim) + regex de formato de email. Si falla, responde `400` con `{ error }`.
  - Instancia el SDK de `resend` con `RESEND_API_KEY`, llama a `resend.emails.send({ from: "onboarding@resend.dev", to: process.env.CONTACT_TO_EMAIL, subject: ..., ...})` con el nombre/email/mensaje del remitente en el cuerpo del email (y `reply_to` = email del remitente, para poder responder directo).
  - Si Resend devuelve error, responde `500` con `{ error }`. Si OK, responde `200` con `{ ok: true }`.
- `app/components/Nav.tsx`: añade el enlace "Acerca de" → `/acerca-de` en la barra desktop y en el panel móvil, con estado activo `isAbout = pathname === "/acerca-de"`.
- Dependencia nueva: paquete npm `resend` (SDK oficial).
- `.env.local` (no comiteado) con `RESEND_API_KEY` y `CONTACT_TO_EMAIL`. Se documenta un `.env.example` comiteable con las claves sin valores reales.
- Copiar a `app/globals.css` todas las clases de `about.jsx` que hoy no existen (`.about-hero`, `.about-mission`, `.highlight-row`, `.highlight`, `.about-divider`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-tips`, `.tip`, `.contact-form`, `.shake`, `.terminal-success`, `.term-bar`, `.term-body`, `.dot`, `.caret`, etc.) desde `references/templates/home-about/styles.css`, más una regla nueva para la línea de error del terminal (reutilizando `.line`/color rojo ya presente en el template o el patrón de color existente en `globals.css`).
- `npx tsc --noEmit` sin errores.
- Verificación manual de un envío real (o con la key de pruebas de Resend) documentada en criterios de aceptación.
- Commitear el bloque de agentes regenerado en `AGENTS.md`.

**Fuera de alcance (para futuras specs):**

- Protección anti-spam (honeypot, rate limiting, captcha).
- Persistencia de mensajes de contacto (tabla/registro de mensajes enviados).
- Dominio propio verificado en Resend / remitente personalizado (`contacto@arcadevault.gg` o similar).
- Notificaciones adicionales (Slack, webhook) al recibir un mensaje.
- Página de estado/administración para ver mensajes recibidos.
- Internacionalización o cambio de idioma del formulario/emails.
- Tests automatizados (no hay framework en el proyecto).

## Sección 3 — Modelo de datos

No se introduce persistencia ni estructuras en `app/lib/`. El único "dato" es el payload efímero del formulario, tipado localmente en `ContactForm.tsx` y en el Route Handler:

```ts
type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};
```

No se guarda en ningún almacenamiento; vive solo en el estado de React durante el envío y en el body de la petición HTTP hacia `/api/contact` y de ahí hacia la API de Resend.

## Sección 4 — Plan de implementación

Cada paso deja el proyecto compilando (`npx tsc --noEmit`) y navegable (`next dev`).

1. **Dependencia y env vars.** `npm install resend`. Crear `.env.example` (comiteable) con:
   ```
   RESEND_API_KEY=
   CONTACT_TO_EMAIL=
   ```
   Crear `.env.local` (no comiteado, ya cubierto por `.gitignore`) con `CONTACT_TO_EMAIL=javieroliveradev0239@gmail.com`. El valor de `RESEND_API_KEY` en `.env.local` lo coloca el usuario directamente — al llegar a este paso, quien implemente se detiene y pide la key en vez de inventar o dejar un placeholder que rompa el envío. Prueba manual: `npx tsc --noEmit` sigue pasando.

2. **Route Handler `/api/contact`.** Crear `app/api/contact/route.ts`: `export async function POST(req: Request)`, parsea JSON, valida `name`/`email`/`msg` no vacíos + regex de email; si falla devuelve `Response.json({ error }, { status: 400 })`. Si pasa, instancia `new Resend(process.env.RESEND_API_KEY)` y llama `resend.emails.send({ from: "onboarding@resend.dev", to: process.env.CONTACT_TO_EMAIL!, reply_to: email, subject: \`Nuevo mensaje de ${name} — Arcade Vault\`, text: msg })`. Captura errores del SDK con try/catch y responde `500` con `{ error }` en caso de fallo; `200` con `{ ok: true }` si todo va bien. Prueba manual: `curl -X POST http://localhost:3000/api/contact -d '{"name":"a","email":"a@a.com","msg":"hola"}' -H "Content-Type: application/json"` devuelve `200` y llega el email a `CONTACT_TO_EMAIL`.

3. **`ContactForm` client component.** Crear `app/components/about/ContactForm.tsx` portando el form de `about.jsx`: mismos campos, mismo `shake` en validación cliente (nombre/email/mensaje vacíos o email con formato inválido). Añadir estado `status: "idle" | "sending" | "error"` y `sentName: string | null`. Al enviar válido: `status = "sending"`, `fetch("/api/contact", ...)`; en éxito guarda `sentName` y limpia `status`; en error deja `status = "error"` con el mensaje de error del terminal y botón "REINTENTAR" que vuelve a `idle` sin perder los valores del form. El bloque `.terminal-success` se reutiliza para ambos casos (éxito/error), cambiando solo la última línea y su color. Prueba manual: `npx tsc --noEmit` pasa; con el dev server corriendo, enviar el form con `RESEND_API_KEY` inválida muestra el bloque de error; con una key válida muestra el bloque de éxito.

4. **Página `/acerca-de`.** Crear `app/acerca-de/page.tsx` (Server Component) portando el resto de `about.jsx`: hero de misión, highlights (con sus iconos SVG inline, igual que el template — puede vivir como componente local `AboutHighlightIcon` dentro de la carpeta `app/components/about/`), divisor animado, e intro/tips de la sección de contacto, montando `<ContactForm />` en el lugar del form. Mounta `<RevealObserver />` una vez al final, igual que en `/` y siguiendo el patrón de SPEC 02. Prueba manual: `/acerca-de` renderiza el hero, los 3 highlights, el divisor y la sección de contacto con el form funcional.

5. **Nav.** Añadir enlace "Acerca de" → `/acerca-de` en `app/components/Nav.tsx`, barra desktop y panel móvil, con `isAbout = pathname === "/acerca-de"`. Prueba manual: el enlace "Acerca de" está activo solo en `/acerca-de`; en viewport estrecho el panel lateral lo lista.

6. **CSS.** Revisar cada clase usada por los componentes nuevos contra `app/globals.css`; copiar las que falten desde `references/templates/home-about/styles.css` (bloque about: hero, mission, highlights, divider, contact, terminal-success, shake, animaciones asociadas). Añadir la variante de color rojo/error para la última línea del terminal si no existe ya un token reutilizable. Prueba manual: `/acerca-de` se ve como el prototipo en desktop y en viewport estrecho, incluyendo el estado de éxito y el de error del formulario.

7. **Cierre.** `npx tsc --noEmit` sin errores. Confirmar que `RESEND_API_KEY` no aparece en ningún bundle de cliente (solo se referencia dentro de `app/api/contact/route.ts`). Confirmar el bloque de agentes regenerado en `AGENTS.md` y dejarlo comiteado.

## Sección 5 — Criterios de aceptación

- [ x] `npx tsc --noEmit` termina sin errores.
- [x ] `/acerca-de` muestra el kicker "▸ ACERCA DE", el título "ACERCA DE ARCADE VAULT" y el párrafo de misión.
- [x ] `/acerca-de` muestra los 3 highlights (HECHO CON ❤️ PARA JUGADORES, JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR, PROYECTO EN CONSTANTE CRECIMIENTO) con sus iconos.
- [ x] `/acerca-de` muestra el divisor animado con 24 píxeles y la sección de contacto con los 3 tips (RESPUESTA EN 24-48H, SUGERENCIAS BIENVENIDAS, SIN SPAM, JAMÁS).
- [ x] Enviar el formulario con algún campo vacío aplica el efecto `shake` y no dispara ninguna petición de red.
- [ x] Enviar el formulario con un email sin formato válido (ej. `"abc"`) aplica el efecto `shake` y no dispara ninguna petición de red.
- [ x] Enviar el formulario con datos válidos deshabilita el botón y muestra "ENVIANDO…" mientras espera la respuesta del API.
- [ x] Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` configurados correctamente en `.env.local`, enviar el formulario hace llegar un email real a `javieroliveradev0239@gmail.com` con el nombre, email y mensaje ingresados, y `reply_to` apuntando al email del remitente.
- [x ] Tras un envío exitoso, se muestra el bloque `.terminal-success` con el nombre en mayúsculas en la línea final y un botón "ENVIAR OTRO MENSAJE" que resetea el formulario a vacío.
- [ ] Si el POST a `/api/contact` falla (ej. `RESEND_API_KEY` inválida), se muestra el bloque de error con un botón "REINTENTAR" que vuelve al formulario **sin perder** lo que el usuario había escrito.
- [x ] `POST /api/contact` con `name`/`email`/`msg` vacíos o email con formato inválido responde `400` sin llamar a Resend.
- [ x] El Nav muestra el enlace "Acerca de" → `/acerca-de`, activo solo en esa ruta, tanto en desktop como en el panel móvil.
- [ x] `RESEND_API_KEY` no aparece en ningún archivo bajo `app/components/` ni en el bundle de cliente — solo se lee en `app/api/contact/route.ts`.
- [ ] `.env.local` no está comiteado (`.env*` sigue en `.gitignore`); existe `.env.example` comiteado con las claves vacías.

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** Route Handler (`app/api/contact/route.ts`) en vez de Server Action. Decisión del usuario; deja explícito el endpoint y es el patrón más directo para un `fetch` desde un client component ya existente en el template.
- **No:** Server Action. Añadiría una capa distinta de manejo de formularios (`useActionState`/`useFormStatus`) que el resto del proyecto no usa todavía.
- **Sí:** remitente `onboarding@resend.dev` hardcodeado. Decisión del usuario — no hay dominio propio verificado en Resend aún. Se puede migrar a un dominio propio en una spec futura sin tocar la lógica del formulario, solo la constante `from`.
- **Sí:** `to` configurable vía `CONTACT_TO_EMAIL` (no hardcodeado como el `from`). Permite cambiar el destino sin tocar código, y ya arranca apuntando al email del usuario.
- **Sí:** estados reales de carga/error en el formulario, reemplazando el log de terminal fijo del template. Decisión del usuario — con un envío real, Resend puede fallar o tardar, y el prototipo original no contempla eso.
- **No:** mantener el log de terminal fijo simulado y solo loggear errores en consola. Dejaría al usuario sin feedback visual si el envío real falla.
- **Sí:** validación de formato de email con regex simple, en cliente y servidor. Decisión del usuario — evita el caso trivial de un email mal escrito llegando hasta Resend.
- **No:** honeypot/rate limiting/captcha. Decisión del usuario — el proyecto es un scaffold personal sin tráfico público todavía; se revisita si hace falta.
- **No:** persistir los mensajes de contacto en algún almacenamiento. El proyecto no tiene base de datos; el email de Resend es el único registro del mensaje.
- **Sí:** copiar las clases de `about.jsx` desde `references/templates/home-about/styles.css` a `app/globals.css`, siguiendo el mismo patrón que SPEC 02 con el Home.

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| La API key de Resend se filtra al bundle de cliente si se usa desde un componente `"use client"`. | Toda llamada al SDK de Resend vive exclusivamente en `app/api/contact/route.ts` (server-only); el client component solo hace `fetch` al endpoint interno. Verificado en el criterio de cierre. |
| `onboarding@resend.dev` como remitente puede tener límites de envío o ir a spam en algunas bandejas. | Aceptado como remitente de pruebas mientras no haya dominio propio; documentado como decisión explícita, migrable después sin tocar el formulario. |
| El endpoint queda abierto sin protección anti-spam. | Fuera de alcance por decisión del usuario; riesgo aceptado en un scaffold personal sin tráfico público. Documentado para revisitar si el proyecto se publica. |
| Sin `RESEND_API_KEY`/`CONTACT_TO_EMAIL` configuradas, el formulario siempre falla en runtime aunque compile. | `.env.example` documenta las claves requeridas; el criterio de cierre exige probar un envío real con las variables configuradas antes de dar la spec por terminada. |
| Next 16 tiene breaking changes en Route Handlers (ver `AGENTS.md`). | Consultar `node_modules/next/dist/docs/01-app/` (sección de Route Handlers) antes de escribir `app/api/contact/route.ts`. |
| El bloque de agentes de `AGENTS.md` lo regenera `next dev` y ensucia el árbol. | Commitearlo junto con los cambios, según `CLAUDE.md`. |
