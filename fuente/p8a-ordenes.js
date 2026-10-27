/* =====================================================================
   TALLER: tablero Kanban (pendiente → en proceso → en prueba → listo),
   lista ordenable, cambios de estado con sus reglas y entrega.
   ===================================================================== */
UI.f.ord={view:'tablero',q:'',tech:'',prio:'',late:false,mine:null,done:false};
function ordFiltered(){
  const F=UI.f.ord,u=curUser();const mine=F.mine==null?u.role==='tecnico':F.mine;const q=F.q.trim().toLowerCase();
  return S.orders.filter(o=>{
    if(!F.done&&ST[o.status].terminal)return false;
    if(mine&&o.techId!==u.id&&!(o.status==='pendiente'&&!o.techId))return false;
    if(F.tech==='_none'&&o.techId)return false;if(F.tech&&F.tech!=='_none'&&o.techId!==F.tech)return false;
    if(F.prio&&o.priority!==F.prio)return false;if(F.late&&!isLate(o))return false;
    if(q){const c=getClient(o.clientId),d=orderDev(o);const hay=(otCode(o)+' '+(c?c.name:'')+' '+devLabel(d)+' '+(d&&d.serial||'')+' '+o.intake.fault).toLowerCase();if(!hay.includes(q))return false;}
    return true;});
}
function partsShort(o){return o.quote.lines.some(l=>l.kind==='rep'&&l.state==='reservado'&&stockOf(l.itemId)<l.qty);}
function ordCard(o){
  const c=getClient(o.clientId),d=orderDev(o),late=isLate(o);const tech=o.techId?userById(o.techId):null;const run=o.timeLog.find(l=>!l.end);
  const tot=quoteTotals(o);
  return '<article class="ocard'+(late?' late':'')+'" draggable="'+(can('orders_work')?'true':'false')+'" data-oid="'+o.id+'" style="border-left-color:'+safeColor(ST[o.status].color)+'" aria-label="'+esc(otCode(o)+' '+devLabel(d))+'">'
   +'<div class="row spread" style="flex-wrap:nowrap"><a class="t" href="#panel/orden/'+o.id+'" style="color:inherit">'+esc(otCode(o))+'</a><span class="row gap-s">'+(o.priority!=='normal'?'<span class="badge '+(o.priority==='urgente'?'bad':'warn')+'">'+esc(PRIO[o.priority])+'</span>':'')+(o.type==='garantia'?'<span class="badge info">Garantía</span>':'')+'</span></div>'
   +'<div><b>'+esc(devLabel(d))+'</b></div><div class="m">'+esc(c?c.name:'')+'</div><div class="m">'+esc(o.intake.fault.length>80?o.intake.fault.slice(0,80)+'…':o.intake.fault)+'</div>'
   +'<div class="row gap-s">'+(late?'<span class="badge bad">Atrasada · '+esc(dur(now()-o.stateSince))+'</span>':'<span class="xs mut">'+ic('clock',12)+' '+esc(dur(now()-o.stateSince))+' en este estado</span>')+(partsShort(o)?'<span class="badge warn">Falta repuesto</span>':'')+(o.quote.status==='enviado'&&o.status!=='aprobacion'?'<span class="badge warn">Ampliación sin aprobar</span>':'')+(run?'<span class="badge teal">'+ic('play',10)+' <span data-timer="'+o.id+'" data-tech="'+run.techId+'">'+clock(orderMs(o,run.techId))+'</span></span>':'')+'</div>'
   +'<div class="row spread" style="flex-wrap:nowrap"><span class="row gap-s">'+(tech?'<span class="ava" title="'+esc(tech.name)+'">'+esc(initials(tech.name))+'</span><span class="xs">'+esc(tech.name.split(' ')[0])+'</span>':'<span class="badge">Sin técnico</span>')+'</span>'+(tot.total&&can('view_costs')?'<span class="xs b">'+esc(fmt(tot.total))+'</span>':'')+'</div>'
   +'<div class="row" style="gap:6px"><button type="button" class="btn xs grow" data-act="ordMove" data-id="'+o.id+'" aria-haspopup="menu">'+ic('arrow',14)+'Mover</button>'+(!o.techId&&can('orders_work')&&curUser().role==='tecnico'?'<button type="button" class="btn xs p" data-act="ordTake" data-id="'+o.id+'">Tomar</button>':'')+'</div></article>';
}
function kanbanHtml(){
  const list=ordFiltered();
  return '<div class="kanban" id="kb" role="list">'+ST_COLS.map(k=>{const items=list.filter(o=>o.status===k).sort((a,b)=>{const pw={urgente:0,alta:1,normal:2};return (pw[a.priority]-pw[b.priority])||(a.stateSince-b.stateSince);});
    return '<section class="kcol" data-col="'+k+'" role="listitem" aria-label="'+esc(ST[k].name)+'"><h3><i class="dot" style="background:'+safeColor(ST[k].color)+'"></i>'+esc(ST[k].name)+'<span class="n">'+items.length+'</span></h3>'+(items.length?items.map(ordCard).join(''):'<div class="empty xs" style="padding:18px 6px">Sin órdenes</div>')+'</section>';}).join('')+'</div>';
}
function ordListHtml(){
  const list=ordFiltered();const acc={n:o=>o.n,eq:o=>devLabel(orderDev(o)),cli:o=>clientName(o.clientId),st:o=>ST_FLOW.indexOf(o.status),tec:o=>o.techId?userName(o.techId):null,pri:o=>({urgente:0,alta:1,normal:2})[o.priority],ing:o=>o.dates.created,age:o=>now()-o.stateSince,tot:o=>quoteTotals(o).total,sal:o=>Math.max(0,orderPay(o).due)};
  const rows=sortRows('ord',list,acc,{key:'ing',dir:'desc'});const costs=can('view_costs')||can('payments');
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('ord','n','Orden')+sortHead('ord','eq','Equipo')+sortHead('ord','cli','Cliente','hide-sm')+sortHead('ord','st','Estado')+sortHead('ord','tec','Técnico','hide-sm')+sortHead('ord','pri','Prioridad','hide-sm')+sortHead('ord','ing','Ingreso','hide-sm')+sortHead('ord','age','En el estado','hide-sm')+(costs?sortHead('ord','tot','Total','r')+sortHead('ord','sal','Saldo','r hide-sm'):'')+'</tr></thead><tbody>'
   +(rows.length?rows.map(o=>{const op=orderPay(o);return '<tr class="clk" data-act="goto" data-to="orden/'+o.id+'"><td><a href="#panel/orden/'+o.id+'"><b>'+esc(otCode(o))+'</b></a></td><td>'+esc(devLabel(orderDev(o)))+'</td><td class="hide-sm">'+esc(clientName(o.clientId))+'</td><td>'+stBadge(o.status)+(isLate(o)?' '+badge('Atrasada','bad'):'')+'</td><td class="hide-sm">'+esc(o.techId?userName(o.techId):'—')+'</td><td class="hide-sm">'+esc(PRIO[o.priority])+'</td><td class="hide-sm nowrap">'+esc(fdate(o.dates.created))+'</td><td class="hide-sm nowrap">'+esc(dur(now()-o.stateSince))+'</td>'+(costs?'<td class="r num">'+esc(fmt(op.total))+'</td><td class="r num hide-sm">'+(op.due>0?'<b>'+esc(fmt(op.due))+'</b>':'—')+'</td>':'')+'</tr>';}).join(''):'<tr><td colspan="9"><div class="empty">No hay órdenes con esos filtros.</div></td></tr>')+'</tbody></table>');
}
function ordBody(){return UI.f.ord.view==='tablero'?kanbanHtml():ordListHtml();}
SCREENS.ordenes={title:'Taller',view(){
  const F=UI.f.ord,u=curUser();const mine=F.mine==null?u.role==='tecnico':F.mine;
  const tools='<div class="seg" role="group" aria-label="Vista"><button type="button" data-act="ordView" data-v="tablero" aria-pressed="'+(F.view==='tablero')+'">'+ic('kanban',16)+' Tablero</button><button type="button" data-act="ordView" data-v="lista" aria-pressed="'+(F.view==='lista')+'">'+ic('list',16)+' Lista</button></div>'+(can('intake')?'<a class="btn p" href="#panel/ingreso">'+ic('plus',18)+'Nueva recepción</a>':'');
  return pageHead('Taller','Arrastrá las tarjetas entre columnas o usá el botón «Mover». Las reglas del flujo se aplican siempre.',tools)
   +'<div class="card flat" style="margin-bottom:14px"><div class="row"><div class="field grow" style="min-width:200px"><label for="of-q" class="sr-only">Buscar</label><input type="search" id="of-q" placeholder="Buscar OT, cliente, equipo o serie…" value="'+esc(F.q)+'" data-inp="ordQ"></div>'
   +'<div class="field"><label for="of-t" class="sr-only">Técnico</label><select id="of-t" data-chg="ordF" data-k="tech">'+opts([['_none','Sin técnico'],...techs().map(t=>[t.id,t.name])],F.tech,'Todos los técnicos')+'</select></div>'
   +'<div class="field"><label for="of-p" class="sr-only">Prioridad</label><select id="of-p" data-chg="ordF" data-k="prio">'+opts(Object.entries(PRIO),F.prio,'Toda prioridad')+'</select></div>'
   +'<label class="chk"><input type="checkbox" data-chg="ordFb" data-k="late"'+(F.late?' checked':'')+'><span>Sólo atrasadas</span></label>'
   +'<label class="chk"><input type="checkbox" data-chg="ordFb" data-k="mine"'+(mine?' checked':'')+'><span>Mis órdenes</span></label>'
   +(F.view==='lista'?'<label class="chk"><input type="checkbox" data-chg="ordFb" data-k="done"'+(F.done?' checked':'')+'><span>Incluir cerradas</span></label>':'')+'</div></div>'
   +region('ord-body',ordBody);
},after(){bindKanban();}};
ACTS.ordView=el=>{UI.f.ord.view=el.dataset.v;renderView();};
INP.ordQ=el=>{UI.f.ord.q=el.value;UI.region('ord-body');bindKanban();};
CHG.ordF=el=>{UI.f.ord[el.dataset.k]=el.value;UI.region('ord-body');bindKanban();};
CHG.ordFb=el=>{UI.f.ord[el.dataset.k]=el.checked;UI.region('ord-body');bindKanban();};
function bindKanban(){
  const kb=$('#kb');if(!kb)return;
  kb.querySelectorAll('.ocard[draggable="true"]').forEach(c=>{c.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',c.dataset.oid);e.dataTransfer.effectAllowed='move';c.style.opacity='.5';});c.addEventListener('dragend',()=>{c.style.opacity='';$$('.kcol.over').forEach(x=>x.classList.remove('over'));});});
  kb.querySelectorAll('.kcol').forEach(col=>{col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('over');});col.addEventListener('dragleave',()=>col.classList.remove('over'));
    col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('over');const id=e.dataTransfer.getData('text/plain');if(id)moveFlow(id,col.dataset.col);});});
}
function nextStatuses(o){const out=[];for(const k of ST_FLOW){if(k===o.status)continue;if(k==='entregado'&&o.status!=='listo')continue;out.push(k);}return out;}
ACTS.ordMove=el=>{const o=getOrder(el.dataset.id);const items=nextStatuses(o).map(k=>({label:(ST_FLOW.indexOf(k)>ST_FLOW.indexOf(o.status)?'→ ':'← ')+ST[k].name,fn:()=>moveFlow(o.id,k)}));
  if(can('orders_cancel'))items.push({sep:true},{label:'Cancelar la orden…',icon:'x',fn:()=>moveFlow(o.id,'cancelado')});showMenu(el,items);};
