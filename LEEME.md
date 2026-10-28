# Clínica de la PC — demo del sistema de taller (Sistema VB)

**Abrir:** doble clic en `index.html` (un solo archivo, funciona sin internet).
Entrá por «Acceso del equipo (demo)» y elegí un rol: Administrador, Supervisor, Recepción o Técnico.
Consulta pública del cliente: la pantalla inicial (la demo indica una orden y los 4 dígitos para probar).

## Qué cubre (según el pedido del taller)
- **Recepción e ingreso:** cliente + equipo (marca, modelo, serie), checklist de accesorios, estado, fotos del estado inicial, falla, términos y firma, comprobante imprimible.
- **Diagnóstico y presupuesto:** orden de trabajo interna, repuestos cotizados desde el inventario, mano de obra por tipo de servicio, bonificación con motivo, aprobación del cliente (con vigencia).
- **Inventario:** stock por movimientos, reserva al aprobar, alertas de stock bajo, herramientas con préstamos, pedidos técnicos, proveedores con CUIT validado, órdenes de compra, recepción de mercadería y cuenta corriente del proveedor.
- **Gestión del taller:** tablero pendiente / en proceso / en prueba / listo (arrastrar o «Mover»), tareas por técnico, cronómetro vs. tiempo estimado, pruebas de calidad obligatorias antes de entregar.
- **Notificaciones internas** automáticas, configurables por rol y por responsable (cambio de estado, atrasos, stock, requerimientos, caja).
- **Administración y caja:** cobros por varios medios en una operación, vuelto, cuenta corriente con límite, caja con arqueo y cierre sellado, historial financiero por reparación y rentabilidad por servicio y por técnico.

## Pruebas reales (Chromium, 2026-10-28)
`fuente/t/`: smoke 3 · walk 144 (13 pantallas × 4 roles + 28 órdenes + 12 clientes) · resp 99 (360/768/1280 px, sin desborde, objetivos ≥44 px) · flows 57 · ui 23 · ui2 53 (por pantalla: presupuesto, técnico, inventario, compras, caja y cierre, mostrador, clientes, configuración, auditoría, impresiones, reportes). Sin errores de consola ni violaciones de CSP.
Correr: `python3 build.py` y luego `node fuente/t/<prueba>.js` (requiere Playwright).

## Límites declarados (no afirmar más que esto)
1. **Es una demo con datos de ejemplo.** Los datos viven en el navegador (IndexedDB); no hay nube, ni multi-equipo, ni sincronización.
2. **Sin contraseñas reales:** el cambio de usuario es para probar roles. En la versión del cliente el ingreso sería con Supabase.
3. **Sin integraciones:** no hay facturación ARCA, pasarelas de pago ni WhatsApp automático. Los avisos al cliente abren WhatsApp con el mensaje armado y los envía una persona. El pago digital se verifica a mano.
4. **Términos y condiciones de ejemplo:** deben ser revisados por un profesional antes de usarse (`[VERIFICAR]`).
5. **Hardware sin probar:** impresoras/etiquetadoras, cámara real del celular y firma táctil en un dispositivo táctil físico no se probaron; las fotos se probaron cargando archivos.
6. El asistente interno es de reglas simples (solo lectura), no una IA.
7. No hay banco de pruebas de la nube porque no hay nube en esta entrega.

Desarrollado por VINCULAR BUSINESS · (387) 4484132 · vincularbusiness@gmail.com · «Tu idea, en buenas manos.»

## Correcciones de la revisión del 2026-10-28
- El selector de repuestos del presupuesto ya no ofrece artículos sin precio de venta.
- El reporte de rentabilidad por servicio descontaba dos veces la bonificación; ahora suma exactamente lo mismo que el total por orden.
- «Imprimir» en el detalle de un cierre de caja fallaba; corregido.
