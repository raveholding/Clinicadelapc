/* =====================================================================
   DOMINIO: clientes, equipos, órdenes, presupuestos, stock, cobros, caja,
   proveedores y compras. La interfaz sólo llama a estas funciones: todas
   validan permisos y reglas ANTES de modificar (todo o nada).
   ===================================================================== */
const getOrder=id=>S.orders.find(o=>o.id===id)||fail('No existe la orden.');
const getClient=id=>S.clients.find(c=>c.id===id)||null;
const getDevice=id=>S.devices.find(d=>d.id===id)||null;
const getItem=id=>S.items.find(i=>i.id===id)||fail('No existe el artículo.');
const getSup=id=>S.suppliers.find(s=>s.id===id)||fail('No existe el proveedor.');
const itemById=id=>S.items.find(i=>i.id===id)||null;
const otCode=o=>'OT-'+String(o.n).padStart(4,'0');
const needAny=(...ps)=>{if(!ps.some(p=>can(p)))fail('No tenés permiso para esta acción ('+(PERM_LABEL[ps[0]]||ps[0])+').','perm');};
const hist=(o,type,text)=>{o.history.push({ts:now(),uid:SESSION.uid||'sistema',type,text});};
const clientName=id=>{const c=getClient(id);return c?c.name:'—';};
const devLabel=d=>d?[d.type,d.brand,d.model].filter(Boolean).join(' '):'—';
const orderDev=o=>getDevice(o.deviceId);
const txt=(s,min,max,label)=>{s=String(s==null?'':s).trim();if(s.length<min)fail(label+' es obligatorio'+(min>1?' (mínimo '+min+' caracteres)':'')+'.');if(s.length>max)fail(label+' es demasiado largo (máximo '+max+').');return s;};

/* ---------------- clientes y equipos ---------------- */
function clientValidate(d){
  const name=txt(d.name,2,80,'El nombre');const waRaw=String(d.wa||'').trim();const wd=waDigits(waRaw);
  if(wd.length<8||wd.length>15)fail('El WhatsApp debe tener entre 8 y 15 números.');
  const dni=String(d.dni||'').replace(/\D/g,'');if(dni&&(dni.length<7||dni.length>9))fail('El DNI debe tener 7 a 9 números (o dejalo vacío).');
  const email=String(d.email||'').trim();if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('El correo no es válido.');
  const dup=S.clients.find(c=>!c.anon&&c.id!==d.id&&waDigits(c.wa).slice(-10)===wd.slice(-10));
  if(dup)fail('Ya existe un cliente con ese WhatsApp: '+dup.name+'.');
  if(!d.id&&!d.consentCare)fail('Falta el consentimiento para tratar los datos del cliente (atención de la reparación).');
  const ccLimit=d.ccLimitCents==null?0:Math.round(d.ccLimitCents);if(ccLimit<0||isNaN(ccLimit))fail('El límite de cuenta corriente no es válido.');
  return {name,wa:waRaw,dni,email,notes:String(d.notes||'').slice(0,500),ccLimitCents:ccLimit};
}
function clientSave(d){
  need('clients_edit');const v=clientValidate(d);let c;
  if(d.id){c=getClient(d.id);if(!c||c.anon)fail('El cliente no existe o fue dado de baja.');
    if(v.ccLimitCents!==c.ccLimitCents)need('clients_admin');
    Object.assign(c,v);audit('CLIENTE_EDITADO',c.id+' '+c.name);
  }else{
    c={id:nid('c'),n:++S.seq.cli,...v,ccLimitCents:0,createdAt:now(),consent:{care:true,mkt:!!d.consentMkt,at:now(),ver:1},anon:false};
    S.clients.push(c);audit('CLIENTE_NUEVO',c.id+' '+c.name);
  }
  emitChange();return c;
}
function clientConsent(id,{mkt}){need('clients_edit');const c=getClient(id);if(!c||c.anon)fail('Cliente inexistente.');c.consent.mkt=!!mkt;c.consent.at=now();audit('CLIENTE_CONSENTIMIENTO',c.id+' mkt='+(!!mkt));emitChange();}
function clientAnonymize(id){
  need('clients_admin');const c=getClient(id);if(!c||c.anon)fail('Cliente inexistente.');
  if(ccBalance(id)!==0)fail('El cliente tiene saldo de cuenta corriente ('+fmt(ccBalance(id))+'): regularizalo antes de la baja.');
  if(S.orders.some(o=>o.clientId===id&&!ST[o.status].terminal))fail('El cliente tiene órdenes abiertas: cerralas antes de la baja.');
  const old=c.name;Object.assign(c,{name:'Cliente dado de baja',wa:'',dni:'',email:'',notes:'',anon:true,anonAt:now()});c.consent={care:false,mkt:false,at:now(),ver:1};
  audit('CLIENTE_BAJA','Baja (anonimizado) '+c.id);emitChange();return old;
}
function deviceSave(d){
  const type=txt(d.type,2,40,'El tipo de equipo'),brand=txt(d.brand,1,40,'La marca'),model=txt(d.model,1,60,'El modelo');
  const serial=String(d.serial||'').trim().slice(0,60);
  if(!getClient(d.clientId))fail('Elegí un cliente.');
  let dev=serial?S.devices.find(x=>x.serial&&x.serial.toLowerCase()===serial.toLowerCase()&&x.clientId===d.clientId):null;
  if(dev){Object.assign(dev,{type,brand,model});return dev;}
  dev={id:nid('d'),clientId:d.clientId,type,brand,model,serial,createdAt:now()};S.devices.push(dev);return dev;
}
function warrantyFor(serial){serial=String(serial||'').trim().toLowerCase();if(!serial)return null;
  const ds=S.devices.filter(d=>d.serial&&d.serial.toLowerCase()===serial).map(d=>d.id);
  return S.orders.filter(o=>ds.includes(o.deviceId)&&o.status==='entregado'&&o.warrantyUntil&&o.warrantyUntil>now()).sort((a,b)=>b.dates.delivered-a.dates.delivered)[0]||null;}
function priorOrders(serial){serial=String(serial||'').trim().toLowerCase();if(!serial)return [];const ds=S.devices.filter(d=>d.serial&&d.serial.toLowerCase()===serial).map(d=>d.id);return S.orders.filter(o=>ds.includes(o.deviceId));}

/* ---------------- recepción / órdenes ---------------- */
function photoCheck(dataUrl){
  if(typeof dataUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl))fail('Una de las fotos no es una imagen válida (JPG, PNG o WebP).');
  if(dataUrl.length>600000)fail('Una de las fotos es demasiado pesada. Probá con otra.');
}
function photoStore(dataUrl){photoCheck(dataUrl);const id=nid('ph');S.photos[id]=dataUrl;return id;}
function orderCreate(d){
  need('intake');
  let client=null,cv=null;
  if(d.clientId){client=getClient(d.clientId);if(!client||client.anon)fail('Elegí o cargá un cliente.');}
  else if(d.newClient){need('clients_edit');cv=clientValidate({...d.newClient,id:null});}
  else fail('Elegí o cargá un cliente.');
  if(!d.device)fail('Faltan los datos del equipo.');
  txt(d.device.type,2,40,'El tipo de equipo');txt(d.device.brand,1,40,'La marca');txt(d.device.model,1,60,'El modelo');
  const fault=txt(d.fault,5,800,'La descripción de la falla');
  if(!d.termsAccepted)fail('El cliente tiene que aceptar las condiciones del servicio.');
  const photos=(d.photos||[]);if(photos.length>8)fail('Máximo 8 fotos por orden.');photos.forEach(photoCheck);
  if(d.signature&&(typeof d.signature!=='string'||!/^data:image\/png;base64,/.test(d.signature)||d.signature.length>120000))fail('La firma no es válida.');
  const type=d.type==='garantia'?'garantia':'reparacion';
  let origin=null;if(type==='garantia'){origin=S.orders.find(o=>o.id===d.warrantyOf);if(!origin)fail('Elegí la orden original de la garantía.');}
  const prio=PRIO[d.priority]?d.priority:'normal';
  const promised=d.promisedTs||null;if(promised&&promised<now()-DAY)fail('La fecha prometida no puede estar en el pasado.');
  if(d.techId){const t=userById(d.techId);if(!t||t.role!=='tecnico')fail('El técnico elegido no existe.');}
  /* --- todo validado: recién ahora se crea --- */
  if(!client)client=clientSave({...d.newClient,id:null});
  const dev=deviceSave({...d.device,clientId:client.id});
  const accs=(d.accessories||[]).map(a=>String(a).slice(0,60));const conds=(d.conditions||[]).map(a=>String(a).slice(0,60));
  const n=++S.seq.ot;
  const typeCfg=S.cfg.types[dev.type]||S.cfg.types['Otro'];
  const o={id:nid('o'),n,clientId:client.id,deviceId:dev.id,type,warrantyOf:origin?origin.id:null,status:'pendiente',stateSince:now(),priority:prio,outcome:null,
    techId:d.techId||null,
    intake:{accessories:accs,conditions:conds,conditionNote:String(d.conditionNote||'').slice(0,400),fault,hasPassword:!!d.hasPassword,backup:['si','no','nosabe'].includes(d.backup)?d.backup:'nosabe',photos:photos.map(photoStore),signature:d.signature||null,termsAccepted:true,receivedBy:SESSION.uid,termsVer:S.cfg.termsConfirmed?'confirmado':'ejemplo'},
    diag:{text:'',cause:'',by:null,at:null},
    quote:{status:'borrador',lines:[],discountCents:0,discountReason:'',validUntil:null,sentAt:null,approvedAt:null,approvedBy:null,approvedVia:null,rev:1,note:''},
    tasks:[],timeLog:[],tests:typeCfg.tests.map(t=>({text:t,ok:false})),
    dates:{created:now(),promised,ready:null,delivered:null},warrantyUntil:null,history:[],cancelReason:null};
  S.orders.push(o);
  hist(o,'ingreso','Equipo recibido'+(origin?' por garantía de '+otCode(origin):'')+'.');
  if(origin){const q=o.quote;q.status='aprobado';q.approvedAt=now();q.approvedBy='garantía';q.approvedVia='garantía';}
  audit('ORDEN_NUEVA',otCode(o)+' '+devLabel(dev)+' / '+client.name);
  notify('orden_nueva',{title:'Nueva orden '+otCode(o),body:devLabel(dev)+' · '+client.name+(prio!=='normal'?' · prioridad '+PRIO[prio]:''),ref:{type:'order',id:o.id},assignee:o.techId});
  emitChange();return o;
}
function orderAssign(id,techId){
  const o=getOrder(id);if(ST[o.status].terminal)fail('La orden ya está cerrada.');
  const self=techId===SESSION.uid&&curUser()&&curUser().role==='tecnico'&&(!o.techId||o.techId===SESSION.uid);
  if(!self)need('assign');
  if(techId){const t=userById(techId);if(!t||t.role!=='tecnico'||t.active===false)fail('El técnico no existe o está inactivo.');}
  if(o.techId===techId)return;
  const old=o.techId;o.techId=techId||null;hist(o,'asignacion',techId?'Asignada a '+userName(techId)+(old?' (antes '+userName(old)+')':''):'Sin técnico asignado');
  audit('ORDEN_ASIGNADA',otCode(o)+' → '+(techId?userName(techId):'—'));
  if(techId&&techId!==SESSION.uid)notify('tarea_asignada',{title:'Te asignaron la orden '+otCode(o),body:devLabel(orderDev(o)),ref:{type:'order',id:o.id},toUsers:[techId]});
  emitChange();
}
function orderSetPriority(id,p){needAny('assign','orders_work');if(!PRIO[p])fail('Prioridad inválida.');const o=getOrder(id);o.priority=p;hist(o,'prioridad','Prioridad: '+PRIO[p]);audit('ORDEN_PRIORIDAD',otCode(o)+' '+p);emitChange();}
function orderPromise(id,ts){needAny('assign','intake');const o=getOrder(id);o.dates.promised=ts||null;hist(o,'fecha','Fecha prometida: '+(ts?fdate(ts):'sin fecha'));emitChange();}
function diagSave(id,{text,cause}){
  need('orders_work');const o=getOrder(id);if(ST[o.status].terminal)fail('La orden ya está cerrada.');
  o.diag.text=txt(text,0,2000,'El diagnóstico');o.diag.cause=String(cause||'').trim().slice(0,200);o.diag.by=SESSION.uid;o.diag.at=now();
  hist(o,'diagnostico','Diagnóstico actualizado');audit('DIAGNOSTICO',otCode(o));emitChange();
}

