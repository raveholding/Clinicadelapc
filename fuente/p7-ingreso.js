/* =====================================================================
   RECEPCIÓN E INGRESO: cliente, equipo (marca/modelo/serie), accesorios,
   estado físico, fotos, falla, conformidad y firma.
   ===================================================================== */
UI.in={clientId:null,newClient:false,type:'Notebook',photos:[],quick:null};
const FAULTS=['No enciende','No da imagen','Muy lento','Se apaga solo','Pantalla rota','No carga la batería','Ruidos extraños','Sobrecalienta','Virus o publicidad','Se reinicia','No reconoce el disco','Teclado no responde'];
function inReset(){UI.in={clientId:null,newClient:false,type:'Notebook',photos:[],quick:null};}
function devicesOf(cid){return S.devices.filter(d=>d.clientId===cid);}
SCREENS.ingreso={title:'Nueva recepción',perm:'intake',noAuto:true,view(){
  if(!UI.in)inReset();
  const types=Object.keys(S.cfg.types);
  const techOpts=techs().map(t=>[t.id,t.name]);
  return pageHead('Nueva recepción','Registrá el equipo que llega al taller. Todo lo que cargues queda en el comprobante del cliente.',exChip())
  +'<form id="inf" autocomplete="off" novalidate class="col gap-l" data-nosubmit>'
  +'<section class="card" aria-labelledby="in1"><h2 id="in1" style="margin-bottom:12px">1 · Cliente</h2>'+region('in-client',inClientHtml)+'</section>'
  +'<section class="card" aria-labelledby="in2"><h2 id="in2" style="margin-bottom:12px">2 · Equipo</h2>'
   +'<div id="in-quick">'+quickDevices()+'</div>'
   +'<div class="grid g3"><div class="field"><label for="d-type">Tipo de equipo *</label><select id="d-type" data-chg="inType">'+opts(types.map(t=>[t,t]),UI.in.type)+'</select></div>'
   +'<div class="field"><label for="d-brand">Marca *</label><input type="text" id="d-brand" maxlength="40" placeholder="Ej.: Lenovo" list="brands"><datalist id="brands">'+['Lenovo','HP','Dell','Asus','Acer','Samsung','Apple','Noblex','Banghó','Exo','Epson','Canon','Brother','LG'].map(b=>'<option value="'+b+'">').join('')+'</datalist></div>'
   +'<div class="field"><label for="d-model">Modelo *</label><input type="text" id="d-model" maxlength="60" placeholder="Ej.: IdeaPad 3 15"></div></div>'
   +'<div class="grid g2" style="margin-top:12px"><div class="field"><label for="d-serial">Número de serie</label><input type="text" id="d-serial" maxlength="60" data-inp="inSerial" placeholder="Está en la etiqueta del equipo"><span class="hint">Sirve para reconocer reingresos y garantías.</span></div><div class="field" id="in-warranty" aria-live="polite"></div></div></section>'
  +'<section class="card" aria-labelledby="in3"><h2 id="in3" style="margin-bottom:12px">3 · Accesorios y estado al recibirlo</h2><div class="lbl" style="margin-bottom:6px">Accesorios que deja el cliente</div>'+region('in-acc',inAccHtml)
   +'<div class="field" style="margin-top:10px"><label for="d-acc2">Otros accesorios</label><input type="text" id="d-acc2" maxlength="80" placeholder="Ej.: Mouse inalámbrico, pen drive"></div>'
   +'<div class="lbl" style="margin:16px 0 6px">Estado físico</div><div class="chips-sel" id="conds">'+S.cfg.conds.map(c=>'<label class="chk"><input type="checkbox" name="cond" value="'+esc(c)+'"><span>'+esc(c)+'</span></label>').join('')+'</div>'
   +'<div class="field" style="margin-top:10px"><label for="d-condn">Detalle del estado (opcional)</label><input type="text" id="d-condn" maxlength="400" placeholder="Ej.: rayón en la tapa, falta una goma"></div></section>'
  +'<section class="card" aria-labelledby="in4"><h2 id="in4" style="margin-bottom:12px">4 · Falla informada</h2><div class="field"><label for="d-fault">Descripción de la falla *</label><textarea id="d-fault" maxlength="800" placeholder="Qué le pasa al equipo, desde cuándo, qué estaba haciendo…"></textarea></div>'
   +'<div class="pill-grp" style="margin-top:8px">'+FAULTS.map(f=>'<button type="button" class="chip" data-act="inFault" data-f="'+esc(f)+'" style="min-height:44px;cursor:pointer">+ '+esc(f)+'</button>').join('')+'</div>'
   +'<div class="grid g2" style="margin-top:14px"><div class="field"><span class="lbl">¿El cliente informó una clave de acceso?</span><div class="chips-sel"><label class="chk"><input type="radio" name="pw" value="no" checked><span>No</span></label><label class="chk"><input type="radio" name="pw" value="si"><span>Sí</span></label></div><span class="hint">La clave <b>no se guarda</b> en el sistema: anotala en el sobre del equipo.</span></div>'
   +'<div class="field"><span class="lbl">¿Hizo copia de seguridad de sus datos?</span><div class="chips-sel"><label class="chk"><input type="radio" name="bk" value="si"><span>Sí</span></label><label class="chk"><input type="radio" name="bk" value="no"><span>No</span></label><label class="chk"><input type="radio" name="bk" value="nosabe" checked><span>No sabe</span></label></div></div></div></section>'
  +'<section class="card" aria-labelledby="in5"><h2 id="in5" style="margin-bottom:12px">5 · Fotos del estado inicial</h2><div class="row"><label class="btn" for="d-photos" style="cursor:pointer">'+ic('camera',18)+'Sacar o elegir fotos</label><input type="file" id="d-photos" accept="image/jpeg,image/png,image/webp" capture="environment" multiple class="sr-only" data-chg="inPhotos"><span class="mut sm">Hasta 8 fotos. Se reducen de tamaño automáticamente.</span></div><div id="in-photos" style="margin-top:12px">'+inPhotosHtml()+'</div></section>'
  +'<section class="card" aria-labelledby="in6"><h2 id="in6" style="margin-bottom:12px">6 · Datos de la orden</h2><div class="grid g3"><div class="field"><label for="d-prio">Prioridad</label><select id="d-prio">'+opts(Object.entries(PRIO),'normal')+'</select></div>'
   +'<div class="field"><label for="d-tech">Técnico (opcional)</label><select id="d-tech">'+opts(techOpts,'','Sin asignar')+'</select></div>'
   +'<div class="field"><label for="d-prom">Fecha estimada de entrega</label><input type="date" id="d-prom"></div></div></section>'
  +'<section class="card" aria-labelledby="in7"><h2 id="in7" style="margin-bottom:12px">7 · Conformidad del cliente</h2><details><summary style="cursor:pointer;min-height:44px;display:flex;align-items:center">Ver condiciones del servicio</summary><p class="sm mut">'+esc(S.cfg.terms)+'</p></details>'
   +'<label class="chk"><input type="checkbox" id="d-terms"><span>El cliente leyó y acepta las condiciones del servicio *</span></label>'
   +'<div class="field" style="margin-top:8px"><span class="lbl">Firma del cliente (opcional)</span><canvas id="sig" class="sig" width="840" height="260" aria-label="Espacio para firmar con el dedo o el mouse"></canvas><div class="row"><button type="button" class="btn xs" data-act="sigClear">Borrar firma</button></div></div></section>'
  +'<div class="row" style="position:sticky;bottom:0;background:linear-gradient(180deg,transparent,var(--bg) 30%);padding:14px 0"><button type="button" class="btn p lg" data-act="inSubmit">'+ic('check',20)+'Guardar y generar orden</button><button type="button" class="btn lg" data-act="inCancel">Limpiar formulario</button></div></form>';
},after(){const cv=$('#sig');if(cv)UI.sig=sigPad(cv);}};
function inClientHtml(){
  const I=UI.in;
  if(I.clientId){const c=getClient(I.clientId);return '<div class="row spread"><div class="row"><span class="ava" aria-hidden="true">'+esc(initials(c.name))+'</span><div><b>'+esc(c.name)+'</b><br><span class="sm mut">'+esc(c.wa)+' · '+S.orders.filter(o=>o.clientId===c.id).length+' órdenes anteriores</span></div></div><button type="button" class="btn" data-act="inCliClear">Cambiar cliente</button></div>'+(ccBalance(c.id)>0?'<div class="alert warn" style="margin-top:10px">'+ic('alert',18)+'Tiene deuda de cuenta corriente: '+esc(fmt(ccBalance(c.id)))+'.</div>':'');}
  if(I.newClient)return '<div class="grid g2"><div class="field"><label for="c-name">Nombre y apellido *</label><input type="text" id="c-name" maxlength="80"></div><div class="field"><label for="c-wa">WhatsApp *</label><input type="tel" id="c-wa" maxlength="30" placeholder="387 555-0123" inputmode="tel"></div><div class="field"><label for="c-dni">DNI (opcional)</label><input type="text" id="c-dni" maxlength="10" inputmode="numeric"></div><div class="field"><label for="c-mail">Correo (opcional)</label><input type="email" id="c-mail" maxlength="80"></div></div>'
    +'<label class="chk" style="margin-top:8px"><input type="checkbox" id="c-care"><span>Autoriza el tratamiento de sus datos para atender esta reparación *</span></label><label class="chk"><input type="checkbox" id="c-mkt"><span>Acepta recibir novedades y promociones (opcional, se puede retirar cuando quiera)</span></label><div class="row" style="margin-top:8px"><button type="button" class="btn" data-act="inCliBack">← Buscar un cliente existente</button></div>';
  return '<div class="field"><label for="c-q">Buscar cliente por nombre o WhatsApp</label><input type="search" id="c-q" data-inp="inCliQ" placeholder="Escribí al menos 2 letras o 3 números" autocomplete="off"></div><div id="c-res" class="col gap-s" style="margin-top:8px" aria-live="polite"></div><div class="row" style="margin-top:10px"><button type="button" class="btn" data-act="inCliNew">'+ic('plus',18)+'Cliente nuevo</button></div>';
}
function quickDevices(){if(!UI.in.clientId)return '';const ds=devicesOf(UI.in.clientId);if(!ds.length)return '';return '<div class="lbl" style="margin-bottom:6px">Equipos que ya trajo</div><div class="pill-grp" style="margin-bottom:12px">'+ds.map(d=>'<button type="button" class="chip" style="min-height:44px;cursor:pointer" data-act="inQuick" data-id="'+d.id+'">'+esc(devLabel(d))+'</button>').join('')+'</div>';}
function inAccHtml(){const acc=(S.cfg.types[UI.in.type]||S.cfg.types['Otro']).acc;return '<div class="chips-sel" id="accs">'+acc.map(a=>'<label class="chk"><input type="checkbox" name="acc" value="'+esc(a)+'"><span>'+esc(a)+'</span></label>').join('')+'</div>';}
function inPhotosHtml(){const p=UI.in.photos;return p.length?'<div class="photos">'+p.map((u,i)=>'<div style="position:relative"><img src="'+u+'" alt="Foto '+(i+1)+' del estado inicial"><button type="button" class="btn d xs" style="position:absolute;right:2px;top:2px;min-width:44px" data-act="inPhotoDel" data-i="'+i+'" aria-label="Quitar foto '+(i+1)+'">'+ic('x',16)+'</button></div>').join('')+'</div>':'<span class="mut sm">Todavía no hay fotos.</span>';}
ACTS.inCliNew=()=>{UI.in.newClient=true;UI.region('in-client');const f=$('#c-name');if(f)f.focus();};
ACTS.inCliBack=()=>{UI.in.newClient=false;UI.region('in-client');};
ACTS.inCliClear=()=>{UI.in.clientId=null;UI.region('in-client');$('#in-quick').innerHTML='';};
ACTS.inCliPick=el=>{UI.in.clientId=el.dataset.id;UI.in.newClient=false;UI.region('in-client');$('#in-quick').innerHTML=quickDevices();};
INP.inCliQ=el=>{const q=el.value.trim().toLowerCase();const box=$('#c-res');if(!box)return;const digits=q.replace(/\D/g,'');
  if(q.length<2&&digits.length<3){box.innerHTML='';return;}
  const r=S.clients.filter(c=>!c.anon&&(c.name.toLowerCase().includes(q)||(digits.length>=3&&waDigits(c.wa).includes(digits)))).slice(0,6);
  box.innerHTML=r.length?r.map(c=>'<button type="button" class="btn" style="justify-content:flex-start" data-act="inCliPick" data-id="'+c.id+'"><span class="ava" aria-hidden="true">'+esc(initials(c.name))+'</span><span style="text-align:left"><b>'+esc(c.name)+'</b><br><span class="sm mut">'+esc(c.wa)+'</span></span></button>').join(''):'<span class="mut sm">No se encontró. Probá con otro dato o cargá un cliente nuevo.</span>';};
