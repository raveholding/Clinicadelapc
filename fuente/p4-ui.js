/* =====================================================================
   INTERFAZ BASE: íconos, enrutador, estructura (barra lateral, superior),
   modales, avisos, tablas ordenables, regiones, impresión, firma y fotos.
   ===================================================================== */
const ICON={
dot:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',send:'M22 2L11 13M22 2l-7 20-4-9-9-4z',
home:'M3 11l9-8 9 8M5 10v10h14V10',plus:'M12 5v14M5 12h14',kanban:'M3 3h5v18H3zM10 3h5v12h-5zM17 3h4v8h-4z',
wrench:'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
box:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',truck:'M1 6h13v10H1zM14 10h4l4 3v3h-8M6 19a1.5 1.5 0 1 0 0-.01M18 19a1.5 1.5 0 1 0 0-.01',
cash:'M3 6h18v12H3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M6 9v.01M18 15v.01',cart:'M6 6h15l-2 9H8zM6 6L5 3H2M9 20a1 1 0 1 0 0-.01M18 20a1 1 0 1 0 0-.01',
users:'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',menu:'M3 6h18M3 12h18M3 18h18',
check:'M20 6L9 17l-5-5',clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',camera:'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
print:'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
trash:'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',edit:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',arrow:'M5 12h14M12 5l7 7-7 7',
list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',clip:'M9 2h6v4H9zM6 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1M8 12h8M8 16h5',
file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',play:'M6 3l14 9-14 9z',pause:'M6 4h4v16H6zM14 4h4v16h-4z',
download:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',alert:'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
spark:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',x:'M18 6L6 18M6 6l12 12',
user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',lock:'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
refresh:'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 15-3.4L23 10M1 14l4.5 4.4A9 9 0 0 0 20.5 15',tag:'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',cpu:'M6 6h12v12H6zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3'
};
const ic=(n,s)=>'<svg width="'+(s||20)+'" height="'+(s||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(ICON[n]||ICON.file)+'"/></svg>';
const LOGO='<svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#14a89c"/><rect x="11" y="15" width="42" height="28" rx="4" fill="none" stroke="#fff" stroke-width="4"/><path d="M24 51h16M32 43v8" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M32 22v14M25 29h14" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';

/* ---------- estado de interfaz ---------- */
const UI={mode:'public',screen:'resumen',params:[],sort:{},f:{},tab:{},collapsed:false,open:false,modals:[],_raf:0,assistOpen:false,lastPrint:null,regions:{}};
const SCREENS={},ACTS={},INP={},CHG={};
UI.dirty=function(){if(UI._raf)return;UI._raf=requestAnimationFrame(()=>{UI._raf=0;try{renderChrome();const sc=SCREENS[UI.screen];if(!(sc&&sc.noAuto))renderView();}catch(e){console.error(e);}});};
UI.onNotify=function(n){const u=curUser();if(u&&notifForUser(n,u))toast('🔔 '+n.title,'info');};

/* ---------- avisos ---------- */
function toast(msg,kind){const el=document.createElement('div');el.className='toast '+(kind==='bad'?'bad':kind==='ok'?'ok':'');el.setAttribute('role',kind==='bad'?'alert':'status');el.innerHTML='<span>'+esc(msg)+'</span><button type="button" aria-label="Cerrar aviso">×</button>';
  const box=$('#toasts');box.appendChild(el);const rm=()=>el.remove();el.querySelector('button').onclick=rm;setTimeout(rm,kind==='bad'?9000:5200);while(box.children.length>4)box.firstChild.remove();}
function run(fn,okMsg){try{const r=fn();if(okMsg)toast(okMsg,'ok');return r===undefined?true:r;}catch(e){if(e instanceof VBErr){toast(e.message,'bad');return undefined;}console.error(e);toast('Ocurrió un error inesperado. No se guardó nada.','bad');return undefined;}}

/* ---------- modales ---------- */
function modal(o){
  const id='m'+(UI.modals.length+1);const ov=document.createElement('div');ov.className='ov';ov.dataset.mid=id;
  const prevFocus=document.activeElement;
  const btns=(o.buttons||[]).map((b,i)=>'<button type="button" class="btn '+(b.cls||'')+'" data-bi="'+i+'"'+(b.disabled?' disabled':'')+'>'+(b.icon?ic(b.icon,18):'')+esc(b.label)+'</button>').join('');
  ov.innerHTML='<div class="modal '+(o.wide?'wide':'')+(o.small?' sm':'')+'" role="dialog" aria-modal="true" aria-labelledby="'+id+'t"><header><h2 id="'+id+'t">'+esc(o.title)+'</h2><button type="button" class="btn g ibtn" data-close aria-label="Cerrar">'+ic('x')+'</button></header><div class="bd">'+(o.html||'')+'<div class="alert bad hide" role="alert" data-err></div></div>'+(btns?'<footer>'+btns+'</footer>':'')+'</div>';
  document.body.appendChild(ov);
  const h={sticky:!!o.sticky,el:ov,box:ov.querySelector('.modal'),body:ov.querySelector('.bd'),
    close(){ov.remove();UI.modals=UI.modals.filter(x=>x!==h);if(o.onClose)o.onClose();if(prevFocus&&document.contains(prevFocus)&&prevFocus.focus)try{prevFocus.focus();}catch(e){}},
    err(m){const e=ov.querySelector('[data-err]');e.textContent=m;e.classList.remove('hide');e.scrollIntoView({block:'nearest'});},
    clearErr(){ov.querySelector('[data-err]').classList.add('hide');},
    $(s){return ov.querySelector(s);},$$(s){return [...ov.querySelectorAll(s)];},
    setBtn(i,props){const b=ov.querySelector('[data-bi="'+i+'"]');if(b)Object.assign(b,props);}};
  ov.addEventListener('mousedown',e=>{if(e.target===ov&&!o.sticky)h.close();});
  ov.querySelector('[data-close]').onclick=()=>h.close();
  ov.addEventListener('keydown',e=>{if(e.key==='Escape'&&!o.sticky){e.stopPropagation();h.close();}
    if(e.key==='Tab'){const f=[...ov.querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex="0"]')].filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}});
  ov.querySelectorAll('[data-bi]').forEach(b=>b.addEventListener('click',()=>{const bt=o.buttons[+b.dataset.bi];h.clearErr();try{const r=bt.onClick?bt.onClick(h):undefined;if(r!==false&&!bt.keep)h.close();}catch(e){if(e instanceof VBErr)h.err(e.message);else{console.error(e);h.err('Ocurrió un error inesperado. No se guardó nada.');}}}));
  UI.modals.push(h);
  if(o.onOpen)o.onOpen(h);
  const first=ov.querySelector('[autofocus],input:not([type=hidden]):not([disabled]),select,textarea')||ov.querySelector('[data-close]');if(first&&first.focus)setTimeout(()=>first.focus(),30);
  return h;
}
function confirmBox({title,html,ok,cls,danger,onOk,reason,confirmWord}){
  let extra='';if(reason)extra+='<div class="field"><label for="cf-r">Motivo (obligatorio)</label><input type="text" id="cf-r" maxlength="120" autocomplete="off"></div>';
  if(confirmWord)extra+='<div class="field"><label for="cf-w">Escribí '+esc(confirmWord)+' para confirmar</label><input type="text" id="cf-w" autocomplete="off"></div>';
  return modal({title,small:true,html:'<div>'+html+'</div>'+extra,buttons:[{label:'Cancelar'},{label:ok||'Confirmar',cls:danger?'d':'p',onClick:h=>{const r=reason?h.$('#cf-r').value:null;const w=confirmWord?h.$('#cf-w').value:null;if(reason&&String(r).trim().length<3)throw new VBErr('Escribí el motivo.');if(confirmWord&&w!==confirmWord)throw new VBErr('Escribí '+confirmWord+' para continuar.');return onOk(r,w);}}]});
}

/* ---------- campos ---------- */
function fld(label,input,hint,cls){return '<div class="field '+(cls||'')+'"><label>'+esc(label)+'</label>'+input+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>';}
function opts(list,sel,ph){return (ph?'<option value="">'+esc(ph)+'</option>':'')+list.map(x=>'<option value="'+esc(x[0])+'"'+(String(x[0])===String(sel)?' selected':'')+'>'+esc(x[1])+'</option>').join('');}
function badge(txt,k){return '<span class="badge '+(k||'')+'">'+esc(txt)+'</span>';}
function stBadge(id){const s=ST[id];return '<span class="badge '+s.badge+'">'+esc(s.name)+'</span>';}
function exChip(){return APP.variant==='demo'?'<span class="ex" title="Dato de ejemplo">ejemplo</span>':'';}
function pageHead(title,sub,actions){return '<div class="pg-h"><div><h1>'+esc(title)+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div><div class="row">'+(actions||'')+'</div></div>';}

/* ---------- tablas ordenables (4.15) ---------- */
function sortHead(tid,key,label,cls){const s=UI.sort[tid];const dir=s&&s.key===key?s.dir:null;return '<th class="'+(cls||'')+'" scope="col" aria-sort="'+(dir==='asc'?'ascending':dir==='desc'?'descending':'none')+'"><button type="button" data-act="sort" data-t="'+tid+'" data-k="'+key+'">'+label+'<span class="ar" aria-hidden="true">'+(dir==='asc'?'▲':dir==='desc'?'▼':'↕')+'</span></button></th>';}
function sortRows(tid,rows,acc,def){const s=UI.sort[tid]||def;if(!s||!acc[s.key])return rows;const f=acc[s.key],d=s.dir==='desc'?-1:1;
  return rows.map((r,i)=>[r,i,f(r)]).sort((a,b)=>{const x=a[2],y=b[2];const nx=x==null||x==='',ny=y==null||y==='';if(nx&&ny)return a[1]-b[1];if(nx)return 1;if(ny)return -1;let c=typeof x==='number'&&typeof y==='number'?x-y:COLL.compare(String(x),String(y));return c?c*d:a[1]-b[1];}).map(x=>x[0]);}
ACTS.sort=(el)=>{const t=el.dataset.t,k=el.dataset.k;const s=UI.sort[t];UI.sort[t]={key:k,dir:s&&s.key===k&&s.dir==='asc'?'desc':'asc'};
  const reg=el.closest('[data-region]');if(reg&&UI.regions[reg.dataset.region])UI.region(reg.dataset.region);else renderView();
  const nb=document.querySelector('[data-act="sort"][data-t="'+t+'"][data-k="'+k+'"]');if(nb)nb.focus();};
UI.region=function(id){const el=document.querySelector('[data-region="'+id+'"]');if(el&&UI.regions[id])el.innerHTML=UI.regions[id]();};
function region(id,fn){UI.regions[id]=fn;return '<div data-region="'+id+'">'+fn()+'</div>';}
function tableWrap(inner){return '<div class="tbl-wrap">'+inner+'</div>';}

/* ---------- impresión (documentos internos y del cliente) ---------- */
function shopHead(){const s=S.cfg.shop;return '<h1>'+esc(s.name)+'</h1><div>'+esc(s.addr)+' · Tel. '+esc(s.phone)+' · '+esc(s.mail)+'</div><div>'+esc(s.hours)+'</div>';}
function printFoot(){return '<p style="margin-top:14px;font-size:10px;color:#444">'+(APP.variant==='demo'?'<b>DEMO — datos de ejemplo.</b> ':'')+'Sistema VB · Desarrollado por <b>'+VB.name+'</b> · '+VB.cel+' · '+VB.mail+' · '+VB.lema+'</p>';}
function printDoc(kind,id){
  const o=id&&kind!=='cierre'?getOrder(id):null;const c=o?getClient(o.clientId):null;const d=o?orderDev(o):null;let h='';
  const head=o?'<table><tr><td><b>Orden</b> '+esc(otCode(o))+'</td><td><b>Fecha</b> '+esc(fdt(o.dates.created))+'</td><td><b>Estado</b> '+esc(ST[o.status].name)+'</td></tr><tr><td colspan="2"><b>Cliente</b> '+esc(c?c.name:'')+(c&&c.wa?' · '+esc(c.wa):'')+'</td><td><b>Técnico</b> '+esc(o.techId?userName(o.techId):'sin asignar')+'</td></tr><tr><td colspan="2"><b>Equipo</b> '+esc(devLabel(d))+'</td><td><b>N° de serie</b> '+esc(d&&d.serial||'—')+'</td></tr></table>':'';
  if(kind==='ingreso'){h=shopHead()+'<h2>Comprobante de ingreso de equipo</h2>'+head+'<h2>Falla informada</h2><p>'+esc(o.intake.fault)+'</p><h2>Accesorios entregados</h2><p>'+(o.intake.accessories.length?esc(o.intake.accessories.join(', ')):'Ninguno')+'</p><h2>Estado físico al recibir</h2><p>'+(o.intake.conditions.length?esc(o.intake.conditions.join(', ')):'Sin datos')+(o.intake.conditionNote?' — '+esc(o.intake.conditionNote):'')+'</p><p>Fotos del estado inicial: '+o.intake.photos.length+' · Clave de acceso informada: '+(o.intake.hasPassword?'sí (se anota aparte, no se guarda en el sistema)':'no')+' · Copia de seguridad hecha por el cliente: '+({si:'sí',no:'no',nosabe:'no sabe'}[o.intake.backup])+'</p>'+(o.dates.promised?'<p><b>Fecha estimada:</b> '+esc(fdate(o.dates.promised))+'</p>':'')+'<h2>Condiciones</h2><p style="font-size:10px">'+esc(S.cfg.terms)+'</p><p>Consulta de estado: ingresá el N° '+esc(String(o.n))+' y los últimos 4 dígitos de tu WhatsApp en la página del taller.</p>'+(o.intake.signature?'<p>Firma del cliente:<br><img class="sigimg" src="'+o.intake.signature+'" alt="Firma"></p>':'<p>Firma del cliente: ______________________</p>')+printFoot();}
  else if(kind==='presupuesto'){const t=quoteTotals(o);h=shopHead()+'<h2>Presupuesto de reparación</h2>'+head+'<h2>Diagnóstico</h2><p>'+esc(o.diag.text||'—')+'</p><table><tr><th>Detalle</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>'+o.quote.lines.filter(l=>l.state!=='liberado').map(l=>'<tr><td>'+esc(l.desc)+'</td><td>'+esc(fq(l.qty))+'</td><td>'+esc(fmt(l.unitCents))+'</td><td>'+esc(fmt(lineAmt(l)))+'</td></tr>').join('')+'</table><p>Mano de obra: '+esc(fmt(t.mo))+' · Repuestos: '+esc(fmt(t.rep))+(t.disc?' · Bonificación: −'+esc(fmt(t.disc))+(o.quote.discountReason?' ('+esc(o.quote.discountReason)+')':''):'')+'</p><p><b>TOTAL: '+esc(fmt(t.total))+'</b></p>'+(o.quote.validUntil?'<p>Vigencia: hasta el '+esc(fdate(o.quote.validUntil))+'</p>':'')+'<div class="legend">DOCUMENTO NO VÁLIDO COMO FACTURA</div><p>Aprobación del cliente: ______________________</p>'+printFoot();}
  else if(kind==='hoja'){h=shopHead()+'<h2>Hoja de trabajo interna (técnico)</h2>'+head+'<h2>Falla informada</h2><p>'+esc(o.intake.fault)+'</p><h2>Diagnóstico</h2><p>'+esc(o.diag.text||'—')+'</p><h2>Tareas</h2><table>'+(o.tasks.length?o.tasks.map(t=>'<tr><td>'+(t.done?'☑':'☐')+' '+esc(t.text)+'</td><td>'+esc(t.techId?userName(t.techId):'—')+'</td></tr>').join(''):'<tr><td>Sin tareas cargadas</td></tr>')+'</table><h2>Repuestos</h2><table>'+(o.quote.lines.filter(l=>l.kind==='rep'&&l.state!=='liberado').map(l=>{const it=itemById(l.itemId);return '<tr><td>'+esc(l.desc)+'</td><td>'+esc(fq(l.qty))+'</td><td>'+esc(it?it.loc:'')+'</td><td>'+({usado:'usado',reservado:'reservado',cotizado:'cotizado'}[l.state]||'')+'</td></tr>';}).join('')||'<tr><td>Sin repuestos</td></tr>')+'</table><h2>Pruebas finales</h2><table>'+o.tests.map(t=>'<tr><td>'+(t.ok?'☑':'☐')+' '+esc(t.text)+'</td></tr>').join('')+'</table><p>Tiempo estimado: '+esc(dur(quoteTotals(o).estMin*MIN))+' · Tiempo registrado: '+esc(dur(orderMs(o)))+'</p>'+printFoot();}
  else if(kind==='entrega'){const t=quoteTotals(o);const op=orderPay(o);h=shopHead()+'<h2>Comprobante de entrega y cobro</h2>'+head+'<table><tr><th>Detalle</th><th>Importe</th></tr>'+o.quote.lines.filter(l=>l.state!=='liberado').map(l=>'<tr><td>'+esc(l.desc)+' × '+esc(fq(l.qty))+'</td><td>'+esc(fmt(lineAmt(l)))+'</td></tr>').join('')+'</table><p><b>Total: '+esc(fmt(t.total))+'</b> · Cobrado: '+esc(fmt(op.paid+op.pend))+' · A cuenta corriente: '+esc(fmt(op.cc))+' · Saldo: '+esc(fmt(Math.max(0,op.due)))+'</p>'+(o.warrantyUntil?'<p>Garantía de la reparación hasta el '+esc(fdate(o.warrantyUntil))+' (cubre lo reparado, no daños nuevos).</p>':'')+'<div class="legend">DOCUMENTO NO VÁLIDO COMO FACTURA</div><p>Recibí conforme: ______________________</p>'+printFoot();}
  else if(kind==='cierre'){const s=S.cash.sessions.find(x=>x.id===id);const sn=s.snapshot;h=shopHead()+'<h2>Cierre de caja N.º '+s.n+'</h2><table><tr><td>Apertura</td><td>'+esc(fdt(sn.openedAt))+' · '+esc(userName(sn.openedBy))+'</td></tr><tr><td>Cierre</td><td>'+esc(fdt(sn.closedAt))+' · '+esc(userName(sn.closedBy))+'</td></tr><tr><td>Fondo inicial</td><td>'+esc(fmt(sn.fondo))+'</td></tr>'+Object.keys(sn.porMedio).map(k=>'<tr><td>Cobrado en '+esc(METHODS[k])+'</td><td>'+esc(fmt(sn.porMedio[k]))+'</td></tr>').join('')+'<tr><td>Ingresos de efectivo</td><td>'+esc(fmt(sn.ingresos))+'</td></tr><tr><td>Egresos de efectivo</td><td>'+esc(fmt(sn.egresos))+'</td></tr><tr><td><b>Efectivo esperado</b></td><td>'+esc(fmt(sn.efectivoEsperado))+'</td></tr><tr><td><b>Efectivo contado</b></td><td>'+esc(fmt(sn.declarado))+'</td></tr><tr><td><b>Diferencia</b></td><td>'+esc(fmt(sn.diferencia))+'</td></tr><tr><td>A cuenta corriente (deuda de clientes, no entró a caja)</td><td>'+esc(fmt(sn.ccNuevo))+'</td></tr>'+(sn.pendienteDigital?'<tr><td>Cobros digitales sin verificar</td><td>'+esc(fmt(sn.pendienteDigital))+'</td></tr>':'')+'</table>'+(sn.observaciones?'<p>Observaciones: '+esc(sn.observaciones)+'</p>':'')+'<p class="mono" style="font-size:10px">Sello SHA-256: '+esc(s.hash)+'</p>'+printFoot();}
  const pa=$('#printArea');pa.innerHTML=h;UI.lastPrint={kind,id,html:h};
  if(!window.__noPrint)setTimeout(()=>window.print(),60);
}
ACTS.print=el=>{const k=el.dataset.k,id=el.dataset.id;run(()=>printDoc(k,id));};

/* ---------- fotos y firma ---------- */
function resizeImage(file,max){return new Promise((res,rej)=>{if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type))return rej(new VBErr('Elegí una imagen JPG, PNG o WebP.'));
  const fr=new FileReader();fr.onerror=()=>rej(new VBErr('No se pudo leer la imagen.'));
  fr.onload=()=>{const im=new Image();im.onerror=()=>rej(new VBErr('La imagen está dañada.'));im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(im.width*k));cv.height=Math.max(1,Math.round(im.height*k));const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL('image/jpeg',0.62));};im.src=fr.result;};fr.readAsDataURL(file);});}
function sigPad(cv){const cx=cv.getContext('2d');let dr=false,any=false,lx=0,ly=0;cx.lineWidth=2.4;cx.lineCap='round';cx.strokeStyle='#111';
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height];};
  cv.addEventListener('pointerdown',e=>{dr=true;[lx,ly]=pos(e);cv.setPointerCapture(e.pointerId);e.preventDefault();});
  cv.addEventListener('pointermove',e=>{if(!dr)return;const [x,y]=pos(e);cx.beginPath();cx.moveTo(lx,ly);cx.lineTo(x,y);cx.stroke();lx=x;ly=y;any=true;});
  const end=()=>{dr=false;};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  return {clear(){cx.clearRect(0,0,cv.width,cv.height);any=false;},isEmpty:()=>!any,data:()=>any?cv.toDataURL('image/png'):null};}