/* ---- tareas, tiempos y pruebas ---- */
function taskAdd(id,{text,techId}){
  const o=getOrder(id);if(ST[o.status].terminal)fail('La orden ya está cerrada.');
  const t=txt(text,3,120,'La tarea');
  const mine=curUser()&&curUser().role==='tecnico'&&(techId||SESSION.uid)===SESSION.uid;
  if(mine)need('orders_work');else need('assign');
  const tech=techId||o.techId||null;if(tech&&!userById(tech))fail('El técnico no existe.');
  o.tasks.push({id:nid('t'),text:t,techId:tech,done:false,doneAt:null});
  hist(o,'tarea','Tarea agregada: '+t+(tech?' ('+userName(tech)+')':''));audit('TAREA_NUEVA',otCode(o)+' '+t);
  if(tech&&tech!==SESSION.uid)notify('tarea_asignada',{title:'Nueva tarea en '+otCode(o),body:t,ref:{type:'order',id:o.id},toUsers:[tech]});
  emitChange();
}
function taskToggle(id,taskId){
  const o=getOrder(id);const t=o.tasks.find(x=>x.id===taskId);if(!t)fail('La tarea no existe.');
  if(ST[o.status].terminal)fail('La orden ya está cerrada.');
  const u=curUser();const own=t.techId&&t.techId===SESSION.uid;
  if(!own&&!can('assign'))fail('Sólo '+(t.techId?userName(t.techId)+' o un supervisor':'un supervisor')+' puede marcar esta tarea.','perm');
  need('orders_work');
  t.done=!t.done;t.doneAt=t.done?now():null;hist(o,'tarea',(t.done?'Tarea terminada: ':'Tarea reabierta: ')+t.text);emitChange();
}
function taskRemove(id,taskId){need('assign');const o=getOrder(id);const t=o.tasks.find(x=>x.id===taskId);if(!t)return;if(t.done)fail('No se borra una tarea terminada.');o.tasks=o.tasks.filter(x=>x.id!==taskId);hist(o,'tarea','Tarea quitada: '+t.text);emitChange();}
function runningTimer(techId){for(const o of S.orders)for(const l of o.timeLog)if(!l.end&&l.techId===techId)return {order:o,log:l};return null;}
function orderMs(o,techId){const t=now();let s=0;for(const l of o.timeLog)if(!techId||l.techId===techId)s+=(l.end||t)-l.start;return s;}
function timerStart(id,techId){
  need('orders_work');const o=getOrder(id);
  if(!['diagnostico','proceso','prueba'].includes(o.status))fail('El cronómetro sólo corre en diagnóstico, proceso o prueba.');
  const u=curUser();const tech=techId||(u.role==='tecnico'?u.id:o.techId);
  if(!tech)fail('Asigná un técnico a la orden para medir el tiempo.');
  if(u.role==='tecnico'&&tech!==u.id)fail('Sólo podés medir tu propio tiempo.');
  const run=runningTimer(tech);if(run)fail(userName(tech)+' ya tiene el cronómetro corriendo en '+otCode(run.order)+'. Pausalo primero.');
  o.timeLog.push({id:nid('tl'),techId:tech,start:now(),end:null});hist(o,'tiempo','Cronómetro iniciado ('+userName(tech)+')');emitChange();
}
function timerStop(id,techId){
  need('orders_work');const o=getOrder(id);const u=curUser();const tech=techId||(u.role==='tecnico'?u.id:null);
  const l=o.timeLog.find(x=>!x.end&&(!tech||x.techId===tech));if(!l)fail('No hay un cronómetro corriendo en esta orden.');
  if(u.role==='tecnico'&&l.techId!==u.id)fail('Sólo podés pausar tu propio cronómetro.');
  l.end=now();hist(o,'tiempo','Cronómetro pausado ('+userName(l.techId)+'): '+dur(l.end-l.start));emitChange();
}
function stopAllTimers(o,why){let n=0;for(const l of o.timeLog)if(!l.end){l.end=now();n++;}if(n)hist(o,'tiempo','Cronómetros detenidos'+(why?' ('+why+')':''));}
function testToggle(id,idx){need('orders_work');const o=getOrder(id);if(!['proceso','prueba'].includes(o.status))fail('Las pruebas se marcan cuando la orden está en proceso o en prueba.');const t=o.tests[idx];if(!t)return;t.ok=!t.ok;t.by=SESSION.uid;t.at=now();emitChange();}