ACTS.inQuick=el=>{const d=getDevice(el.dataset.id);if(!d)return;UI.in.type=S.cfg.types[d.type]?d.type:'Otro';$('#d-type').value=UI.in.type;$('#d-brand').value=d.brand;$('#d-model').value=d.model;$('#d-serial').value=d.serial||'';UI.region('in-acc');INP.inSerial($('#d-serial'));};
CHG.inType=el=>{UI.in.type=el.value;UI.region('in-acc');};
INP.inSerial=el=>{const w=$('#in-warranty');if(!w)return;const s=el.value.trim();if(s.length<4){w.innerHTML='';return;}
  const g=warrantyFor(s);const pr=priorOrders(s);let h='';
  if(g)h+='<div class="alert warn">'+ic('alert',18)+'<span><b>Garantía vigente</b> de '+esc(otCode(g))+' hasta el '+esc(fdate(g.warrantyUntil))+'.<label class="chk"><input type="checkbox" id="d-war" value="'+g.id+'"><span>Ingresar como <b>garantía</b> (sin cargo de mano de obra)</span></label></span></div>';
  else if(pr.length)h+='<div class="alert info">'+ic('clock',18)+'<span>Este equipo ya ingresó '+pr.length+' vez/veces. Última: '+esc(otCode(pr[pr.length-1]))+' ('+esc(ST[pr[pr.length-1].status].name)+').</span></div>';
  w.innerHTML=h;};
