# Clínica de la PC — Sistema de taller (Sistema VB) · versión de prueba en el negocio

**Abrir:** doble clic en `index.html` (un solo archivo, funciona sin internet). Es la **versión de uso real**: arranca vacía.
`demo.html` es la demo con datos de ejemplo; tiene su propia base de datos y no se mezcla con la real.

## Primer uso
1. Al abrir por primera vez aparece la **configuración inicial**: datos del negocio y el administrador (nombre + PIN de 4 a 8 números).
2. En **Configuración** revisá los precios de los servicios (vienen de referencia, no son los del negocio), los términos y condiciones (texto base: debe revisarlo un profesional) y creá al resto del equipo (mostrador, técnicos), cada uno con su PIN.
3. Cargá inventario y proveedores, abrí la caja y empezá a ingresar equipos.
4. **Descargá una copia de seguridad** (Configuración → Datos) seguido: el sistema avisa si pasaron 7 días.

## Cosas que hay que saber antes de probarla (límites reales)
- **Los datos viven en el navegador de esta computadora.** Todo el equipo tiene que usar el mismo navegador de la misma PC. Si se borran los datos del navegador, se pierden: por eso la copia de seguridad. No hay nube ni sincronización entre equipos.
- **El PIN es una barrera de uso en el mostrador, no seguridad de nube.** Quien tenga acceso a la PC y sepa usar el navegador puede ver los datos. Si se olvida el PIN del administrador, solo se recupera restaurando una copia.
- **La consulta pública de estado** (la que usa el número de orden y los 4 dígitos del WhatsApp) solo funciona en esta PC. Desde el celular del cliente no puede consultar.
- **Sin integraciones:** no hay facturación ARCA, pasarelas de pago ni WhatsApp automático (se abre WhatsApp con el mensaje armado y lo envía una persona).
- No se probó con impresoras, cámaras ni firma en pantalla táctil reales.
- Probada con navegador Chromium simulado; conviene anotar cualquier diferencia en Chrome/Edge del negocio.

## Para el período de prueba
Anotá todo lo que no cierre con la forma de trabajar del negocio (pantallas, textos, campos que faltan, cuentas que no dan, pasos de más). Con eso se corrige. Si el flujo funciona, el paso siguiente es pasar a la versión con nube (varios equipos y celulares, acceso con usuario real).

## Qué cubre (según el pedido del taller)
- **Recepción e ingreso:** cliente + equipo (marca, modelo, serie), checklist de accesorios, estado, fotos del estado inicial, falla, términos y firma, comprobante imprimible.
- **Diagnóstico y presupuesto:** orden de trabajo interna, repuestos cotizados desde el inventario, mano de obra por tipo de servicio, bonificación con motivo, aprobación del cliente (con vigencia).
- **Inventario:** stock por movimientos, reserva al aprobar, alertas de stock bajo, herramientas con préstamos, pedidos técnicos, proveedores con CUIT validado, órdenes de compra, recepción de mercadería y cuenta corriente del proveedor.
- **Gestión del taller:** tablero pendiente / en proceso / en prueba / listo (arrastrar o «Mover»), tareas por técnico, cronómetro vs. tiempo estimado, pruebas de calidad obligatorias antes de entregar.
- **Notificaciones internas** automáticas, configurables por rol y por responsable (cambio de estado, atrasos, stock, requerimientos, caja).
- **Administración y caja:** cobros por varios medios en una operación, vuelto, cuenta corriente con límite, caja con arqueo y cierre sellado, historial financiero por reparación y rentabilidad por servicio y por técnico.

## Pruebas reales (Chromium, 2026-10-28)
`real.js` 99 (versión real: configuración inicial y sus errores, PIN y bloqueo, equipo con PIN, 13 pantallas vacías en 1280 y 360 px sin desborde, sin textos «demo/ejemplo», ingreso por pantalla, presupuesto, ciclo hasta la entrega con cobro, cierre de caja, aviso y descarga de copia, auditoría). Las demás suites corren sobre `demo.html`:
`fuente/t/`: smoke 3 · walk 144 (13 pantallas × 4 roles + 28 órdenes + 12 clientes) · resp 99 (360/768/1280 px, sin desborde, objetivos ≥44 px) · flows 57 · ui 23 · ui2 53 (por pantalla: presupuesto, técnico, inventario, compras, caja y cierre, mostrador, clientes, configuración, auditoría, impresiones, reportes). Sin errores de consola ni violaciones de CSP.
Correr: `python3 build.py` (genera `index.html` y `demo.html`) y luego `node fuente/t/<prueba>.js` (`VBFILE=index.html node fuente/t/real.js` para la real) (requiere Playwright).

## Límites declarados (no afirmar más que esto)
1. **Los datos reales viven en el navegador (IndexedDB); no hay nube, ni multi-equipo, ni sincronización.
2. **PIN local, sin contraseñas de nube:** en la versión con nube el ingreso sería con Supabase.
3. **Sin integraciones:** no hay facturación ARCA, pasarelas de pago ni WhatsApp automático. Los avisos al cliente abren WhatsApp con el mensaje armado y los envía una persona. El pago digital se verifica a mano.
4. **Términos y condiciones de base:** deben ser revisados por un profesional antes de usarse (`[VERIFICAR]`).
5. **Hardware sin probar:** impresoras/etiquetadoras, cámara real del celular y firma táctil en un dispositivo táctil físico no se probaron; las fotos se probaron cargando archivos.
6. El asistente interno es de reglas simples (solo lectura), no una IA.
7. No hay banco de pruebas de la nube porque no hay nube en esta entrega.

Desarrollado por VINCULAR BUSINESS · (387) 4484132 · vincularbusiness@gmail.com · «Tu idea, en buenas manos.»

## Correcciones de la revisión del 2026-10-28
- El selector de repuestos del presupuesto ya no ofrece artículos sin precio de venta.
- El reporte de rentabilidad por servicio descontaba dos veces la bonificación; ahora suma exactamente lo mismo que el total por orden.
- «Imprimir» en el detalle de un cierre de caja fallaba; corregido.