/* ---------------- presupuesto (mano de obra + repuestos del inventario) ---------------- */
const lineAmt=l=>Math.round(l.qty*l.unitCents);
function quoteTotals(o){
  const q=o.quote;let mo=0,rep=0,cost=0,estMin=0;
  for(const l of q.lines){if(l.state==='liberado')continue;const a=lineAmt(l);if(l.kind==='mo'){mo+=a;estMin+=Math.round((l.estMin||0)*l.qty);}else{rep+=a;cost+=Math.round((l.costCents||0)*l.qty);}}
  const sub=mo+rep;const disc=Math.min(q.discountCents||0,sub);const billable=o.type!=='garantia'&&o.outcome!=='cortesia';
  const total=billable?sub-disc:0;
  return {mo,rep,sub,disc,total,cost,estMin,billable};
}
function reservedQty(itemId,exceptOrderId){let r=0;for(const o of S.orders){if(ST[o.status].terminal||o.id===exceptOrderId)continue;for(const l of o.quote.lines)if(l.kind==='rep'&&l.itemId===itemId&&l.state==='reservado')r+=l.qty;}return Math.round(r*1000)/1000;}
let _sm={n:-1,m:null};
function stockMap(){if(_sm.n!==S.moves.length||!_sm.m){const m={};for(const x of S.moves)m[x.itemId]=(m[x.itemId]||0)+x.qty;_sm={n:S.moves.length,m};}return _sm.m;}
function stockOf(itemId){return Math.round((stockMap()[itemId]||0)*1000)/1000;}
function availOf(itemId){return Math.round((stockOf(itemId)-reservedQty(itemId))*1000)/1000;}
function toolOut(itemId){return S.loans.filter(l=>l.itemId===itemId&&!l.returnedAt).length;}
function validateLines(o,lines){
  if(!Array.isArray(lines))fail('Presupuesto inválido.');
  if(lines.length>40)fail('Demasiados renglones (máximo 40).');
  const prev=new Map(o.quote.lines.map(l=>[l.id,l]));const out=[];
  for(const l of lines){
    const kind=l.kind;if(kind!=='mo'&&kind!=='rep')fail('Tipo de renglón inválido.');
    const qty=Number(l.qty);if(!isFinite(qty)||qty<=0)fail('La cantidad de cada renglón tiene que ser mayor a cero.');
    if(kind==='rep'&&!Number.isInteger(qty)&&getItem(l.itemId).unit==='u')fail('Los repuestos por unidad se cotizan en cantidades enteras.');
    const unit=Math.round(Number(l.unitCents));if(!isFinite(unit)||unit<0)fail('El precio de un renglón no es válido.');
    if(unit===0&&o.type!=='garantia')fail('Un renglón no puede tener precio cero (usá la bonificación con motivo).');
    const desc=txt(l.desc,2,120,'La descripción del renglón');
    const old=l.id&&prev.get(l.id);
    let r;
    if(kind==='mo'){const est=Math.max(0,Math.round(Number(l.estMin)||0));r={id:old?old.id:nid('l'),kind,svcId:l.svcId||null,desc,qty,unitCents:unit,estMin:est,costCents:0};}
    else{const it=getItem(l.itemId);if(it.archived)fail('"'+it.name+'" está archivado.');if(it.kind==='herramienta')fail('Una herramienta no se cotiza como repuesto.');
      r={id:old?old.id:nid('l'),kind,itemId:it.id,desc,qty,unitCents:unit,costCents:old?old.costCents:it.costCents,state:old?old.state:'cotizado'};}
    if(old&&old.kind==='rep'&&old.state==='usado'){if(r.itemId!==old.itemId||r.qty!==old.qty)fail('"'+old.desc+'" ya fue usado en la reparación: no se puede cambiar.');}
    out.push(r);
  }
  for(const l of o.quote.lines)if(l.kind==='rep'&&l.state==='usado'&&!out.some(x=>x.id===l.id))fail('"'+l.desc+'" ya fue usado en la reparación: no se puede quitar.');
  return out;
}
function quoteSave(id,d){
  needAny('orders_work','quote_manage');const o=getOrder(id);const q=o.quote;
  if(ST[o.status].terminal||o.status==='listo')fail('La orden ya no admite cambios en el presupuesto.');
  const lines=validateLines(o,d.lines||[]);
  const sub=sum(lines.filter(l=>l.state!=='liberado'),lineAmt);
  const disc=Math.round(d.discountCents||0);if(disc<0||isNaN(disc))fail('La bonificación no es válida.');
  if(disc!==(q.discountCents||0))need('discount');
  if(disc>sub)fail('La bonificación no puede superar el subtotal.');
  const reason=String(d.discountReason||'').trim().slice(0,120);if(disc>0&&reason.length<3)fail('La bonificación necesita un motivo.');
  const was=q.status;
  q.lines=lines;q.discountCents=disc;q.discountReason=disc>0?reason:'';
  if(was==='aprobado'||was==='enviado'||was==='rechazado'){if(o.type!=='garantia'){q.status='borrador';q.rev++;q.approvedAt=null;q.approvedBy=null;q.approvedVia=null;hist(o,'presupuesto','Presupuesto modificado: vuelve a borrador (hay que enviarlo y aprobarlo otra vez).');}}
  else hist(o,'presupuesto','Presupuesto guardado ('+lines.length+' renglones, '+fmt(quoteTotals(o).total)+')');
  if(o.type==='garantia'){q.status='aprobado';for(const l of q.lines)if(l.kind==='rep'&&l.state==='cotizado')l.state='reservado';}
  audit('PRESUPUESTO_GUARDADO',otCode(o)+' '+fmt(quoteTotals(o).total));emitChange();
}
function quoteSend(id,{validDays}={}){
  needAny('orders_work','quote_manage');const o=getOrder(id);const q=o.quote;
  if(o.type==='garantia')fail('Las garantías no llevan presupuesto para el cliente.');
  if(!q.lines.some(l=>l.state!=='liberado'))fail('Cargá al menos un renglón antes de enviar el presupuesto.');
  if(q.status==='aprobado')fail('El presupuesto ya está aprobado.');
  const t=quoteTotals(o);if(t.total<=0)fail('El total del presupuesto tiene que ser mayor a cero.');
  if(['diagnostico','pendiente'].includes(o.status)&&String(o.diag.text||'').trim().length<10)fail('Antes de enviar el presupuesto escribí el diagnóstico (mínimo 10 caracteres).');
  const days=clamp(Math.round(validDays||S.cfg.quoteValidDays),1,60);
  q.status='enviado';q.sentAt=now();q.validUntil=now()+days*DAY;
  if(['pendiente','diagnostico'].includes(o.status)){stopAllTimers(o,'presupuesto enviado');o.status='aprobacion';o.stateSince=now();hist(o,'estado','Pasa a Esperando aprobación.');}
  hist(o,'presupuesto','Presupuesto enviado: '+fmt(t.total)+' (vence '+fdate(q.validUntil)+').');audit('PRESUPUESTO_ENVIADO',otCode(o)+' '+fmt(t.total));emitChange();
}
function quoteApprove(id,{via,by}){
  need('quote_manage');const o=getOrder(id);const q=o.quote;
  if(ST[o.status].terminal||o.status==='listo')fail('La orden ya no admite aprobación.');
  if(q.status==='aprobado')fail('El presupuesto ya estaba aprobado.');
  if(!q.lines.some(l=>l.state!=='liberado'))fail('El presupuesto está vacío.');
  if(!['presencial','whatsapp','telefono','correo'].includes(via))fail('Indicá cómo aprobó el cliente.');
  const who=txt(by,2,80,'Quién aprobó');
  if(q.validUntil&&q.validUntil<now()&&q.status==='enviado')fail('El presupuesto venció el '+fdate(q.validUntil)+'. Actualizalo y reenvialo.');
  q.status='aprobado';q.approvedAt=now();q.approvedBy=who;q.approvedVia=via;
  const short=[];
  for(const l of q.lines)if(l.kind==='rep'&&l.state==='cotizado'){l.state='reservado';}
  for(const l of q.lines)if(l.kind==='rep'&&l.state==='reservado'){const it=getItem(l.itemId);const av=availOf(it.id);if(av<0){short.push({it,falta:Math.min(l.qty,-av)});}}
  for(const s of short){const exists=S.reqs.some(r=>r.orderId===o.id&&r.itemId===s.it.id&&r.status==='pendiente');if(!exists)reqCreate({orderId:o.id,itemId:s.it.id,qty:s.falta,desc:'Faltan '+fq(s.falta)+' de "'+s.it.name+'" para '+otCode(o),auto:true});}
  hist(o,'presupuesto','Presupuesto aprobado por '+who+' ('+via+'): '+fmt(quoteTotals(o).total)+'.');
  if(['diagnostico','aprobacion','pendiente'].includes(o.status)){o.status='proceso';o.stateSince=now();hist(o,'estado','Pasa a En proceso.');}
  audit('PRESUPUESTO_APROBADO',otCode(o)+' '+fmt(quoteTotals(o).total)+' '+via);
  notify('presupuesto_aprobado',{title:'Presupuesto aprobado: '+otCode(o),body:fmt(quoteTotals(o).total)+(short.length?' · faltan repuestos':''),ref:{type:'order',id:o.id},assignee:o.techId});
  emitChange();return {short};
}
function quoteReject(id,{reason,chargeDiag}){
  need('quote_manage');const o=getOrder(id);const q=o.quote;
  if(ST[o.status].terminal||o.status==='listo')fail('La orden ya no admite este cambio.');
  if(q.status!=='enviado'&&q.status!=='borrador')fail('Sólo se rechaza un presupuesto pendiente.');
  const why=txt(reason,3,200,'El motivo del rechazo');
  for(const l of q.lines)if(l.kind==='rep'&&l.state==='usado')fail('Hay repuestos ya usados: no se puede cerrar sin reparar.');
  for(const l of q.lines)if(l.kind==='rep'&&l.state==='reservado')l.state='liberado';
  q.status='rechazado';q.rejectedAt=now();q.rejectReason=why;
  if(chargeDiag){const svc=S.services.find(s=>s.id==='svc-diag');const unit=svc?svc.priceCents:$p(10000);q.rejectedLines=q.lines;q.lines=[{id:nid('l'),kind:'mo',svcId:svc?svc.id:null,desc:'Diagnóstico técnico (sin reparación)',qty:1,unitCents:unit,estMin:svc?svc.estMin:45,costCents:0}];q.discountCents=0;q.discountReason='';}
  else{q.rejectedLines=q.lines;q.lines=[];q.discountCents=0;q.discountReason='';o.outcome='cortesia';}
  stopAllTimers(o,'presupuesto rechazado');
  o.outcome=chargeDiag?'sin_reparacion':'cortesia';
  o.status='listo';o.stateSince=now();o.dates.ready=now();
  hist(o,'presupuesto','Presupuesto rechazado ('+why+'). Equipo listo para devolver sin reparar'+(chargeDiag?' (se cobra el diagnóstico: '+fmt(quoteTotals(o).total)+')':' (sin cargo)')+'.');
  audit('PRESUPUESTO_RECHAZADO',otCode(o)+' '+why);
  notify('presupuesto_rechazado',{title:'Presupuesto rechazado: '+otCode(o),body:why,ref:{type:'order',id:o.id},assignee:o.techId});
  emitChange();
}
function partUse(id,lineId){
  need('orders_work');const o=getOrder(id);const l=o.quote.lines.find(x=>x.id===lineId);if(!l||l.kind!=='rep')fail('El repuesto no existe en esta orden.');
  if(!['proceso','prueba'].includes(o.status))fail('Los repuestos se usan cuando la orden está en proceso o en prueba.');
  if(l.state==='usado')fail('Ese repuesto ya fue marcado como usado.');if(l.state==='liberado')fail('Ese repuesto fue liberado.');
  if(o.quote.status!=='aprobado'&&o.type!=='garantia')fail('El presupuesto todavía no está aprobado.');
  const it=getItem(l.itemId);const st=stockOf(it.id);
  if(st<l.qty&&it.requireStock)fail('No hay stock físico de "'+it.name+'": hay '+fq(st)+' y se necesitan '+fq(l.qty)+'. Pedilo desde "Requerimientos".');
  l.state='usado';l.usedBy=SESSION.uid;l.usedAt=now();l.costCents=it.costCents;
  moveAdd(it.id,-l.qty,'consumo',{ref:o.id,reason:'Usado en '+otCode(o),costCents:it.costCents});
  hist(o,'repuesto','Repuesto usado: '+fq(l.qty)+' × '+it.name+(st<l.qty?' (stock quedó en negativo)':''));
  audit(st<l.qty?'REPUESTO_USADO_SIN_STOCK':'REPUESTO_USADO',otCode(o)+' '+it.sku+' ×'+l.qty);emitChange();
}
function partRelease(id,lineId,why){
  need('orders_work');const o=getOrder(id);const l=o.quote.lines.find(x=>x.id===lineId);if(!l||l.kind!=='rep')fail('El repuesto no existe.');
  if(l.state==='usado')fail('Ya se usó: no se puede liberar.');if(l.state==='liberado')return;
  txt(why,3,120,'El motivo');
  l.state='liberado';hist(o,'repuesto','Repuesto no utilizado (se descuenta del total): '+l.desc+' — '+why);audit('REPUESTO_LIBERADO',otCode(o)+' '+l.desc);emitChange();
}

