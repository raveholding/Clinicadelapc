/* =====================================================================
   FRENTE PÚBLICO (consulta de estado, sólo lectura, sin datos personales)
   y ACCESO DEL EQUIPO (#acceso). Créditos oficiales de VINCULAR BUSINESS.
   ===================================================================== */
function vbBanner(){
  return '<div class="vbbar" role="group" aria-label="Desarrollado por VINCULAR BUSINESS"><div class="t"><b>VINCULAR BUSINESS</b><small>Desarrollo de sistemas · <i>'+VB.lema+'</i></small></div>'
   +'<a class="vbbtn" href="'+VB.wa+'?text='+encodeURIComponent('Hola, vi el sistema de '+S.cfg.shop.name+' y quiero consultar.')+'" target="_blank" rel="noopener">'+ic('chat',18)+'WhatsApp '+VB.cel+'</a>'
   +'<a class="vbbtn alt" href="'+VB.tel+'">'+ic('phone',18)+'Llamar</a>'
   +'<a class="vbbtn alt" href="mailto:'+VB.mail+'">'+ic('mail',18)+'Correo</a></div>';
}
function publicHtml(){
  const s=S.cfg.shop;
  return '<div class="pub"><div class="wrap"><div class="hero"><div class="row" style="gap:12px">'+LOGO.replace('width="38" height="38"','width="52" height="52"')+'<div><h1>'+esc(s.name)+'</h1><p class="mut" style="margin:0">Seguí el estado de tu reparación</p></div></div></div>'
   +'<form class="card" id="pubf" autocomplete="off" novalidate><h2 style="margin-bottom:10px">Consultá tu orden</h2><p class="mut sm">Ingresá el número de tu orden (está en el comprobante) y los últimos 4 números del WhatsApp que dejaste en el taller.</p>'
   +'<div class="grid g2"><div class="field"><label for="pn">Número de orden</label><input type="text" id="pn" inputmode="numeric" placeholder="Ej.: 12 o OT-0012" maxlength="12" required></div><div class="field"><label for="pl">Últimos 4 dígitos de tu WhatsApp</label><input type="text" id="pl" inputmode="numeric" maxlength="4" placeholder="Ej.: 0101" required></div></div>'
   +'<div class="row" style="margin-top:12px"><button class="btn p lg" type="submit">'+ic('search',18)+'Consultar</button></div><div id="pres" aria-live="polite" style="margin-top:14px"></div></form>'
   +'<div class="card flat" style="margin-top:16px"><h3>'+esc(s.name)+'</h3><p class="mut sm" style="margin:0">'+esc(s.addr)+'<br>'+esc(s.hours)+'</p><div class="row" style="margin-top:10px"><a class="btn" href="'+waLink(s.wa,'Hola, consulto por mi equipo en '+s.name)+'" target="_blank" rel="noopener">'+ic('chat',18)+'Escribir al taller por WhatsApp</a><a class="btn" href="tel:'+esc(waDigits(s.phone))+'">'+ic('phone',18)+'Llamar</a></div></div>'
   +'<p class="mut xs" style="margin-top:14px">Esta página sólo muestra el estado de tu equipo: no muestra tus datos personales. Para aprobar un presupuesto o consultar detalles, respondé por WhatsApp o pasá por el taller.</p>'
   +'<div style="margin-top:16px">'+vbBanner()+'</div>'
   +(APP.variant==='demo'?'<div class="card flat" style="margin-top:16px;border-style:dashed"><b>Demo · '+esc(s.name)+'</b><p class="sm mut" style="margin:6px 0 10px">Todos los datos son de ejemplo. '+(S.demo?'Probá con la orden <b class="mono">OT-'+String(S.demo.n).padStart(4,'0')+'</b> y los últimos 4 dígitos <b class="mono">'+esc(S.demo.last4)+'</b> (o mirá otras desde el panel).':'Entrá al panel para ver las órdenes de ejemplo.')+'</p><a class="btn p" href="#acceso">'+ic('lock',18)+'Acceso del equipo (demo)</a></div>':'')
   +'</div></div>';
}
function publicBind(){
  const f=$('#pubf');if(!f)return;
  f.addEventListener('submit',e=>{e.preventDefault();const box=$('#pres');const r=publicLookup($('#pn').value,$('#pl').value);
    if(r&&r.limited){box.innerHTML='<div class="alert warn" role="alert">Hiciste muchas consultas seguidas. Esperá unos minutos y probá de nuevo.</div>';return;}
    if(!r){box.innerHTML='<div class="alert bad" role="alert">No encontramos una orden con esos datos. Revisá el número y los últimos 4 dígitos del WhatsApp que dejaste.</div>';return;}
    const steps=ST_FLOW.filter(x=>x!=='entregado');const idx=steps.indexOf(r.status);
    let msg='';
    if(r.status==='listo')msg=r.outcome==='reparado'?'¡Tu equipo está listo! Podés pasar a retirarlo.'+(r.due?' Saldo a pagar: <b>'+esc(fmt(r.due))+'</b>.':''):'Tu equipo está listo para retirar (sin reparar).'+(r.due?' Saldo a pagar: <b>'+esc(fmt(r.due))+'</b>.':'');
    else if(r.status==='aprobacion')msg='Tenemos el presupuesto'+(r.total!=null?' (<b>'+esc(fmt(r.total))+'</b>)':'')+'. Respondenos por WhatsApp para aprobarlo'+(r.validUntil?' (vigente hasta el '+esc(fdate(r.validUntil))+')':'')+'.';
    else if(r.status==='entregado')msg='Este equipo ya fue entregado el '+esc(fdate(r.delivered))+'.';
    else if(r.status==='cancelado')msg='La orden fue cancelada. Consultanos por WhatsApp.';
    else msg='Estamos trabajando en tu equipo. Última novedad: '+esc(ago(r.updated))+'.';
    box.innerHTML='<div class="card flat" style="background:#f7fbfa"><div class="row spread"><div><b>'+esc(r.code)+'</b> · '+esc(r.device)+'</div>'+stBadge(r.status)+'</div>'
      +(idx>=0?'<div class="stepper" style="margin:12px 0" role="list" aria-label="Avance">'+steps.map((x,i)=>'<span class="s '+(i<idx?'done':i===idx?'cur':'')+'" role="listitem">'+(i<idx?'✓ ':'')+esc(ST[x].name)+'</span>').join('')+'</div>':'')
      +'<p style="margin:8px 0 0">'+msg+'</p><p class="mut sm" style="margin:8px 0 0">Ingresó el '+esc(fdate(r.created))+(r.promised?' · Fecha estimada: '+esc(fdate(r.promised)):'')+'</p></div>';});
}
function loginHtml(){
  const us=S.users.filter(u=>u.active!==false);
  return '<div class="pub"><div class="wrap"><div class="hero"><div class="row" style="gap:12px">'+LOGO.replace('width="38" height="38"','width="52" height="52"')+'<div><h1>Acceso del equipo</h1><p class="mut" style="margin:0">'+esc(S.cfg.shop.name)+'</p></div></div></div>'
   +'<div class="alert info" style="margin-bottom:14px"><span>'+ic('alert',18)+'</span><span><b>Demo.</b> Elegí un usuario para probar el sistema con su rol. No hay contraseñas reales en la demo; en la versión del cliente el ingreso es con correo y contraseña de la nube.</span></div>'
   +'<div class="users" role="list">'+us.map(u=>'<button type="button" class="ubtn" role="listitem" data-act="login" data-uid="'+u.id+'"><span class="ava" aria-hidden="true">'+esc(initials(u.name))+'</span><span><b>'+esc(u.name)+'</b><br><span class="mut sm">'+esc(ROLES[u.role].label)+'</span></span></button>').join('')+'</div>'
   +'<p style="margin-top:16px"><a href="#estado">← Volver a la consulta de estado</a></p><div style="margin-top:16px">'+vbBanner()+'</div></div></div>';
}
function loginBind(){}
ACTS.login=el=>{const u=userById(el.dataset.uid);if(!u)return;SESSION.uid=u.id;localStorage.setItem('vbc_uid',u.id);audit('SESION_INICIO','Demo: ingreso de '+u.name);scanSla();location.hash='#panel/resumen';};