/* ---------- navegación ---------- */
const NAV=[
 {g:null,items:[{id:'resumen',label:'Resumen',icon:'home'}]},
 {g:'Operación',items:[
  {id:'ingreso',label:'Nueva recepción',icon:'plus',perm:'intake'},
  {id:'ordenes',label:'Taller (órdenes)',icon:'kanban',badge:()=>S.orders.filter(o=>!ST[o.status].terminal).length},
  {id:'caja',label:'Caja y cobros',icon:'cash',perm:'cash'},
  {id:'mostrador',label:'Venta de mostrador',icon:'cart',perm:'payments'},
  {id:'inventario',label:'Inventario',icon:'box',badge:()=>S.items.filter(i=>!i.archived&&i.kind!=='herramienta'&&i.min>0&&stockOf(i.id)<=i.min).length,badgeBad:true},
  {id:'compras',label:'Proveedores y compras',icon:'truck',perm:'purchases'}]},
 {g:'Clientes',items:[{id:'clientes',label:'Clientes y equipos',icon:'users',perm:'clients_edit'}]},
 {g:'Equipo',items:[{id:'equipo',label:'Técnicos y tareas',icon:'wrench'}]},
 {g:'Avisos',items:[{id:'notificaciones',label:'Notificaciones',icon:'bell',badge:()=>unreadCount()}]},
 {g:'Análisis',items:[{id:'reportes',label:'Rentabilidad',icon:'chart',perm:'view_reports'}]},
 {g:'Sistema',items:[{id:'config',label:'Configuración',icon:'gear',perm:'config'},{id:'auditoria',label:'Auditoría',icon:'shield',perm:'audit'}]}
];
function parseHash(){const h=location.hash.replace(/^#/,'');if(!h||h==='estado')return {mode:'public'};if(h==='acceso')return {mode:'login'};
  const m=/^panel(?:\/([^/]+))?(?:\/(.+))?$/.exec(h);if(!m)return {mode:'public'};return {mode:'panel',screen:m[1]||'resumen',params:m[2]?m[2].split('/'):[]};}
function go(screen,...params){location.hash='#panel/'+screen+(params.length?'/'+params.join('/'):'');}
function applyRoute(){
  const r=parseHash();
  if(r.mode==='panel'&&!curUser()){location.hash='#acceso';return;}
  UI.mode=r.mode;if(r.mode==='panel'){UI.screen=SCREENS[r.screen]?r.screen:'resumen';UI.params=r.params;}
  UI.open=false;closeAllModals();renderApp();
}
function closeAllModals(){[...UI.modals].forEach(m=>m.close());}
window.addEventListener('hashchange',applyRoute);

/* ---------- render ---------- */
function renderApp(){
  const root=$('#root');
  if(UI.mode==='public'){root.innerHTML=publicHtml();publicBind();document.title='Estado de tu reparación · '+S.cfg.shop.name;return;}
  if(UI.mode==='login'){root.innerHTML=loginHtml();loginBind();document.title='Acceso del equipo · '+S.cfg.shop.name;return;}
  const u=curUser();
  const nav=NAV.map(g=>{const its=g.items.filter(i=>!i.perm||can(i.perm));if(!its.length)return '';return (g.g?'<div class="nav-g">'+g.g+'</div>':'')+its.map(i=>'<a href="#panel/'+i.id+'" data-nav="'+i.id+'"><span class="sr-only">'+esc(i.label)+'</span>'+ic(i.icon)+'<span aria-hidden="true">'+i.label+'</span>'+(i.badge?'<b class="cnt hide" data-badge="'+i.id+'"></b>':'')+'</a>').join('');}).join('');
  root.innerHTML='<div class="app'+(UI.collapsed?' collapsed':'')+(UI.open?' open':'')+'" id="app"><aside class="side" id="side" aria-label="Menú principal"><a class="brand" href="#panel/resumen">'+LOGO+'<div><b>'+esc(S.cfg.shop.name)+'</b><small>Sistema VB · taller</small></div></a><nav class="nav" aria-label="Secciones">'+nav+'</nav><div class="side-foot">Desarrollado por <b>'+VB.name+'</b><br><a href="'+VB.wa+'" target="_blank" rel="noopener">WhatsApp</a> · <a href="'+VB.tel+'">Llamar</a> · <a href="mailto:'+VB.mail+'">Correo</a></div></aside><div class="scrim" data-act="closeNav"></div><div class="main"><header class="top" id="top"></header><main class="content" id="view" tabindex="-1"></main><footer class="foot">'+vbFooter()+'</footer></div></div>'+assistantShell();
  renderChrome();renderView();assistantBind();
}
function vbFooter(){return '<div class="row spread"><div><b>'+esc(S.cfg.shop.name)+'</b> · Sistema VB '+esc(APP.ver)+' · '+(APP.variant==='demo'?'versión demo · compilada '+esc(APP.build):'versión del cliente')+'<br>Desarrollado por <b>'+VB.name+'</b> · '+VB.cel+' · '+VB.mail+' · <i>'+VB.lema+'</i></div><div class="row"><a class="vbbtn" href="'+VB.wa+'" target="_blank" rel="noopener">'+ic('chat',18)+'WhatsApp</a><a class="vbbtn alt" href="'+VB.tel+'">'+ic('phone',18)+'Llamar</a><a class="vbbtn alt" href="mailto:'+VB.mail+'">'+ic('mail',18)+'Correo</a></div></div>';}
function renderChrome(){
  const top=$('#top');if(!top)return;const u=curUser();if(!u)return;
  const sess=openSession();
  top.innerHTML='<button type="button" class="btn g ibtn hamb" data-act="toggleNav" aria-label="Abrir o cerrar el menú" aria-expanded="'+(UI.open?'true':'false')+'">'+ic('menu')+'</button><button type="button" class="btn g ibtn hide-sm" data-act="collapseNav" aria-label="Contraer menú lateral">'+ic('menu',18)+'</button><div class="ttl" id="ttl"></div>'
   +'<div style="position:relative;flex:1 1 220px;max-width:340px"><label class="sr-only" for="gsearch">Buscar orden, cliente o número de serie</label><input type="search" id="gsearch" placeholder="Buscar OT, cliente, serie…" autocomplete="off" data-inp="gsearch"><div class="sres hide" id="gres" role="listbox"></div></div>'
   +(can('intake')?'<a class="btn p" href="#panel/ingreso">'+ic('plus',18)+'<span class="hide-sm">Nueva recepción</span><span class="sr-only">Nueva recepción</span></a>':'')
   +'<a class="chip hide-sm" href="#panel/caja" title="Estado de la caja">'+ic('cash',16)+(sess?'Caja abierta N.º '+sess.n:'Caja cerrada')+'</a>'
   +'<a class="btn g ibtn" href="#panel/notificaciones" aria-label="Notificaciones ('+unreadCount()+' sin leer)" style="position:relative">'+ic('bell')+(unreadCount()?'<b class="cnt" style="position:absolute;top:2px;right:0;background:#f59e0b;color:#2a1a00;border-radius:99px;font-size:.7rem;padding:0 6px">'+unreadCount()+'</b>':'')+'</a>'
   +'<button type="button" class="btn g" data-act="userMenu" aria-haspopup="menu"><span class="ava" aria-hidden="true">'+esc(initials(u.name))+'</span><span class="hide-sm">'+esc(u.name)+'<br><small class="mut">'+esc(ROLES[u.role].label)+'</small></span></button>';
  $$('.nav a').forEach(a=>{if(a.dataset.nav===UI.screen||(UI.screen==='orden'&&a.dataset.nav==='ordenes')||(UI.screen==='cliente'&&a.dataset.nav==='clientes'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  for(const g of NAV)for(const i of g.items){if(!i.badge)continue;const b=document.querySelector('[data-badge="'+i.id+'"]');if(!b)continue;const n=i.badge();b.textContent=n;b.classList.toggle('hide',!n);if(i.badgeBad)b.style.background='#fecaca';}
  const app=$('#app');if(app){app.classList.toggle('collapsed',UI.collapsed);app.classList.toggle('open',UI.open);}
}
function renderView(){
  const v=$('#view');if(!v)return;const sc=SCREENS[UI.screen];if(!sc)return;
  if(sc.perm&&!can(sc.perm)){v.innerHTML=pageHead('Sin acceso','Tu rol ('+esc(ROLES[curUser().role].label)+') no tiene permiso para '+esc(PERM_LABEL[sc.perm]||'esta sección')+'.')+'<div class="card"><p>Pedile a un administrador que te dé acceso o cambiá de usuario desde el menú de arriba.</p></div>';const t=$('#ttl');if(t)t.textContent='Sin acceso';return;}
  const y=window.scrollY;UI.regions={};
  let html;try{html=sc.view(UI.params||[]);}catch(e){console.error(e);html='<div class="alert bad">No se pudo mostrar esta pantalla ('+esc(e.message)+').</div>';}
  v.innerHTML=html;const t=$('#ttl');if(t)t.textContent=(typeof sc.title==='function'?sc.title(UI.params||[]):sc.title)||'';
  document.title=((t&&t.textContent)||'')+' · '+S.cfg.shop.name;
  if(sc.after)try{sc.after(UI.params||[]);}catch(e){console.error(e);}
  window.scrollTo(0,y);tick();
}

/* ---------- eventos globales (delegación) ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  if(!t){if(!e.target.closest('.menu'))$$('.menu').forEach(m=>m.remove());if(!e.target.closest('#gsearch,#gres')){const g=$('#gres');if(g)g.classList.add('hide');}return;}
  const f=ACTS[t.dataset.act];if(f){if(t.tagName==='A'&&t.getAttribute('href')==='#')e.preventDefault();try{f(t,e);}catch(err){if(err instanceof VBErr)toast(err.message,'bad');else{console.error(err);toast('Ocurrió un error inesperado.','bad');}}}
});
document.addEventListener('input',e=>{const t=e.target.closest('[data-inp]');if(t&&INP[t.dataset.inp])INP[t.dataset.inp](t,e);});
document.addEventListener('change',e=>{const t=e.target.closest('[data-chg]');if(t&&CHG[t.dataset.chg])CHG[t.dataset.chg](t,e);});
document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.matches&&t.matches('input[type=number],input[data-money]')&&t.value)try{t.select();}catch(x){}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const hadMenu=$$('.menu').length>0;$$('.menu').forEach(m=>m.remove());const tm=UI.modals[UI.modals.length-1];if(tm&&!tm.sticky&&!hadMenu)tm.close();const g=$('#gres');if(g)g.classList.add('hide');}});
ACTS.toggleNav=()=>{UI.open=!UI.open;renderChrome();};
ACTS.closeNav=()=>{UI.open=false;renderChrome();};
ACTS.collapseNav=()=>{UI.collapsed=!UI.collapsed;renderChrome();};
function showMenu(anchor,items){$$('.menu').forEach(m=>m.remove());const m=document.createElement('div');m.className='menu';m.setAttribute('role','menu');
  m.innerHTML=items.map((it,i)=>it.sep?'<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">':'<button type="button" role="menuitem" data-mi="'+i+'" '+(it.disabled?'disabled style="opacity:.5"':'')+'>'+(it.icon?ic(it.icon,18):'')+esc(it.label)+'</button>').join('');
  document.body.appendChild(m);const r=anchor.getBoundingClientRect();m.style.top=(window.scrollY+r.bottom+6)+'px';m.style.left=Math.max(8,Math.min(window.scrollX+r.left,window.scrollX+document.documentElement.clientWidth-m.offsetWidth-8))+'px';
  m.querySelectorAll('[data-mi]').forEach(b=>b.addEventListener('click',ev=>{ev.stopPropagation();m.remove();const it=items[+b.dataset.mi];if(it.fn)try{it.fn();}catch(err){if(err instanceof VBErr)toast(err.message,'bad');else console.error(err);}}));
  const f=m.querySelector('button');if(f)f.focus();return m;}
ACTS.userMenu=el=>{const u=curUser();const items=[{label:'Notificaciones',icon:'bell',fn:()=>go('notificaciones')},{sep:true},...S.users.filter(x=>x.active!==false&&x.id!==u.id).map(x=>({label:'Cambiar a '+x.name+' ('+ROLES[x.role].label+')',icon:'user',fn:()=>{SESSION.uid=x.id;localStorage.setItem('vbc_uid',x.id);audit('SESION_CAMBIO','Demo: cambio de usuario a '+x.name);if(!can(SCREENS[UI.screen]&&SCREENS[UI.screen].perm||'x')&&SCREENS[UI.screen]&&SCREENS[UI.screen].perm)go('resumen');renderApp();toast('Ahora usás el sistema como '+x.name+'.');}})),{sep:true},{label:'Cerrar sesión',icon:'lock',fn:()=>{SESSION.uid=null;localStorage.removeItem('vbc_uid');location.hash='#acceso';}}];
  showMenu(el,items);};

/* ---------- buscador global ---------- */
INP.gsearch=el=>{const q=el.value.trim().toLowerCase();const box=$('#gres');if(!q){box.classList.add('hide');return;}
  const res=[];const cn=can('clients_edit');
  for(const o of S.orders){const c=getClient(o.clientId),d=orderDev(o);const hay=(otCode(o)+' '+(c?c.name:'')+' '+devLabel(d)+' '+(d&&d.serial||'')).toLowerCase();if(hay.includes(q))res.push({t:'order',o,c,d});if(res.length>=8)break;}
  const cs=cn?S.clients.filter(c=>!c.anon&&(c.name+' '+c.wa).toLowerCase().includes(q)).slice(0,4):[];
  box.innerHTML=res.map(r=>'<button type="button" data-act="goto" data-to="orden/'+r.o.id+'"><b>'+esc(otCode(r.o))+'</b> · '+esc(devLabel(r.d))+'<br><span class="sm mut">'+esc(r.c?r.c.name:'')+' · '+esc(ST[r.o.status].name)+'</span></button>').join('')+cs.map(c=>'<button type="button" data-act="goto" data-to="cliente/'+c.id+'">'+ic('user',16)+' <b>'+esc(c.name)+'</b><br><span class="sm mut">Cliente</span></button>').join('')||'<div class="empty">Sin resultados</div>';
  box.classList.remove('hide');};
ACTS.goto=el=>{const g=$('#gres');if(g)g.classList.add('hide');const s=$('#gsearch');if(s)s.value='';location.hash='#panel/'+el.dataset.to;};

/* ---------- cronómetros vivos (sin re-render) ---------- */
function tick(){$$('[data-timer]').forEach(el=>{const o=S.orders.find(x=>x.id===el.dataset.timer);if(!o)return;const tech=el.dataset.tech||null;el.textContent=clock(orderMs(o,tech||undefined));});}
setInterval(tick,1000);
setInterval(()=>{if(S&&SESSION.uid){const n=scanSla();if(n){emitChange();}}},60000);