/* ---------------- cambios de estado (reglas en un solo lugar) ---------------- */
function orderMove(id,to,o2={}){
  const o=getOrder(id);const from=o.status;if(from===to)return;
  if(!ST[to])fail('Estado desconocido.');
  if(ST[from].terminal)fail('La orden está '+ST[from].name.toLowerCase()+' y no admite más cambios.');
  const fi=ST_FLOW.indexOf(from),ti=ST_FLOW.indexOf(to);const forward=ti>fi;
  if(to==='entregado')need('deliver');else if(to==='cancelado')need('orders_cancel');
  else if(!forward){if(from==='prueba'&&to==='proceso')need('orders_work');else need('orders_back');}
  else need('orders_work');
  const why=String(o2.reason||'').trim();
  if(!forward&&to!=='cancelado'&&why.length<3)fail('Indicá el motivo del retroceso.');
  const q=o.quote;
  const needTech=()=>{if(!o.techId){const u=curUser();if(u&&u.role==='tecnico'){o.techId=u.id;hist(o,'asignacion','Tomada por '+u.name);}else fail('Asigná un técnico a la orden antes de continuar.');}};
  switch(to){
    case 'diagnostico':needTech();break;
    case 'aprobacion':
      if(o.type==='garantia')fail('Las garantías no necesitan aprobación del cliente.');
      if(String(o.diag.text||'').trim().length<10)fail('Escribí el diagnóstico antes de pedir la aprobación.');
      if(!q.lines.some(l=>l.state!=='liberado'))fail('Armá el presupuesto antes de pedir la aprobación.');
      if(q.status==='borrador'||q.status==='rechazado'){if(from==='proceso'||from==='prueba'){q.status='enviado';q.sentAt=now();q.validUntil=now()+S.cfg.quoteValidDays*DAY;}else{quoteSend(id);return;}}
      stopAllTimers(o,'espera aprobación');break;
    case 'proceso':needTech();
      if(q.status!=='aprobado'&&o.type!=='garantia')fail('El presupuesto todavía no está aprobado por el cliente.');
      if(from==='listo')fail('No se vuelve de "Listo" a "En proceso" desde acá.');
      break;
    case 'prueba':{
      needTech();const pend=o.tasks.filter(t=>!t.done);if(pend.length)fail('Hay '+pend.length+' tarea'+(pend.length>1?'s':'')+' sin terminar: '+pend.map(t=>t.text).slice(0,3).join(', ')+'.');
      if(q.status!=='aprobado'&&o.type!=='garantia')fail('El presupuesto no está aprobado.');
      stopAllTimers(o,'pasa a prueba');break;}
    case 'listo':{
      if(o.outcome==='sin_reparacion'||o.outcome==='cortesia'){stopAllTimers(o);break;}
      if(from!=='prueba')fail('Primero la orden tiene que pasar por la etapa de prueba.');
      const bad=o.tests.filter(t=>!t.ok);if(bad.length)fail('Faltan '+bad.length+' prueba'+(bad.length>1?'s':'')+' de calidad: '+bad.map(t=>t.text).slice(0,3).join(', ')+'.');
      const res=q.lines.filter(l=>l.kind==='rep'&&l.state==='reservado');if(res.length)fail('Hay repuestos reservados sin usar: marcalos como usados o liberalos ('+res.map(l=>l.desc).slice(0,2).join(', ')+').');
      if(q.status!=='aprobado'&&o.type!=='garantia')fail('Hay cambios en el presupuesto sin aprobar.');
      stopAllTimers(o,'listo');o.outcome='reparado';break;}
    case 'entregado':return orderDeliver(id,o2);
    case 'cancelado':{
      txt(why,3,200,'El motivo de la cancelación');
      const op=orderPay(o);if(op.paid+op.cc+op.pend!==0)fail('La orden tiene cobros registrados ('+fmt(op.paid+op.cc+op.pend)+'): registrá primero el reintegro o anulá el cobro.');
      for(const l of q.lines)if(l.kind==='rep'&&l.state==='reservado')l.state='liberado';
      if(q.lines.some(l=>l.state==='usado'))fail('Ya se usaron repuestos: no se puede cancelar. Cerrala como "sin reparar" desde el presupuesto.');
      stopAllTimers(o,'cancelada');o.cancelReason=why;break;}
  }
  o.status=to;o.stateSince=now();
  if(to==='listo'){o.dates.ready=now();}
  hist(o,'estado',ST[from].name+' → '+ST[to].name+(why?' ('+why+')':''));
  audit('ORDEN_ESTADO',otCode(o)+' '+from+'→'+to+(why?' '+why:''));
  if(to==='listo'){notify('listo',{title:'Listo para retirar: '+otCode(o),body:devLabel(orderDev(o))+' · '+clientName(o.clientId)+' · saldo '+fmt(Math.max(0,orderPay(o).due)),ref:{type:'order',id:o.id},assignee:o.techId});}
  else notify('estado_cambio',{title:otCode(o)+' → '+ST[to].name,body:devLabel(orderDev(o))+' · '+clientName(o.clientId),ref:{type:'order',id:o.id},assignee:o.techId,key:null});
  emitChange();
}
function orderDeliver(id,{note}={}){
  need('deliver');const o=getOrder(id);
  if(o.status!=='listo')fail('Sólo se entrega un equipo que está "Listo para retirar".');
  const op=orderPay(o);
  if(op.pend>0)fail('Hay un cobro digital sin verificar ('+fmt(op.pend)+'). Verificá la acreditación antes de entregar.');
  if(op.due>0)fail('Falta cobrar '+fmt(op.due)+' antes de entregar el equipo.');
  if(op.due<0)fail('El cliente tiene un saldo a favor de '+fmt(-op.due)+': registrá el reintegro antes de entregar.');
  o.status='entregado';o.stateSince=now();o.dates.delivered=now();
  let days=0;if(o.outcome==='reparado'&&o.type!=='garantia'){days=S.cfg.warrantyDays;for(const l of o.quote.lines){if(l.kind==='mo'&&l.svcId&&l.state!=='liberado'){const sv=S.services.find(s=>s.id===l.svcId);if(sv&&sv.warrantyDays>days)days=sv.warrantyDays;}}}
  o.warrantyUntil=days?now()+days*DAY:null;
  let stamp=false;const c=getClient(o.clientId);
  if(S.cfg.loyalty.on&&c&&!c.anon&&c.consent.care&&o.outcome==='reparado'&&o.type!=='garantia'&&quoteTotals(o).total>=S.cfg.loyalty.minCents){stampAdd(c.id,1,'Entrega '+otCode(o));stamp=true;}
  hist(o,'estado','Entregado al cliente'+(note?': '+String(note).slice(0,120):'')+(days?'. Garantía hasta '+fdate(o.warrantyUntil):''));
  audit('ORDEN_ENTREGADA',otCode(o)+' '+fmt(quoteTotals(o).total));
  notify('estado_cambio',{title:otCode(o)+' entregada',body:devLabel(orderDev(o))+' · '+clientName(o.clientId),ref:{type:'order',id:o.id}});
  emitChange();return {days,stamp};
}

/* ---------------- fidelización (sellos) ---------------- */
function stampsOf(cid){return S.stamps.filter(s=>s.clientId===cid).reduce((a,s)=>a+s.qty,0);}
function stampAdd(cid,qty,ref){S.stamps.push({id:nid('s'),clientId:cid,ts:now(),qty,ref,uid:SESSION.uid});}
function stampRedeem(cid){need('clients_edit');const c=getClient(cid);if(!c||c.anon)fail('Cliente inexistente.');const g=S.cfg.loyalty.goal;if(stampsOf(cid)<g)fail('Al cliente le faltan '+(g-stampsOf(cid))+' sellos para el premio.');stampAdd(cid,-g,'Canje: '+S.cfg.loyalty.prize);audit('SELLOS_CANJE',c.id+' '+S.cfg.loyalty.prize);emitChange();}

/* ---------------- requerimientos técnicos ---------------- */
function reqCreate(d){
  const auto=!!d.auto;if(!auto)need('request');
  const desc=txt(d.desc,3,200,'El detalle del pedido');const qty=d.qty==null?1:Number(d.qty);if(!isFinite(qty)||qty<=0)fail('La cantidad tiene que ser mayor a cero.');
  if(d.itemId)getItem(d.itemId);if(d.orderId)getOrder(d.orderId);
  const r={id:nid('r'),n:++S.seq.req,ts:now(),uid:SESSION.uid||'sistema',orderId:d.orderId||null,itemId:d.itemId||null,qty,desc,status:'pendiente',auto};
  S.reqs.push(r);audit('REQUERIMIENTO',desc);
  notify('requerimiento',{title:'Requerimiento técnico #'+r.n,body:desc,ref:{type:'req',id:r.id},key:null});
  emitChange();return r;
}
function reqStatus(id,st){needAny('purchases','inventory_edit');const r=S.reqs.find(x=>x.id===id);if(!r)fail('El pedido no existe.');if(!['pendiente','en_pedido','atendido','descartado'].includes(st))fail('Estado inválido.');r.status=st;r.closedAt=['atendido','descartado'].includes(st)?now():null;audit('REQUERIMIENTO_ESTADO','#'+r.n+' '+st);emitChange();}

