#!/usr/bin/env python3
"""Ensambla desde fuente/ dos archivos HTML de una sola pieza (sin dependencias externas):
  index.html = versión de USO REAL (arranca vacía, base de datos propia)
  demo.html  = demo con datos de ejemplo (base de datos distinta)
CSP: el script inline se autoriza por su hash SHA-256 (sin 'unsafe-inline' en scripts)."""
import base64, hashlib, re, sys, time
from pathlib import Path
here = Path(__file__).resolve().parent
src = here / 'fuente'
parts = ['p2-core.js','p3-domain.js','p4-ui.js','p5-public.js','p6-resumen.js','p7-ingreso.js','p8a-ordenes.js','p8b-detalle.js','p9-caja.js','p10-inventario.js','p11-compras.js','p12-clientes.js','p13-equipo.js','p14-reportes.js','p15-config.js','p16-asistente.js','p98-real.js','p99-seed.js','p99-boot.js']
build = time.strftime('%Y-%m-%d %H:%M', time.gmtime()) + ' UTC'
js0 = '\n'.join((src/p).read_text(encoding='utf-8') for p in parts).replace('__BUILD__', build)
head0 = (src/'p1-head.html').read_text(encoding='utf-8')
for variant, fname, title in (('real', 'index.html', 'Clínica de la PC · Sistema VB'), ('demo', 'demo.html', 'Clínica de la PC · Sistema VB (demo)')):
    js = js0.replace('__VARIANT__', variant)
    head = head0.replace('__TITLE__', title)
    if re.search(r'</script', js, re.I):
        sys.exit('ERROR: hay "</script" dentro del JS')
    if not head.rstrip().endswith('<script>'):
        sys.exit('ERROR: p1-head.html debe terminar en <script>')
    h = base64.b64encode(hashlib.sha256(('\n'+js+'\n').encode('utf-8')).digest()).decode()
    head = head.replace('__SCRIPT_HASH__', "'sha256-%s'" % h)
    html = head.rstrip() + '\n' + js + '\n</script>\n</body>\n</html>\n'
    (here / fname).write_text(html, encoding='utf-8')
    print('OK', fname, len(html)//1024, 'KB', variant, 'hash', h[:16], 'build', build)
