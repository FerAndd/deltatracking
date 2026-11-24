# Brief: App de tracking de contenidos — Delta (prototipo)

## Objetivo
1. Organización interna: que Fer y su equipo sepan qué se está haciendo, quién lo hace, qué urge y dónde se atora el trabajo.
2. Tranquilidad para el cliente: que Delta vea el avance de sus piezas sin tener que preguntar.

Es un prototipo: primero solo Delta. Después se usará con más clientes, así que la base de datos debe incluir un campo de cliente desde el inicio, aunque la interfaz todavía no lo muestre.

## Usuarios y permisos
- Fer (admin): única persona que crea y edita. Necesita login. Ve todo.
- Cliente Delta (solo lectura): entra con un link privado con token, sin cuenta. Ve únicamente la vista de cliente.
- Editores: no entran a la app. Reciben la información a través de la síntesis semanal.

## Editores (lista editable desde ajustes)
Mónica, Missa, Jeremy, Enrique

## Campos de cada pieza
- Nombre o tema
- Tipo: reel, carrusel, post o story
- Editor asignado (lista desplegable)
- Estado: Por editar → En edición → Enviado a aprobación → Cambios solicitados → Aprobado
- Ronda de cambios: sube automáticamente cada vez que la pieza pasa a "Cambios solicitados"
- Fecha límite de entrega
- Fecha de publicación en redes
- Link al archivo o video (Drive, Frame.io, etc.)
- Casilla "Entregado", que guarda la fecha en que se marcó
- Brief de la pieza (solo Fer): guion, referencias (links), copy, música e indicaciones
- Checklist antes de enviar (solo Fer): subtítulos, logo, formato 9:16, música con licencia. Los puntos se pueden editar.
- Nota para el cliente (visible para el cliente): texto corto, por ejemplo "Estamos ajustando la música que pediste".
- Cliente (oculto por ahora; valor fijo "Delta")

## Retroalimentación del cliente (SOLO FER)
- Fer captura los comentarios del cliente dentro de cada pieza.
- Cada comentario guarda la fecha, la ronda y una etiqueta opcional (copy, color, ritmo, música, tipografía, branding, otro).
- Historial completo: los comentarios anteriores no se borran.
- Estos comentarios nunca aparecen en la vista del cliente ni en su resumen.

## Funciones para Fer (organización interna)
1. Vista "Esta semana" como pantalla de inicio: lo que vence hoy y en los próximos días.
2. Carga por editor: cuántas piezas activas tiene cada editor, para repartir el trabajo.
3. Alertas de atraso: la pieza se marca en rojo si está cerca de la fecha límite (por ejemplo, a 2 días o menos) y todavía no llega a "Enviado a aprobación", o si ya pasó la fecha.
4. Tablero Kanban por estado, con filtros por editor, tipo y semana.
5. Duplicar pieza: copiar una pieza existente (tipo, editor, brief y checklist) para el contenido que se repite.
6. Métricas: promedio de rondas por editor, tiempo promedio de entrega y piezas entregadas a tiempo contra atrasadas.

## Vista del cliente (solo lectura)
- Barra de avance general: "X de Y piezas entregadas este mes".
- Calendario: vista mensual y semanal con las fechas de entrega y de publicación de cada pieza, con color según su estado. Al tocar una pieza se ve su detalle de cliente.
- Lista o tablero de piezas con estado, ronda, fecha límite, fecha de publicación y si ya se entregó.
- Nota para el cliente de cada pieza.
- Vista previa: cuando la pieza está en "Enviado a aprobación", se muestra el link o el video para revisarlo ahí mismo.
- Resúmenes semanales: una sección donde el cliente consulta los resúmenes de las semanas anteriores.
- NO muestra: comentarios internos, brief, checklist, alertas, métricas ni nombres de editores.
- Con el logo y los colores de Delta.

## Resúmenes semanales (programados, cada viernes)

### A) Síntesis para editores (interna)
- Documento compartible con los comentarios del cliente de esa semana.
- Contenido:
  1. Resumen general.
  2. Patrones que se repiten.
  3. Qué le gustó al cliente y qué rechazó.
  4. Una sección por editor (Mónica, Missa, Jeremy, Enrique) con su feedback y acciones concretas.
  5. Las piezas con más rondas de cambios.
- Fer comparte el doc con los editores.

### B) Resumen para el cliente
- Documento compartible, que además queda publicado en la sección de resúmenes de la vista del cliente.
- Contenido:
  1. Lo que se hizo esta semana: piezas entregadas o aprobadas y piezas que avanzaron de estado.
  2. Pendiente para la próxima semana: piezas en proceso, piezas que esperan su aprobación y fechas de entrega y publicación.
  3. Avance del mes (X de Y piezas).
- Tono profesional y tranquilizador. Sin comentarios internos ni nombres de editores.
- Fer lo revisa antes de que se publique o se envíe (estado de borrador → publicado).

## Diseño
- Responsive: debe funcionar bien en celular, iPad y computadora.

## Fase 2 (después del prototipo)
- Botones "Aprobar" o "Pedir cambios" para el cliente. La vista del cliente dejaría de ser solo lectura.
- Aviso por correo al cliente cuando una pieza está lista para revisar o cuando sale su resumen semanal.
- Multi-cliente (FF Systems, Pango, etc.).

## Decisiones técnicas para resolver en Code
- Hosting en línea para que el cliente pueda abrir el link (por ejemplo, Vercel + Supabase).
- Login de admin y link de solo lectura con token para el cliente.
- Cómo se generan los dos resúmenes de los viernes: una tarea programada de Claude que lee la base de datos y crea los docs, o la propia app llamando a la API de Claude.