/* ---------------- inventario ---------------- */
function moveAdd(itemId,qty,type,o={}){
  const before=stockOf(itemId);
  S.moves.push({id:nid('m'),itemId,ts:now(),qty,type,ref:o.ref||null,reason:o.reason||'',uid:SESSION.uid||'sistema',costCents:o.costCents==null?null:o.costCents});
  const after=Math.round((before+qty)*1000)/1000;const it=itemById(itemId);
  if(it&&qty<0&&it.min>0&&before>it.min&&after<=it.min)notify('stock_bajo',{title:'Stock bajo: '+it.name,body:'Quedan '+fq(after)+' (mínimo '+fq(it.min)+')',ref:{type:'item',id:itemId},key:'low:'+itemId+':'+dayKey(now())});
  return after;
}
const ITEM_KINDS={repuesto:'Repuesto',insumo:'Insumo',accesorio:'Accesorio (venta)',herramienta:'Herramienta'};
function itemSave(d){
  need('inventory_edit');
  const name=txt(d.name,2,100,'El nombre');const sku=txt(d.sku,2,30,'El código');
  if(S.items.some(i=>i.id!==d.id&&i.sku.toLowerCase()===sku.toLowerCase()))fail('Ya existe un artículo con el código "'+sku+'".');
  if(!ITEM_KINDS[d.kind])fail('Elegí el tipo de artículo.');
  if(!S.cats.some(c=>c.id===d.catId))fail('Elegí un rubro.');
  const cost=Math.round(d.costCents||0),price=Math.round(d.priceCents||0);if(isNaN(cost)||cost<0||isNaN(price)||price<0)fail('Costo y precio tienen que ser números positivos.');
  if(d.kind!=='herramienta'&&price===0&&d.kind!=='insumo')fail('Cargá el precio de venta.');
  const min=Number(d.min||0);if(isNaN(min)||min<0)fail('El mínimo no es válido.');
  if(d.supplierId&&!S.suppliers.some(s=>s.id===d.supplierId))fail('El proveedor no existe.');
  const toolQty=d.kind==='herramienta'?Math.round(Number(d.toolQty)||0):0;if(d.kind==='herramienta'&&toolQty<1)fail('Indicá cuántas unidades de la herramienta tenés.');
  const requireStock=d.kind==='herramienta'?false:!!d.requireStock;
  let it;
  if(d.id){it=getItem(d.id);const oc=it.costCents;
    if(d.kind==='herramienta'&&toolQty<toolOut(it.id))fail('Hay '+toolOut(it.id)+' unidades prestadas: no podés dejar menos.');
    Object.assign(it,{name,sku,kind:d.kind,catId:d.catId,costCents:cost,priceCents:price,min,loc:String(d.loc||'').slice(0,40),supplierId:d.supplierId||null,requireStock,sellable:d.kind==='accesorio'||!!d.sellable,toolQty,unit:d.unit==='lt'?'lt':'u'});
    audit('ARTICULO_EDITADO',it.sku+(oc!==cost?' costo '+fmt(oc)+'→'+fmt(cost):''));
  }else{
    it={id:nid('i'),sku,name,kind:d.kind,catId:d.catId,costCents:cost,priceCents:price,min,loc:String(d.loc||'').slice(0,40),supplierId:d.supplierId||null,requireStock,sellable:d.kind==='accesorio'||!!d.sellable,archived:false,toolQty,unit:d.unit==='lt'?'lt':'u',createdAt:now()};
    S.items.push(it);
    const ini=Number(d.initial||0);if(d.kind!=='herramienta'&&ini>0)moveAdd(it.id,ini,'inicial',{reason:'Stock inicial'});
    audit('ARTICULO_NUEVO',it.sku+' '+it.name);
  }
  emitChange();return it;
}
function stockAdjust(itemId,newQty,reason){
  need('inventory_edit');const it=getItem(itemId);if(it.kind==='herramienta')fail('Las herramientas se gestionan por préstamo.');
  const why=txt(reason,3,120,'El motivo del ajuste');const q=Number(newQty);if(!isFinite(q))fail('Escribí la cantidad.');
  if(q<0&&it.requireStock)fail('"'+it.name+'" exige stock: no puede quedar en negativo.');
  const cur=stockOf(itemId);const delta=Math.round((q-cur)*1000)/1000;if(delta===0)fail('La cantidad es la misma que ya hay.');
  if(q<reservedQty(itemId)&&it.requireStock&&q>=0){/* se permite, pero se avisa en pantalla */}
  moveAdd(itemId,delta,'ajuste',{reason:why});audit('STOCK_AJUSTE',it.sku+' '+fq(cur)+'→'+fq(q)+' ('+why+')');emitChange();
}
function itemHasHistory(id){return S.moves.some(m=>m.itemId===id&&m.type!=='inicial')||S.orders.some(o=>o.quote.lines.some(l=>l.itemId===id))||S.pos.some(p=>p.lines.some(l=>l.itemId===id))||S.receipts.some(r=>r.lines.some(l=>l.itemId===id))||S.sales.some(s=>s.items.some(l=>l.itemId===id))||S.loans.some(l=>l.itemId===id);}
function itemRemove(id,{confirm,reason}={}){
  need('inventory_delete');const it=getItem(id);
  if(confirm!=='ELIMINAR')fail('Para continuar escribí ELIMINAR.');txt(reason,3,120,'El motivo');
  if(itemHasHistory(id)){it.archived=true;audit('ARTICULO_ARCHIVADO',it.sku+' '+reason);emitChange();return 'archivado';}
  if(stockOf(id)>0||stockOf(id)<0)fail('El artículo tiene stock ('+fq(stockOf(id))+'): ajustalo a cero antes de eliminarlo.');
  S.items=S.items.filter(i=>i.id!==id);S.moves=S.moves.filter(m=>m.itemId!==id);audit('ARTICULO_ELIMINADO',it.sku+' '+reason);emitChange();return 'eliminado';
}
function itemRestore(id){need('inventory_delete');const it=getItem(id);it.archived=false;audit('ARTICULO_RESTAURADO',it.sku);emitChange();}
function toolLoan(itemId,techId){
  need('tools');const it=getItem(itemId);if(it.kind!=='herramienta')fail('No es una herramienta.');
  const u=curUser();const tech=u.role==='tecnico'?u.id:techId;if(!tech||!userById(tech))fail('Elegí el técnico que se la lleva.');
  if(toolOut(itemId)>=it.toolQty)fail('No quedan unidades disponibles de "'+it.name+'".');
  S.loans.push({id:nid('ln'),itemId,techId:tech,ts:now(),returnedAt:null});audit('HERRAMIENTA_PRESTADA',it.sku+' → '+userName(tech));emitChange();
}
function toolReturn(loanId){need('tools');const l=S.loans.find(x=>x.id===loanId);if(!l||l.returnedAt)fail('El préstamo no existe o ya se devolvió.');const u=curUser();if(u.role==='tecnico'&&l.techId!==u.id)fail('Sólo podés devolver tus herramientas.');l.returnedAt=now();audit('HERRAMIENTA_DEVUELTA',getItem(l.itemId).sku);emitChange();}
function catSave(d){need('inventory_edit');const name=txt(d.name,2,40,'El nombre del rubro');if(S.cats.some(c=>c.id!==d.id&&c.name.toLowerCase()===name.toLowerCase()))fail('Ya existe un rubro con ese nombre.');if(!COLORS_OK.test(d.color||''))fail('El color tiene que ser #RRGGBB.');if(d.id){const c=S.cats.find(x=>x.id===d.id);Object.assign(c,{name,color:d.color});}else S.cats.push({id:nid('ct'),name,color:d.color});audit('RUBRO_INVENTARIO',name);emitChange();}