ACTS.ordTake=el=>run(()=>orderAssign(el.dataset.id,SESSION.uid),'Tomaste la orden.');
function moveFlow(id,to){
  const o=getOrder(id);if(o.status===to)return;
  const forward=ST_FLOW.indexOf(to)>ST_FLOW.indexOf(o.status);
  if(to==='entregado')return deliverFlow(id);
  if(to==='cancelado'){return confirmBox({title:'Cancelar '+otCode(o),html:'La orden se cierra como cancelada y los repuestos reservados se liberan. No se puede deshacer.',ok:'Cancelar orden',danger:true,reason:true,onOk:r=>{orderMove(id,'cancelado',{reason:r});toast('Orden cancelada.','ok');}});}
  if(!forward){return confirmBox({title:'Volver a «'+ST[to].name+'»',html:'Vas a retroceder '+esc(otCode(o))+' de «'+esc(ST[o.status].name)+'». Queda registrado quién y por qué.',ok:'Retroceder',reason:true,onOk:r=>{orderMove(id,to,{reason:r});toast(otCode(o)+' vuelve a '+ST[to].name+'.','ok');}});}
  const r=run(()=>orderMove(id,to));if(r!==undefined)toast(otCode(o)+' → '+ST[to].name,'ok');
}
function deliverFlow(id){
  const o=getOrder(id);if(o.status!=='listo'){toast('Sólo se entrega un equipo que está «Listo para retirar».','bad');return;}
  const op=orderPay(o);const h=modal({title:'Entregar '+otCode(o),html:'<div class="col"><div class="row spread"><span>Equipo</span><b>'+esc(devLabel(orderDev(o)))+'</b></div><div class="row spread"><span>Cliente</span><b>'+esc(clientName(o.clientId))+'</b></div><div class="row spread"><span>Total</span><b>'+esc(fmt(op.total))+'</b></div><div class="row spread"><span>Ya cobrado</span><b>'+esc(fmt(op.paid+op.pend))+'</b></div>'+(op.cc?'<div class="row spread"><span>A cuenta corriente</span><b>'+esc(fmt(op.cc))+'</b></div>':'')+'<div class="row spread"><span>Saldo a cobrar</span><b>'+esc(fmt(Math.max(0,op.due)))+'</b></div></div>'
    +(op.pend>0?'<div class="alert warn">'+ic('alert',18)+'Hay un cobro digital sin verificar ('+esc(fmt(op.pend))+'). Verificá la acreditación antes de entregar.</div>':'')
    +(op.due>0?'<div class="alert warn">'+ic('alert',18)+'Falta cobrar '+esc(fmt(op.due))+' para poder entregar.</div>':'')+(op.due<0?'<div class="alert warn">El cliente tiene saldo a favor: registrá el reintegro desde «Cobros».</div>':'')
    +'<div class="field"><label for="dl-n">Observación (opcional)</label><input type="text" id="dl-n" maxlength="120" placeholder="Ej.: retira el hermano con DNI"></div>',
    buttons:[{label:'Cancelar'},...(op.due>0&&can('payments')?[{label:'Cobrar ahora',cls:'',keep:true,onClick:hh=>{hh.close();payFlow(o.id,()=>deliverFlow(o.id));return false;}}]:[]),{label:'Confirmar entrega',cls:'p',onClick:hh=>{const note=hh.$('#dl-n').value;const r=orderDeliver(id,{note});setTimeout(()=>deliveredModal(o,r),20);}}]});
  if(op.due>0||op.pend>0)h.setBtn(op.due>0&&can('payments')?2:1,{disabled:true});
}
function deliveredModal(o,r){
  modal({title:'Entregada: '+otCode(o),small:true,html:'<div class="alert ok">'+ic('check',18)+'Equipo entregado a '+esc(clientName(o.clientId))+'.</div>'+(r.days?'<p>Garantía de la reparación: <b>'+r.days+' días</b> (hasta el '+esc(fdate(o.warrantyUntil))+').</p>':'')+(r.stamp?'<p>'+ic('star',16)+' El cliente sumó un sello. Lleva <b>'+stampsOf(o.clientId)+'</b> de '+S.cfg.loyalty.goal+'.</p>':'')+'<button type="button" class="btn" data-pr="entrega">'+ic('print',18)+'Imprimir comprobante de entrega</button>',buttons:[{label:'Cerrar',cls:'p'}],onOpen:h=>h.$$('[data-pr]').forEach(b=>b.onclick=()=>run(()=>printDoc(b.dataset.pr,o.id)))});
}
document.addEventListener('submit',e=>{e.preventDefault();});