ACTS.inFault=el=>{const t=$('#d-fault');const f=el.dataset.f;if(!t.value.includes(f))t.value=(t.value?t.value.replace(/[.\s]*$/,'')+'. ':'')+f+'.';t.focus();};
CHG.inPhotos=async el=>{const files=[...el.files];el.value='';for(const f of files){if(UI.in.photos.length>=8){toast('Máximo 8 fotos por orden.','bad');break;}try{UI.in.photos.push(await resizeImage(f,900));}catch(e){toast(e.message||'No se pudo usar esa foto.','bad');}}
  const b=$('#in-photos');if(b)b.innerHTML=inPhotosHtml();};
ACTS.inPhotoDel=el=>{UI.in.photos.splice(+el.dataset.i,1);$('#in-photos').innerHTML=inPhotosHtml();};
ACTS.sigClear=()=>{if(UI.sig)UI.sig.clear();};
ACTS.inCancel=()=>{confirmBox({title:'¿Limpiar el formulario?',html:'Se borra todo lo cargado en esta recepción.',ok:'Limpiar',danger:true,onOk:()=>{inReset();renderView();}});};
ACTS.inSubmit=()=>{
  const I=UI.in;const v=id=>{const e=$('#'+id);return e?e.value:'';};
  const checks=n=>$$('input[name="'+n+'"]:checked').map(x=>x.value);
  const acc=checks('acc');const extra=v('d-acc2').trim();if(extra)acc.push(extra);
  const war=$('#d-war');const warOn=war&&war.checked;
  const d={type:warOn?'garantia':'reparacion',warrantyOf:warOn?war.value:null,
    device:{type:v('d-type'),brand:v('d-brand'),model:v('d-model'),serial:v('d-serial')},
    accessories:acc,conditions:checks('cond'),conditionNote:v('d-condn'),fault:v('d-fault'),
    hasPassword:($('input[name="pw"]:checked')||{}).value==='si',backup:($('input[name="bk"]:checked')||{}).value||'nosabe',
    photos:I.photos,priority:v('d-prio'),techId:v('d-tech')||null,promisedTs:v('d-prom')?parseDateInput(v('d-prom')):null,
    termsAccepted:$('#d-terms').checked,signature:UI.sig?UI.sig.data():null};
  if(I.clientId)d.clientId=I.clientId;
  else if(I.newClient)d.newClient={name:v('c-name'),wa:v('c-wa'),dni:v('c-dni'),email:v('c-mail'),consentCare:$('#c-care').checked,consentMkt:$('#c-mkt').checked};
  else{toast('Elegí un cliente o cargá uno nuevo.','bad');return;}
  const o=run(()=>orderCreate(d));if(!o)return;
  inReset();successIntake(o);
};
function fillMsg(tpl,o){const c=getClient(o.clientId);const t=quoteTotals(o);const op=orderPay(o);
  return String(tpl).replace(/\{(\w+)\}/g,(m,k)=>({cliente:c?c.name.split(' ')[0]:'',equipo:devLabel(orderDev(o)),taller:S.cfg.shop.name,ot:otCode(o),total:fmt(t.total),vence:o.quote.validUntil?fdate(o.quote.validUntil):'—',saldo:fmt(Math.max(0,op.due)),horario:S.cfg.shop.hours}[k]??m));}