/* ---------------- cobros (pagos mixtos, vuelto, cuenta corriente parcial) ---------------- */
function paymentsOfOrder(o){return S.payments.filter(p=>p.kind==='orden'&&p.refId===o.id&&!p.voidedAt);}
function orderPay(o){
  const total=quoteTotals(o).total;let paid=0,cc=0,pend=0,cashIn=0;
  for(const p of paymentsOfOrder(o))for(const l of p.lines){if(l.m==='cc')cc+=l.a;else if(l.verified)paid+=l.a;else pend+=l.a;}
  const due=total-paid-cc-pend;
  let state='pendiente';if(total===0)state='sin_cargo';else if(due<=0&&pend===0)state=cc>0?'cuenta_corriente':'pagada';else if(paid+cc+pend>0)state='parcial';
  return {total,paid,cc,pend,due,state};
}
const PAY_STATE={pendiente:['Pendiente de cobro','bad'],parcial:['Pago parcial','warn'],pagada:['Pagada','ok'],cuenta_corriente:['A cuenta corriente','info'],sin_cargo:['Sin cargo','']};
function ccBalance(cid){let b=0;for(const p of S.payments){if(p.voidedAt||p.clientId!==cid)continue;for(const l of p.lines){if(l.m==='cc')b+=l.a;}if(p.kind==='deuda')b-=p.lines.reduce((a,l)=>a+l.a,0);}return b;}
function payCheck(amount,lines,client){
  const r={ok:false,msg:'',sum:0,cc:0,change:0,diff:amount};
  if(!lines.length){r.msg='Elegí al menos un medio de pago.';return r;}
  const seen=new Set();
  for(const l of lines){
    if(!METHODS[l.m]){r.msg='Medio de pago inválido.';return r;}
    if(seen.has(l.m)){r.msg='No repitas el medio "'+METHODS[l.m]+'".';return r;}seen.add(l.m);
    if(!Number.isInteger(l.a)||l.a<=0){r.msg='Cada medio tiene que tener un importe mayor a cero.';return r;}
    r.sum+=l.a;if(l.m==='cc')r.cc+=l.a;
  }
  if(seen.has('qr')&&lines.length>1){r.msg='El QR / billetera no se combina con otro medio.';return r;}
  if(seen.has('cc')){
    if(!client||client.anon){r.msg='La cuenta corriente necesita un cliente identificado.';return r;}
    const av=client.ccLimitCents-ccBalance(client.id);
    if(r.cc>av){r.msg='Supera el límite de cuenta corriente de '+client.name+' (disponible '+fmt(Math.max(0,av))+').';return r;}
  }
  const ef=lines.find(l=>l.m==='efectivo');
  if(ef&&ef.recibido!=null&&ef.recibido!==''){if(!Number.isInteger(ef.recibido)||ef.recibido<ef.a){r.msg='El efectivo recibido ('+fmt(ef.recibido)+') es menor que lo imputado ('+fmt(ef.a)+').';return r;}r.change=ef.recibido-ef.a;}
  r.diff=amount-r.sum;
  if(r.diff>0){r.msg='Faltan '+fmt(r.diff);return r;}
  if(r.diff<0){r.msg='Sobran '+fmt(-r.diff);return r;}
  r.ok=true;return r;
}
function needOpenCash(){const s=openSession();if(!s)fail('La caja está cerrada. Abrila para poder cobrar.');return s;}
function openSession(){return S.cash.sessions.find(s=>s.status==='abierta')||null;}
const rubroByName=n=>S.rubros.find(r=>r.name===n);
function cashRecord(sess,type,method,amount,rubroName,ref,desc){
  const ru=rubroByName(rubroName);if(!ru)fail('Falta el rubro financiero "'+rubroName+'".');
  S.cash.moves.push({id:nid('cm'),sessionId:sess.id,ts:now(),type,method,amountCents:amount,rubroId:ru.id,ref:ref||null,desc:desc||'',uid:SESSION.uid||'sistema'});
}
function paymentCreate(d){
  need('payments');
  if(d.key){const ex=S.payments.find(p=>p.key===d.key);if(ex)return ex;}
  const sess=needOpenCash();
  const kind=d.kind;let client=null,amountMax=0,ref=d.refId,rubro='Reparaciones y servicios',desc='';
  if(kind==='orden'){const o=getOrder(d.refId);if(ST[o.status].terminal)fail('La orden ya está cerrada.');client=getClient(o.clientId);const op=orderPay(o);if(op.total<=0)fail('La orden no tiene importe a cobrar.');amountMax=op.due;if(amountMax<=0)fail('La orden no tiene saldo pendiente.');desc=otCode(o);}
  else if(kind==='deuda'){client=getClient(d.clientId);if(!client||client.anon)fail('Elegí un cliente.');amountMax=ccBalance(client.id);if(amountMax<=0)fail('El cliente no tiene deuda.');rubro='Cobro de cuenta corriente';desc='Cobro de deuda';ref=client.id;}
  else if(kind==='mostrador'){const s=S.sales.find(x=>x.id===d.refId);if(!s)fail('La venta no existe.');client=s.clientId?getClient(s.clientId):null;amountMax=s.totalCents;rubro='Ventas de mostrador';desc='Venta '+s.n;}
  else fail('Tipo de cobro inválido.');
  const amount=Math.round(d.amountCents==null?amountMax:d.amountCents);
  if(!Number.isInteger(amount)||amount<=0)fail('Escribí el importe a cobrar.');
  if(amount>amountMax)fail('No se puede cobrar más que el saldo ('+fmt(amountMax)+').');
  if(kind==='mostrador'&&amount!==amountMax)fail('La venta de mostrador se cobra completa.');
  if(kind==='deuda'&&d.lines.some(l=>l.m==='cc'))fail('Una deuda no se paga con cuenta corriente.');
  const chk=payCheck(amount,d.lines.map(l=>({...l})),client);if(!chk.ok)fail(chk.msg);
  if(d.key&&S.payments.some(p=>p.key===d.key))return S.payments.find(p=>p.key===d.key);
  const lines=d.lines.map(l=>({m:l.m,a:l.a,verified:!DIGITAL.includes(l.m),ref:String(l.ref||'').slice(0,40),recibido:l.m==='efectivo'&&l.recibido?l.recibido:null,change:l.m==='efectivo'&&l.recibido?l.recibido-l.a:0}));
  const p={id:nid('p'),n:++S.seq.pay,ts:now(),kind,refId:ref,clientId:client?client.id:null,sessionId:sess.id,uid:SESSION.uid,amountCents:amount,lines,ccCents:chk.cc,key:d.key||null,voidedAt:null,status:lines.some(l=>!l.verified)?'pendiente':'ok'};
  S.payments.push(p);
  for(const l of lines){if(l.m==='cc')continue;cashRecord(sess,'cobro',l.m,l.a,rubro,p.id,desc);}
  if(kind==='orden'){const o=getOrder(ref);hist(o,'cobro','Cobro '+fmt(amount)+' ('+lines.map(l=>METHODS[l.m]).join(' + ')+')'+(lines.some(l=>!l.verified)?' · pendiente de verificar':''));}
  audit('COBRO',desc+' '+fmt(amount)+' '+lines.map(l=>l.m+':'+l.a).join(','));
  if(lines.some(l=>!l.verified))notify('cobro_pendiente',{title:'Cobro digital por verificar',body:desc+' · '+fmt(sum(lines.filter(l=>!l.verified),l=>l.a)),ref:{type:'pay',id:p.id},key:'pend:'+p.id});
  emitChange();return p;
}
function paymentVerify(id,ref){
  need('verify_pay');const p=S.payments.find(x=>x.id===id);if(!p||p.voidedAt)fail('El cobro no existe o fue anulado.');
  let n=0;for(const l of p.lines)if(!l.verified){l.verified=true;l.verifiedAt=now();l.verifiedBy=SESSION.uid;if(ref)l.ref=String(ref).slice(0,40);n++;}
  if(!n)fail('El cobro ya estaba verificado.');p.status='ok';audit('COBRO_VERIFICADO','#'+p.n);
  if(p.kind==='orden'){const o=getOrder(p.refId);hist(o,'cobro','Acreditación verificada ('+fmt(p.amountCents)+')');}
  emitChange();
}
function paymentVoid(id,reason){
  need('void_pay');const p=S.payments.find(x=>x.id===id);if(!p||p.voidedAt)fail('El cobro no existe o ya fue anulado.');
  const why=txt(reason,3,120,'El motivo de la anulación');
  const sess=needOpenCash();
  if(p.kind==='orden'){const o=getOrder(p.refId);if(o.status==='entregado'||o.status==='cancelado')fail('La orden ya está cerrada: no se anula el cobro.');}
  if(p.kind==='deuda'){/* revierte el crédito del cliente */}
  p.voidedAt=now();p.voidReason=why;p.voidBy=SESSION.uid;
  for(const l of p.lines){if(l.m==='cc'||!l.verified)continue;cashRecord(sess,'anulacion',l.m,-l.a,p.kind==='deuda'?'Cobro de cuenta corriente':p.kind==='mostrador'?'Ventas de mostrador':'Reparaciones y servicios',p.id,'Anulación cobro #'+p.n);}
  if(p.kind==='mostrador'){const s=S.sales.find(x=>x.id===p.refId);if(s){s.status='anulada';for(const it of s.items)moveAdd(it.itemId,it.qty,'devolucion',{ref:s.id,reason:'Anulación venta '+s.n});}}
  if(p.kind==='orden'){hist(getOrder(p.refId),'cobro','Cobro anulado ('+fmt(p.amountCents)+'): '+why);}
  audit('COBRO_ANULADO','#'+p.n+' '+why);emitChange();
}
function refundCreate({orderId,amountCents,method,reason}){
  need('void_pay');const sess=needOpenCash();const o=getOrder(orderId);const op=orderPay(o);
  const a=Math.round(amountCents);if(!Number.isInteger(a)||a<=0)fail('Escribí el importe a reintegrar.');
  if(!['efectivo','transferencia','debito','credito'].includes(method))fail('Elegí el medio del reintegro.');
  if(a>op.paid)fail('No se puede reintegrar más de lo cobrado ('+fmt(op.paid)+').');
  const why=txt(reason,3,120,'El motivo del reintegro');
  const p={id:nid('p'),n:++S.seq.pay,ts:now(),kind:'orden',refId:o.id,clientId:o.clientId,sessionId:sess.id,uid:SESSION.uid,amountCents:-a,lines:[{m:method,a:-a,verified:true,ref:'Reintegro',recibido:null,change:0}],ccCents:0,key:null,voidedAt:null,status:'ok',refund:true,reason:why};
  S.payments.push(p);cashRecord(sess,'reintegro',method,-a,'Reintegros a clientes',p.id,otCode(o)+': '+why);
  hist(o,'cobro','Reintegro de '+fmt(a)+' ('+METHODS[method]+'): '+why);audit('REINTEGRO',otCode(o)+' '+fmt(a));emitChange();
}

/* ---------------- venta de mostrador ---------------- */
function saleCreate({items,clientId,lines,key}){
  need('payments');const sess=needOpenCash();
  if(!items||!items.length)fail('Agregá al menos un artículo.');
  if(key&&S.sales.some(s=>s.key===key))return S.sales.find(s=>s.key===key);
  const rows=[];let total=0;
  for(const r of items){const it=getItem(r.itemId);if(it.archived||!it.sellable)fail('"'+it.name+'" no se vende en el mostrador.');const q=Number(r.qty);if(!isFinite(q)||q<=0||(!Number.isInteger(q)&&it.unit==='u'))fail('Cantidad inválida de "'+it.name+'".');
    if(it.requireStock&&availOf(it.id)<q)fail('No hay stock suficiente de "'+it.name+'" (disponible '+fq(availOf(it.id))+').');
    rows.push({itemId:it.id,desc:it.name,qty:q,priceCents:it.priceCents,costCents:it.costCents});total+=Math.round(q*it.priceCents);}
  const client=clientId?getClient(clientId):null;
  const chk=payCheck(total,lines.map(l=>({...l})),client);if(!chk.ok)fail(chk.msg);
  const s={id:nid('s'),n:++S.seq.sale,ts:now(),items:rows,totalCents:total,clientId:client?client.id:null,uid:SESSION.uid,key:key||null,status:'ok'};
  S.sales.push(s);
  for(const r of rows)moveAdd(r.itemId,-r.qty,'venta',{ref:s.id,reason:'Venta '+s.n,costCents:r.costCents});
  const p=paymentCreate({kind:'mostrador',refId:s.id,lines,amountCents:total});
  s.paymentId=p.id;audit('VENTA_MOSTRADOR','#'+s.n+' '+fmt(total));emitChange();return s;
}

