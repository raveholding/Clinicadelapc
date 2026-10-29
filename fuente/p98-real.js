/* =====================================================================
   VERSIÓN DE USO REAL: primer ingreso (datos del negocio + administrador),
   PIN por usuario, aviso de copia de seguridad y borrado total.
   Los datos viven en ESTE navegador (IndexedDB): el PIN es una barrera de
   uso en el mostrador, NO es seguridad de nube.
   ===================================================================== */
const PIN_RE=/^\d{4,8}$/;
function pinHash(uid,pin){return sha256('pin|'+uid+'|'+pin);}
const _pinFails={};
function pinCheck(u,pin){
  const f=_pinFails[u.id]||(_pinFails[u.id]={n:0,until:0});
  if(Date.now()<f.until)fail('Demasiados intentos. Esperá '+Math.ceil((f.until-Date.now())/1000)+' segundos.');
  if(!u.pinHash)return true;
  if(pinHash(u.id,String(pin||''))===u.pinHash){f.n=0;return true;}
  f.n++;if(f.n>=5){f.n=0;f.until=Date.now()+30000;fail('PIN incorrecto. Esperá 30 segundos para volver a intentar.');}
  fail('PIN incorrecto.');
}
function pinValidate(pin,req){
  pin=String(pin==null?'':pin).trim();
  if(!pin){if(req)fail('Elegí un PIN de 4 a 8 números.');return null;}
  if(!PIN_RE.test(pin))fail('El PIN tiene que tener entre 4 y 8 números.');
  if(/^(\d)\1+$/.test(pin)||pin==='1234'||pin==='12345'||pin==='123456')fail('Ese PIN es demasiado fácil de adivinar. Elegí otro.');
  return pin;
}
function firstSetup(d){
  if(IS_DEMO||S.users.length)fail('El sistema ya fue configurado.');
  const name=txt(d.name,2,60,'El nombre del negocio');
  const wa=String(d.wa||'').trim();if(waDigits(wa).length<8)fail('Escribí el WhatsApp del negocio (con característica).');
  const mail=String(d.mail||'').trim();if(mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))fail('El correo no es válido.');
  const cuit=String(d.cuit||'').trim();if(cuit&&!cuitOk(cuit))fail('El CUIT no es válido (11 números, con su dígito verificador).');
  const admin=txt(d.adminName,3,60,'Tu nombre');
  const pin=pinValidate(d.pin,true);if(String(d.pin2||'').trim()!==pin)fail('Los dos PIN no coinciden.');
  Object.assign(S.cfg.shop,{name,legal:String(d.legal||'').trim().slice(0,80),cuit:cuit.slice(0,20),addr:String(d.addr||'').trim().slice(0,100),wa:wa.slice(0,25),phone:String(d.phone||'').trim().slice(0,25),mail,hours:String(d.hours||'').trim().slice(0,120),fiscal:''});
  const u={id:'u-admin',name:admin,role:'admin',active:true,pinHash:pinHash('u-admin',pin)};
  S.users.push(u);SESSION.uid=u.id;try{localStorage.setItem(UIDKEY,u.id);}catch(e){}
  seedCatalog();
  audit('CONFIGURACION_INICIAL',name);emitChange();
}
function setupHtml(){
  const s=S.cfg.shop;
  return '<div class="pub"><div class="wrap"><div class="hero"><div class="row" style="gap:12px">'+LOGO.replace('width="38" height="38"','width="52" height="52"')+'<div><h1>Bienvenido</h1><p class="mut" style="margin:0">Configuración inicial del sistema</p></div></div></div>'
   +'<form class="card" id="setf" autocomplete="off" novalidate><h2 style="margin-bottom:6px">1. Datos del negocio</h2><p class="mut sm">Salen en los comprobantes. Después los podés cambiar en Configuración.</p>'
   +'<div class="grid g2">'+fld('Nombre del negocio *','<input type="text" id="st-n" maxlength="60" value="'+esc(s.name)+'">')+fld('WhatsApp del negocio *','<input type="text" inputmode="tel" id="st-w" maxlength="25" placeholder="Con característica, ej.: 387 4xx-xxxx">')
   +fld('Razón social','<input type="text" id="st-l" maxlength="80">')+fld('CUIT','<input type="text" inputmode="numeric" id="st-c" maxlength="13" placeholder="Opcional">')
   +fld('Dirección','<input type="text" id="st-a" maxlength="100">')+fld('Teléfono','<input type="text" inputmode="tel" id="st-p" maxlength="25">')
   +fld('Correo','<input type="email" id="st-m" maxlength="80">')+fld('Horario de atención','<input type="text" id="st-h" maxlength="120" placeholder="Ej.: Lun a Vie 9 a 13 y 16:30 a 20:30">')+'</div>'
   +'<h2 style="margin:18px 0 6px">2. Administrador</h2><p class="mut sm">Es quien configura el sistema y ve todo. Después podés crear al resto del equipo (mostrador y técnicos), cada uno con su PIN.</p>'
   +'<div class="grid g3">'+fld('Tu nombre *','<input type="text" id="st-u" maxlength="60">')+fld('PIN (4 a 8 números) *','<input type="password" inputmode="numeric" id="st-pin" maxlength="8" autocomplete="new-password">')+fld('Repetí el PIN *','<input type="password" inputmode="numeric" id="st-pin2" maxlength="8" autocomplete="new-password">')+'</div>'
   +'<div class="alert info" style="margin-top:12px"><span>'+ic('alert',18)+'</span><span><b>Importante.</b> Los datos se guardan en este navegador de esta computadora. Descargá una copia de seguridad seguido (Configuración → Datos). El PIN evita usos por error en el mostrador; no es seguridad de nube.</span></div>'
   +'<div id="st-err" role="alert" class="alert bad hide" style="margin-top:12px"></div>'
   +'<div class="row" style="margin-top:14px"><button class="btn p lg" type="submit">'+ic('check',18)+'Empezar a usar el sistema</button></div></form>'
   +'<div style="margin-top:16px">'+vbBanner()+'</div></div></div>';
}
function setupBind(){
  const f=$('#setf');if(!f)return;
  f.addEventListener('submit',e=>{e.preventDefault();const g=i=>$(i).value;const box=$('#st-err');
    try{firstSetup({name:g('#st-n'),wa:g('#st-w'),legal:g('#st-l'),cuit:g('#st-c'),addr:g('#st-a'),phone:g('#st-p'),mail:g('#st-m'),hours:g('#st-h'),adminName:g('#st-u'),pin:g('#st-pin'),pin2:g('#st-pin2')});
      saveNow().then(()=>{location.hash='#panel/resumen';applyRoute();toast('Listo. Ya podés cargar tu primer cliente y tu inventario.','ok');});
    }catch(x){if(x instanceof VBErr){box.textContent=x.message;box.classList.remove('hide');box.focus&&box.focus();}else throw x;}});
}
/* ---- ingreso con PIN ---- */
function loginWithPin(uid){
  const u=userById(uid);if(!u)return;
  const enter=()=>{SESSION.uid=u.id;try{localStorage.setItem(UIDKEY,u.id);}catch(e){}audit('SESION_INICIO','Ingreso de '+u.name);scanSla();location.hash='#panel/resumen';};
  if(!u.pinHash){enter();return;}
  let hh=null;
  hh=modal({title:'Ingresá tu PIN · '+u.name,small:true,html:fld('PIN','<input type="password" inputmode="numeric" id="lg-pin" maxlength="8" autocomplete="off">')+'<p class="mut sm" style="margin:6px 0 0">¿Te olvidaste el PIN? Pedile al administrador que lo cambie en Configuración → Usuarios.</p>',
    buttons:[{label:'Cancelar'},{label:'Ingresar',cls:'p',onClick:h=>{pinCheck(u,h.$('#lg-pin').value);enter();}}],
    onOpen:h=>{const i=h.$('#lg-pin');if(i){i.focus();i.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();h.submit?h.submit():h.$('footer .btn.p').click();}});}}});
}
/* ---- copia de seguridad: recordatorio ---- */
function backupAlert(){
  if(IS_DEMO||!can('config'))return '';
  if(!(S.orders.length||S.sales.length||S.clients.length))return '';
  const last=S.cfg.lastBackup||0;if(last&&now()-last<7*DAY)return '';
  return '<div class="alert warn" role="alert" style="margin-bottom:14px"><span>'+ic('alert',18)+'</span><span><b>Hacé una copia de seguridad.</b> '+(last?'La última fue el '+esc(fdate(last))+'.':'Todavía no descargaste ninguna.')+' Los datos están sólo en este navegador. <button type="button" class="btn xs" data-act="bkExport">Descargar copia ahora</button></span></div>';
}
ACTS.bkWipe=()=>confirmBox({title:'Borrar todos los datos',html:'Se borran <b>todos</b> los datos de este navegador (órdenes, clientes, inventario, caja, usuarios). Descargá una copia antes. No se puede deshacer.',confirmWord:'BORRAR',danger:true,ok:'Borrar todo',onOk:()=>{need('config');S=emptyState();SESSION.uid=null;try{localStorage.removeItem(UIDKEY);}catch(e){}saveNow().then(()=>{location.hash='#inicio';applyRoute();});}});