function waButton(o,tplKey,label,cls){const c=getClient(o.clientId);if(!c||c.anon||!waDigits(c.wa))return '';return '<a class="btn '+(cls||'')+'" href="'+esc(waLink(c.wa,fillMsg(S.cfg.msgs[tplKey],o)))+'" target="_blank" rel="noopener" data-act="waSent" data-o="'+o.id+'" data-k="'+tplKey+'">'+ic('chat',18)+esc(label)+'</a>';}
ACTS.waSent=el=>{const o=getOrder(el.dataset.o);hist(o,'aviso','Aviso al cliente por WhatsApp preparado ('+el.dataset.k+'). El envío lo confirma quien presiona "enviar" en WhatsApp.');scheduleSave();};
function successIntake(o){
  modal({title:'Orden '+otCode(o)+' creada',sticky:false,html:'<div class="alert ok">'+ic('check',18)+'<span>Recibimos <b>'+esc(devLabel(orderDev(o)))+'</b> de <b>'+esc(clientName(o.clientId))+'</b>.</span></div><p class="mut sm">Imprimí el comprobante para el cliente. El estado se puede consultar con el N.º <b>'+o.n+'</b> y los últimos 4 dígitos del WhatsApp.</p><div class="col">'
    +'<button type="button" class="btn p" data-pr="ingreso">'+ic('print',18)+'Imprimir comprobante de ingreso</button>'+waButton(o,'recibido','Avisar por WhatsApp (recibido)')
    +'<button type="button" class="btn" data-pr="hoja">'+ic('print',18)+'Imprimir hoja de trabajo interna</button></div><p class="mut xs">El aviso por WhatsApp se abre en tu teléfono o WhatsApp Web: lo enviás vos. El sistema no envía mensajes solo.</p>',
    buttons:[{label:'Nueva recepción',onClick:()=>{renderView();}},{label:'Abrir la orden',cls:'p',onClick:()=>{go('orden',o.id);}}],
    onOpen:h=>{h.$$('[data-pr]').forEach(b=>b.onclick=()=>run(()=>printDoc(b.dataset.pr,o.id)));}});
}