/* ---------------- caja ---------------- */
function cashOpen(fondoCents){
  need('cash');if(openSession())fail('Ya hay una caja abierta.');
  const f=Math.round(fondoCents||0);if(!Number.isInteger(f)||f<0)fail('El fondo inicial no es válido.');
  const s={id:nid('cs'),n:++S.seq.cash,openedAt:now(),openedBy:SESSION.uid,fondoCents:f,status:'abierta',closedAt:null};
  S.cash.sessions.push(s);audit('CAJA_ABIERTA','#'+s.n+' fondo '+fmt(f));emitChange();return s;
}
function cashMove({type,amountCents,rubroId,desc}){
  need('cash');const sess=needOpenCash();
  if(!['ingreso','egreso'].includes(type))fail('Tipo de movimiento inválido.');
  const a=Math.round(amountCents);if(!Number.isInteger(a)||a<=0)fail('Escribí un importe mayor a cero.');
  const ru=S.rubros.find(r=>r.id===rubroId);if(!ru)fail('Elegí el rubro: todo movimiento de caja lleva un rubro.');
  if(ru.type!=='ambos'&&ru.type!==type)fail('El rubro "'+ru.name+'" no sirve para un '+type+'.');
  if(ru.sys)fail('Ese rubro lo usa el sistema automáticamente.');
  const d=txt(desc,3,120,'El detalle');
  if(type==='egreso'){const ar=arqueoCalc(sess);if(a>ar.efectivoEsperado)fail('No hay tanto efectivo en la caja (hay '+fmt(ar.efectivoEsperado)+').');}
  S.cash.moves.push({id:nid('cm'),sessionId:sess.id,ts:now(),type,method:'efectivo',amountCents:type==='egreso'?-a:a,rubroId:ru.id,ref:null,desc:d,uid:SESSION.uid});
  audit('CAJA_'+type.toUpperCase(),fmt(a)+' '+ru.name+' '+d);emitChange();
}
function arqueoCalc(sess){
  const mv=S.cash.moves.filter(m=>m.sessionId===sess.id);
  const by={efectivo:0,debito:0,credito:0,transferencia:0,qr:0};let ing=0,egr=0,reint=0,anul=0;
  for(const m of mv){
    if(m.type==='cobro')by[m.method]+=m.amountCents;
    else if(m.type==='reintegro'){reint+=m.amountCents;by[m.method]+=m.amountCents;}
    else if(m.type==='anulacion'){anul+=m.amountCents;by[m.method]+=m.amountCents;}
    else if(m.type==='ingreso')ing+=m.amountCents;
    else if(m.type==='egreso')egr+=m.amountCents;
  }
  const ps=S.payments.filter(p=>p.sessionId===sess.id&&!p.voidedAt);
  return {fondo:sess.fondoCents,porMedio:by,ingresos:ing,egresos:egr,reintegros:reint,anulaciones:anul,
    efectivoEsperado:sess.fondoCents+by.efectivo+ing+egr,
    cobradoReal:sum(Object.values(by),x=>x),
    ccNuevo:sum(ps,p=>p.ccCents||0),vuelto:sum(ps,p=>sum(p.lines,l=>l.change||0)),
    pendienteDigital:sum(ps,p=>sum(p.lines.filter(l=>!l.verified),l=>l.a)),nOps:ps.length};
}
function cashClose({declaredCents,notes}){
  need('cash_close');const sess=needOpenCash();
  const dec=Math.round(declaredCents);if(!Number.isInteger(dec)||dec<0)fail('Escribí el efectivo contado.');
  const ar=arqueoCalc(sess);const diff=dec-ar.efectivoEsperado;const nt=String(notes||'').trim().slice(0,300);
  if(diff!==0&&nt.length<5)fail('Hay una diferencia de '+fmt(diff)+': explicá el motivo en las observaciones.');
  const mv=S.cash.moves.filter(m=>m.sessionId===sess.id);
  const snap={n:sess.n,openedAt:sess.openedAt,openedBy:sess.openedBy,closedAt:now(),closedBy:SESSION.uid,fondo:ar.fondo,porMedio:ar.porMedio,ingresos:ar.ingresos,egresos:ar.egresos,reintegros:ar.reintegros,anulaciones:ar.anulaciones,efectivoEsperado:ar.efectivoEsperado,declarado:dec,diferencia:diff,ccNuevo:ar.ccNuevo,vuelto:ar.vuelto,pendienteDigital:ar.pendienteDigital,operaciones:ar.nOps,movimientos:mv.length,observaciones:nt};
  sess.snapshot=snap;sess.hash=sha256(JSON.stringify(snap));sess.status='cerrada';sess.closedAt=snap.closedAt;sess.notes=[];
  audit('CAJA_CERRADA','#'+sess.n+' dif '+fmt(diff)+' hash '+sess.hash.slice(0,12));
  if(diff!==0)notify('caja_diferencia',{title:'Caja #'+sess.n+' cerrada con diferencia',body:fmt(diff)+(nt?' · '+nt:''),ref:{type:'cash',id:sess.id}});
  emitChange();return sess;
}
function cashSealOk(sess){return !!sess.snapshot&&sha256(JSON.stringify(sess.snapshot))===sess.hash;}
function cashNote(sessId,text){need('cash_close');const s=S.cash.sessions.find(x=>x.id===sessId);if(!s||s.status!=='cerrada')fail('Sólo se agregan notas a una caja cerrada.');s.notes.push({ts:now(),uid:SESSION.uid,text:txt(text,3,200,'La nota')});audit('CAJA_NOTA','#'+s.n);emitChange();}

/* ---------------- proveedores y compras (4.21) ---------------- */
function supplierSave(d){
  need('purchases');const name=txt(d.name,2,100,'La razón social');const cuit=String(d.cuit||'').replace(/\D/g,'');
  if(!cuitOk(cuit))fail('El CUIT no es válido (dígito verificador incorrecto).');
  if(S.suppliers.some(s=>s.id!==d.id&&s.cuit===cuit))fail('Ya existe un proveedor con ese CUIT.');
  const iva=['Responsable Inscripto','Monotributista','Exento'].includes(d.iva)?d.iva:'Responsable Inscripto';
  const email=String(d.email||'').trim();if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('El correo no es válido.');
  let s;if(d.id){s=getSup(d.id);Object.assign(s,{name,cuit,iva,email,phone:String(d.phone||'').slice(0,30),addr:String(d.addr||'').slice(0,100)});audit('PROVEEDOR_EDITADO',name);}
  else{s={id:nid('sp'),name,cuit,iva,email,phone:String(d.phone||'').slice(0,30),addr:String(d.addr||'').slice(0,100),active:true,createdAt:now()};S.suppliers.push(s);audit('PROVEEDOR_NUEVO',name);}
  emitChange();return s;
}
function supplierArchive(id,active){need('purchases');const s=getSup(id);s.active=!!active;audit('PROVEEDOR_'+(active?'ACTIVADO':'ARCHIVADO'),s.name);emitChange();}
function supBalance(id){let b=0;for(const e of S.supLedger)if(e.supplierId===id)b+=e.amountCents;return b;}
function ledgerAdd(supplierId,type,amountCents,o={}){const bal=supBalance(supplierId)+amountCents;S.supLedger.push({id:nid('lg'),supplierId,ts:now(),type,amountCents,saldo:bal,ref:o.ref||'',method:o.method||'',rubroId:o.rubroId||null,motivo:o.motivo||'',uid:SESSION.uid});}
function poSave(d){
  need('purchases');const sup=getSup(d.supplierId);if(!sup.active)fail('El proveedor está archivado.');
  if(!d.lines||!d.lines.length)fail('Agregá al menos un renglón.');
  const lines=d.lines.map(l=>{const it=getItem(l.itemId);const q=Number(l.qty);const c=Math.round(l.costCents);if(!isFinite(q)||q<=0)fail('Cantidad inválida de "'+it.name+'".');if(!Number.isInteger(c)||c<0)fail('Costo inválido de "'+it.name+'".');return {itemId:it.id,qty:q,costCents:c};});
  const st=d.status==='solicitada'?'solicitada':'borrador';
  let po;
  if(d.id){po=S.pos.find(p=>p.id===d.id);if(!po)fail('La orden de compra no existe.');if(po.status!=='borrador')fail('Sólo se edita una orden en borrador.');po.supplierId=sup.id;po.lines=lines;po.status=st;}
  else{po={id:nid('po'),n:++S.seq.po,ts:now(),supplierId:sup.id,lines,status:st,uid:SESSION.uid};S.pos.push(po);}
  po.totalCents=sum(lines,l=>Math.round(l.qty*l.costCents));
  audit('OC_'+st.toUpperCase(),'OC-'+String(po.n).padStart(4,'0')+' '+fmt(po.totalCents));emitChange();return po;
}
function poState(id,to){need('purchases');const po=S.pos.find(p=>p.id===id);if(!po)fail('No existe la orden de compra.');const ok=(po.status==='borrador'&&['solicitada','cancelada'].includes(to))||(po.status==='solicitada'&&to==='cancelada');if(!ok)fail('Esa orden no puede pasar de '+po.status+' a '+to+'.');po.status=to;audit('OC_'+to.toUpperCase(),'OC-'+String(po.n).padStart(4,'0'));emitChange();}
function receiptCreate(d){
  need('purchases');
  if(d.key){const ex=S.receipts.find(r=>r.key===d.key);if(ex)return ex;}
  const sup=getSup(d.supplierId);if(!sup.active)fail('El proveedor está archivado.');
  if(!['Factura','Remito'].includes(d.docType))fail('Elegí Factura o Remito.');
  const docNo=txt(d.docNo,3,30,'El número de comprobante');
  if(S.receipts.some(r=>r.supplierId===sup.id&&r.docType===d.docType&&r.docNo.toLowerCase()===docNo.toLowerCase()))fail('Ya se cargó ese comprobante de este proveedor.');
  if(!d.lines||!d.lines.length)fail('Agregá al menos un renglón recibido.');
  if(d.date>now()+DAY)fail('La fecha del comprobante no puede ser futura.');
  let po=null;if(d.poId){po=S.pos.find(p=>p.id===d.poId);if(!po||po.supplierId!==sup.id||po.status!=='solicitada')fail('La orden de compra no está solicitada o es de otro proveedor.');}
  const lines=d.lines.map(l=>{const it=getItem(l.itemId);const q=Number(l.qty);const c=Math.round(l.costCents);if(!isFinite(q)||q<=0)fail('Cantidad inválida de "'+it.name+'".');if(!Number.isInteger(c)||c<0)fail('Costo inválido de "'+it.name+'".');if(po&&!po.lines.some(x=>x.itemId===it.id))fail('"'+it.name+'" no pertenece a la orden de compra.');return {itemId:it.id,qty:q,costCents:c,prevStock:stockOf(it.id),prevCost:it.costCents};});
  const total=sum(lines,l=>Math.round(l.qty*l.costCents));
  if(Math.round(d.declaredTotalCents)!==total)fail('El total declarado ('+fmt(d.declaredTotalCents)+') no coincide con la suma de renglones ('+fmt(total)+').');
  const cond=d.condition==='contado'?'contado':'cc';
  let sess=null,ru=null;
  if(cond==='contado'){if(!['efectivo','transferencia','debito','credito'].includes(d.method))fail('Elegí el medio de pago.');ru=S.rubros.find(r=>r.id===d.rubroId);if(!ru||(ru.type!=='egreso'&&ru.type!=='ambos')||ru.sys)fail('Elegí un rubro de egreso válido.');
    if(d.method==='efectivo'){sess=needOpenCash();const ar=arqueoCalc(sess);if(total>ar.efectivoEsperado)fail('No hay tanto efectivo en la caja (hay '+fmt(ar.efectivoEsperado)+').');}}
  const r={id:nid('rc'),n:++S.seq.rec,ts:now(),supplierId:sup.id,poId:po?po.id:null,docType:d.docType,docNo,date:d.date,lines,totalCents:total,condition:cond,method:cond==='contado'?d.method:null,rubroId:ru?ru.id:null,uid:SESSION.uid,key:d.key||null};
  S.receipts.push(r);
  for(const l of lines){const it=getItem(l.itemId);moveAdd(it.id,l.qty,'compra',{ref:r.id,reason:d.docType+' '+docNo+' · '+sup.name,costCents:l.costCents});if(l.costCents>0)it.costCents=l.costCents;l.newStock=stockOf(it.id);}
  ledgerAdd(sup.id,d.docType,total,{ref:d.docType+' '+docNo});
  if(cond==='contado'){ledgerAdd(sup.id,'Pago',-total,{ref:'Pago contado '+docNo,method:d.method,rubroId:ru.id});
    if(sess)S.cash.moves.push({id:nid('cm'),sessionId:sess.id,ts:now(),type:'egreso',method:'efectivo',amountCents:-total,rubroId:ru.id,ref:r.id,desc:'Compra '+sup.name+' '+docNo,uid:SESSION.uid});}
  if(po){po.status='recibida';po.receiptId=r.id;}
  for(const q of S.reqs)if(q.itemId&&q.status!=='atendido'&&q.status!=='descartado'&&lines.some(l=>l.itemId===q.itemId)){q.status='atendido';q.closedAt=now();}
  audit('COMPRA_RECIBIDA',sup.name+' '+d.docType+' '+docNo+' '+fmt(total));emitChange();return r;
}
function supplierPay({supplierId,amountCents,method,rubroId,note}){
  need('purchases');const sup=getSup(supplierId);const a=Math.round(amountCents);if(!Number.isInteger(a)||a<=0)fail('Escribí el importe del pago.');
  if(a>supBalance(sup.id))fail('El pago no puede superar la deuda ('+fmt(supBalance(sup.id))+').');
  if(!['efectivo','transferencia','debito','credito'].includes(method))fail('Elegí el medio de pago.');
  const ru=S.rubros.find(r=>r.id===rubroId);if(!ru||(ru.type!=='egreso'&&ru.type!=='ambos')||ru.sys)fail('Elegí un rubro de egreso válido.');
  let sess=null;if(method==='efectivo'){sess=needOpenCash();if(a>arqueoCalc(sess).efectivoEsperado)fail('No hay tanto efectivo en la caja.');}
  ledgerAdd(sup.id,'Pago',-a,{ref:String(note||'Pago a proveedor').slice(0,60),method,rubroId:ru.id});
  if(sess)S.cash.moves.push({id:nid('cm'),sessionId:sess.id,ts:now(),type:'egreso',method:'efectivo',amountCents:-a,rubroId:ru.id,ref:null,desc:'Pago a '+sup.name,uid:SESSION.uid});
  audit('PROVEEDOR_PAGO',sup.name+' '+fmt(a));emitChange();
}
function supplierCredit({supplierId,amountCents,ref}){need('purchases');const sup=getSup(supplierId);const a=Math.round(amountCents);if(!Number.isInteger(a)||a<=0)fail('Escribí el importe.');ledgerAdd(sup.id,'Nota de crédito',-a,{ref:txt(ref,3,60,'La referencia')});audit('PROVEEDOR_NC',sup.name+' '+fmt(a));emitChange();}
function suggestPO(){
  const by={};
  const reqQ={};for(const r of S.reqs)if(r.itemId&&['pendiente','en_pedido'].includes(r.status))reqQ[r.itemId]=(reqQ[r.itemId]||0)+r.qty;
  for(const it of S.items){if(it.archived||it.kind==='herramienta')continue;const st=stockOf(it.id),res=reservedQty(it.id);const need=Math.max(0,(it.min*2||0)-(st-res)+(reqQ[it.id]?0:0));const low=it.min>0&&st-res<=it.min;if(!low&&!reqQ[it.id])continue;
    const qty=Math.max(Math.ceil(Math.max((it.min||0)*2-(st-res),0)),Math.ceil(reqQ[it.id]||0),1);const sid=it.supplierId||'_';(by[sid]=by[sid]||[]).push({itemId:it.id,qty,costCents:it.costCents});}
  return by;
}

