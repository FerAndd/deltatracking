# Cómo publicar la app (paso a paso)

Necesitas unos 30 minutos. Todo es gratis salvo la clave de Claude (se paga por uso; dos resúmenes por semana cuestan muy poco).

Vas a crear 3 cosas: la **base de datos** (Supabase), la **clave de Claude** (Anthropic) y el **hosting** (Vercel).

---

## Paso 1 · Base de datos en Supabase

1. Entra a **supabase.com** → **Start your project** → **Continue with GitHub**.
2. **New project**:
   - Name: `delta-tracking`
   - Database Password: haz clic en **Generate a password** y **guárdala** (la vas a necesitar).
   - Region: **East US (North Virginia)** o la más cercana a México.
   - Plan: **Free**.
3. Espera 1–2 minutos a que se cree.
4. Arriba haz clic en **Connect**. En la pestaña de "Connection string" elige **Transaction pooler** (puerto **6543**) y copia el texto que empieza con `postgresql://…`.
5. En ese texto, reemplaza `[YOUR-PASSWORD]` por la contraseña del punto 2. Guárdalo: es tu **DATABASE_URL**.

> No tienes que crear tablas: la app las crea sola la primera vez que se publica.

## Paso 2 · Clave de Claude

1. Entra a **console.anthropic.com** y crea tu cuenta.
2. **Settings → Billing**: agrega una tarjeta y carga saldo (con 5 USD alcanza para muchos meses de resúmenes).
3. **API Keys → Create Key**, nómbrala `delta-tracking`, cópiala y guárdala. Es tu **ANTHROPIC_API_KEY**. (Solo se muestra una vez.)

## Paso 3 · Hosting en Vercel

1. Entra a **vercel.com** → **Sign Up** → **Continue with GitHub** (plan **Hobby**, gratis).
2. **Add New… → Project** → busca el repositorio **deltatracking** → **Import**.
   - Si no aparece: **Adjust GitHub App Permissions** y dale acceso a `deltatracking`.
3. Antes de presionar Deploy, abre **Environment Variables** y agrega estas 5 (nombre y valor):

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | El texto del Paso 1 |
| `ADMIN_PASSWORD` | La contraseña con la que **tú** vas a entrar a la app |
| `SESSION_SECRET` | Un texto largo inventado, de 40 letras o más (ej. escribe una frase larga sin espacios) |
| `ANTHROPIC_API_KEY` | La clave del Paso 2 |
| `CRON_SECRET` | Otro texto largo inventado, distinto al anterior |

4. Presiona **Deploy** y espera 2–3 minutos.
5. Te dará una dirección como `https://deltatracking.vercel.app`. ¡Esa es tu app!

> **Importante:** la app debe publicarse desde la rama **main**. Si el código todavía está en otra rama, primero hay que unirla a main (pídemelo y lo preparo), o en Vercel ve a **Settings → Git → Production Branch** y escribe el nombre de la rama.

## Paso 4 · Probarla

1. Abre tu dirección y entra con tu `ADMIN_PASSWORD`.
2. Crea una pieza de prueba.
3. Ve a **Resúmenes → Generar ahora** para comprobar que la clave de Claude funciona.

## Paso 5 · Compartir el link con Delta

1. En la app ve a **Ajustes → Link del cliente**.
2. Presiona **Copiar link** y mándaselo al cliente por WhatsApp o correo. Por ejemplo:

   > ¡Hola! Te comparto el link donde puedes ver en tiempo real el avance de tu contenido: el calendario, las piezas listas para tu revisión y el resumen de cada viernes. No necesitas cuenta, solo ábrelo. 😊

3. Si algún día el link se comparte de más, presiona **Cambiar link**: el anterior deja de funcionar al momento.

## Resúmenes de los viernes

- Cada **viernes a las 5:00 pm (hora de Monterrey)** Vercel crea los dos borradores solo. En el plan gratis de Vercel la hora puede variar dentro de esa hora (5:00–5:59 pm).
- Los ves en **Resúmenes**: revísalos, edítalos y presiona **Guardar y publicar**.
  - El del **cliente** aparece en su vista y tiene un link para mandárselo.
  - El de **editores** tiene su propio link para compartirlo con el equipo (solo funciona mientras esté publicado).

## Si algo falla

- **Vercel → tu proyecto → Deployments**: si sale en rojo, abre el detalle y copia el error para pasármelo.
- **"No se pudo generar: Falta la variable…"**: revisa en **Settings → Environment Variables** que estén las 5 variables y vuelve a publicar (**Deployments → ⋯ → Redeploy**).
