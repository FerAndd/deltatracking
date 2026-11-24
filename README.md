# Delta · Seguimiento de contenido

App para dar seguimiento a las piezas de contenido de Delta. El detalle de lo que hace está en [`Brief.md`](./Brief.md).

## Cómo está hecha
- **Next.js**: las pantallas y la lógica.
- **Supabase (Postgres)**: la base de datos.
- **Vercel**: el hosting (la dirección de internet).

## Partes
1. ✅ Base de datos y vista de admin (Esta semana, Tablero, Piezas, Métricas, Ajustes)
2. ✅ Vista del cliente (link privado de solo lectura: avance, calendario, piezas, resúmenes)
3. ⏳ Resúmenes de los viernes

## Variables de entorno
Ver `.env.example`: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.

## Para desarrollar en una computadora
```bash
npm install
cp .env.example .env.local   # y llena los valores
npm run db:migrate           # crea las tablas, el cliente Delta y los editores
npm run db:demo              # (opcional) piezas de ejemplo, solo en base local
npm run dev
```
Las migraciones también corren solas en cada despliegue (`npm run build`).

## Reglas de alertas (hora de Monterrey)
- Fecha límite el mismo día en que se creó la pieza → se pone en rojo a las 5:00 pm.
- Fecha límite en otro día → se pone en rojo a las 8:00 am del día anterior.
- Pasó la fecha límite → "Atrasada".
- Solo aplica si la pieza no se ha enviado a aprobación ni entregado.