/* ---------------- avisos programados (atrasos, sin retirar, cotizaciones vencidas) ---------------- */
function isLate(o){const h=S.cfg.sla[o.status];return !!h&&!ST[o.status].terminal&&(now()-o.stateSince)>h*HOUR;}
function scanSla(){
  const t=now();let n=0;
  for(const o of S.orders){
    if(ST[o.status].terminal)continue;
    if(isLate(o)){const x=notify('atraso',{title:'Orden atrasada: '+otCode(o),body:ST[o.status].name+' hace '+dur(t-o.stateSince)+' (límite '+S.cfg.sla[o.status]+' h)',ref:{type:'order',id:o.id},assignee:o.techId,key:'late:'+o.id+':'+o.status});if(x)n++;}
    if(o.status==='listo'&&t-o.stateSince>S.cfg.storedDays*DAY){const x=notify('sin_retirar',{title:'Equipo sin retirar: '+otCode(o),body:devLabel(orderDev(o))+' · '+clientName(o.clientId)+' · hace '+dur(t-o.stateSince),ref:{type:'order',id:o.id},key:'stored:'+o.id});if(x)n++;}
  }
  return n;
}

/* ---------------- consulta pública del estado (sin datos personales) ---------------- */
const _tries=[];
function publicLookup(num,last4){
  const t=now();while(_tries.length&&t-_tries[0]>10*MIN)_tries.shift();
  if(_tries.length>=8)return {limited:true};_tries.push(t);
  const n=parseInt(String(num).replace(/\D/g,''),10);const o=S.orders.find(x=>x.n===n);if(!o)return null;
  const c=getClient(o.clientId);if(!c||c.anon)return null;const wd=waDigits(c.wa);if(!wd||wd.slice(-4)!==String(last4||'').trim())return null;
  const tt=quoteTotals(o);const op=orderPay(o);
  return {code:otCode(o),status:o.status,statusName:ST[o.status].name,device:devLabel(orderDev(o)),created:o.dates.created,promised:o.dates.promised,ready:o.dates.ready,delivered:o.dates.delivered,outcome:o.outcome,quoteStatus:o.quote.status,total:['enviado','aprobado'].includes(o.quote.status)||o.status==='listo'?tt.total:null,due:o.status==='listo'?Math.max(0,op.due):null,validUntil:o.quote.status==='enviado'?o.quote.validUntil:null,updated:o.stateSince};
}

/* ---------------- métricas de reportes ---------------- */
function deliveredBetween(a,b){return S.orders.filter(o=>o.status==='entregado'&&o.dates.delivered>=a&&o.dates.delivered<b);}
function orderEconomics(o){
  const t=quoteTotals(o);const used=o.quote.lines.filter(l=>l.kind==='rep'&&l.state==='usado');const cost=sum(used,l=>Math.round(l.costCents*l.qty));
  const repRev=sum(used,lineAmt);const moRev=t.mo;const sub=t.mo+sum(o.quote.lines.filter(l=>l.kind==='rep'&&l.state!=='liberado'),lineAmt);
  const rev=t.total;const margin=rev-cost;
  return {rev,moRev,repRev:rev-moRev,cost,margin,disc:t.disc,billable:t.billable};
}
function reportServices(a,b){
  const out={};
  for(const o of deliveredBetween(a,b)){
    const eco=orderEconomics(o);const mos=o.quote.lines.filter(l=>l.kind==='mo'&&l.state!=='liberado');const totMo=sum(mos,lineAmt)||1;
    const key=o.type==='garantia'?'Garantías (sin cargo)':null;
    if(key){const r=out[key]=out[key]||{name:key,n:0,rev:0,cost:0,mins:0,est:0};r.n++;r.cost+=eco.cost;r.mins+=Math.round(orderMs(o)/MIN);r.est+=quoteTotals(o).estMin;continue;}
    if(!mos.length){const r=out['Otros (sin servicio)']=out['Otros (sin servicio)']||{name:'Otros (sin servicio)',n:0,rev:0,cost:0,mins:0,est:0};r.n++;r.rev+=eco.rev;r.cost+=eco.cost;continue;}
    for(const l of mos){const name=l.svcId?(S.services.find(s=>s.id===l.svcId)||{name:l.desc}).name:l.desc;const share=lineAmt(l)/totMo;const r=out[name]=out[name]||{name,n:0,rev:0,cost:0,mins:0,est:0};r.n++;
      const moPart=lineAmt(l);const repPart=Math.round(eco.repRev*share);const discPart=Math.round(eco.disc*share);
      r.rev+=moPart+repPart-discPart;r.cost+=Math.round(eco.cost*share);r.mins+=Math.round(orderMs(o)*share/MIN);r.est+=Math.round((l.estMin||0)*l.qty);}
  }
  return Object.values(out).map(r=>({...r,margin:r.rev-r.cost,marginPct:pct(r.rev-r.cost,r.rev)}));
}
function reportTechs(a,b){
  const out={};for(const u of techs())out[u.id]={id:u.id,name:u.name,n:0,moRev:0,mins:0,est:0,commission:0,pct:u.commissionPct==null?S.cfg.commissionPct:u.commissionPct};
  for(const o of deliveredBetween(a,b)){
    const eco=orderEconomics(o);const logs=o.timeLog;const totMs=sum(logs,l=>(l.end||now())-l.start);const est=quoteTotals(o).estMin;
    const shares={};if(totMs>0){for(const l of logs){shares[l.techId]=(shares[l.techId]||0)+((l.end||now())-l.start)/totMs;}}else if(o.techId)shares[o.techId]=1;
    for(const tid of Object.keys(shares)){const r=out[tid];if(!r)continue;r.n+=shares[tid]===1?1:shares[tid];r.moRev+=Math.round((o.type==='garantia'?0:eco.moRev)*shares[tid]);r.mins+=Math.round(orderMs(o,tid)/MIN);r.est+=Math.round(est*shares[tid]);}
  }
  return Object.values(out).map(r=>({...r,n:Math.round(r.n*10)/10,commission:Math.round(r.moRev*r.pct/100),eff:r.mins?Math.round(r.est/r.mins*100):0}));
}
