/* =====================================================================
   CLIENTES: lista, ficha (equipos, órdenes, cuenta corriente, sellos,
   consentimiento) y alta/edición con validaciones.
   ===================================================================== */
UI.f.cli={q:'',debt:false};
function cliRows(){
  const q=UI.f.cli.q.trim().toLowerCase();const qd=waDigits(q);
  return S.clients.filter(c=>!c.anon&&(!UI.f.cli.debt||ccBalance(c.id)>0)&&(!q||(c.name.toLowerCase().includes(q)||(qd.length>=3&&waDigits(c.wa).includes(qd))||(qd.length>=4&&String(c.dni||'').includes(qd))||S.devices.some(d=>d.clientId===c.id&&(d.serial||'').toLowerCase().includes(q)))));
}
function cliTable(){
  const acc={nm:c=>c.name,wa:c=>c.wa,ord:c=>S.orders.filter(o=>o.clientId===c.id).length,deu:c=>ccBalance(c.id),sel:c=>stampsOf(c.id),alta:c=>c.createdAt};
  const rows=sortRows('cli',cliRows(),acc,{key:'nm',dir:'asc'});
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('cli','nm','Cliente')+sortHead('cli','wa','WhatsApp','hide-sm')+sortHead('cli','ord','Órdenes','r')+sortHead('cli','deu','Debe','r')+(S.cfg.loyalty.on?sortHead('cli','sel','Sellos','r hide-sm'):'')+'</tr></thead><tbody>'
   +(rows.length?rows.map(c=>{const d=ccBalance(c.id);return '<tr class="clk" data-act="goto" data-to="cliente/'+c.id+'"><td><a href="#panel/cliente/'+c.id+'"><b>'+esc(c.name)+'</b></a></td><td class="hide-sm">'+esc(c.wa)+'</td><td class="r num">'+S.orders.filter(o=>o.clientId===c.id).length+'</td><td class="r num">'+(d>0?'<b>'+esc(fmt(d))+'</b>':'—')+'</td>'+(S.cfg.loyalty.on?'<td class="r num hide-sm">'+stampsOf(c.id)+' / '+S.cfg.loyalty.goal+'</td>':'')+'</tr>';}).join(''):'<tr><td colspan="5"><div class="empty">No hay clientes con ese criterio.</div></td></tr>')+'</tbody></table>');
}
SCREENS.clientes={title:'Clientes',perm:'clients_edit',view(){
  return pageHead('Clientes','Buscá por nombre, WhatsApp, DNI o número de serie.',can('clients_edit')?'<button type="button" class="btn p" data-act="cliNew">'+ic('plus',18)+'Nuevo cliente</button>':'')
   +'<div class="card flat" style="margin-bottom:14px"><div class="row"><div class="field grow"><label class="sr-only" for="cl-q">Buscar</label><input type="search" id="cl-q" placeholder="Buscar cliente…" value="'+esc(UI.f.cli.q)+'" data-inp="cliQ"></div><label class="chk"><input type="checkbox" data-chg="cliDebt"'+(UI.f.cli.debt?' checked':'')+'><span>Sólo con deuda</span></label></div></div>'+'<div class="card">'+region('cli-t',cliTable)+'</div>';
}};
INP.cliQ=el=>{UI.f.cli.q=el.value;UI.region('cli-t');};
CHG.cliDebt=el=>{UI.f.cli.debt=el.checked;UI.region('cli-t');};
function cliForm(id,after){
  const c=id?getClient(id):{name:'',wa:'',dni:'',email:'',notes:'',ccLimitCents:0};
  modal({title:id?'Editar cliente':'Nuevo cliente',sticky:true,html:'<div class="grid g2">'+fld('Nombre y apellido','<input type="text" id="cf-n" maxlength="80" value="'+esc(c.name)+'">')+fld('WhatsApp','<input type="tel" id="cf-w" inputmode="tel" maxlength="25" placeholder="Ej.: 387 555-0123" value="'+esc(c.wa)+'">')+fld('DNI (opcional)','<input type="text" id="cf-d" inputmode="numeric" maxlength="11" value="'+esc(c.dni||'')+'">')+fld('Correo (opcional)','<input type="email" id="cf-e" maxlength="80" value="'+esc(c.email||'')+'">')
    +(id&&can('clients_admin')?fld('Límite de cuenta corriente ($)','<input type="text" inputmode="decimal" data-money id="cf-l" placeholder="Sin cuenta corriente" value="'+esc(moneyVal(c.ccLimitCents))+'">'):'')+'</div>'+fld('Notas internas','<textarea id="cf-o" rows="2" maxlength="500">'+esc(c.notes||'')+'</textarea>')
    +(id?'':'<label class="chk"><input type="checkbox" id="cf-c"><span>El cliente acepta que usemos sus datos para atender la reparación (obligatorio)</span></label><label class="chk"><input type="checkbox" id="cf-m"><span>Acepta recibir novedades y promociones (opcional)</span></label>'),
    buttons:[{label:'Cancelar'},{label:'Guardar',cls:'p',onClick:h=>{let lim=c.ccLimitCents;const li=h.$('#cf-l');if(li){lim=moneyIn(li.value);if(isNaN(lim))throw new VBErr('El límite no es un número válido.');}
      const r=clientSave({id:id||null,name:h.$('#cf-n').value,wa:h.$('#cf-w').value,dni:h.$('#cf-d').value,email:h.$('#cf-e').value,notes:h.$('#cf-o').value,ccLimitCents:lim,consentCare:id?true:h.$('#cf-c').checked,consentMkt:id?false:h.$('#cf-m').checked});toast('Cliente guardado.','ok');if(after)setTimeout(()=>after(r),20);}}]});
}
ACTS.cliNew=()=>cliForm(null,c=>{location.hash='#panel/cliente/'+c.id;});
SCREENS.cliente={title:'Cliente',perm:'clients_edit',view(p){
  const c=getClient(p[0]);if(!c||c.anon)return pageHead('Cliente no encontrado','')+'<div class="card"><a class="btn" href="#panel/clientes">← Clientes</a></div>';
  const ords=S.orders.filter(o=>o.clientId===c.id).sort((a,b)=>b.dates.created-a.dates.created);const devs=S.devices.filter(d=>d.clientId===c.id);const debt=ccBalance(c.id);const L=S.cfg.loyalty;
  const tot=sum(ords.filter(o=>o.status==='entregado'),o=>quoteTotals(o).total);
  return pageHead(c.name,'Cliente desde '+esc(fdate(c.createdAt))+' · '+ords.length+' orden'+(ords.length===1?'':'es')+' · facturado '+esc(fmt(tot)),'<a class="btn" href="#panel/clientes">← Clientes</a><button type="button" class="btn" data-act="cliEdit" data-id="'+c.id+'">'+ic('edit',18)+'Editar</button>'+(can('intake')?'<a class="btn p" href="#panel/ingreso/'+c.id+'">'+ic('plus',18)+'Nueva recepción</a>':''))
   +'<div class="grid g2"><div class="card"><h3>Datos</h3>'+kv('WhatsApp',esc(c.wa)+(waDigits(c.wa)?' <a class="btn xs" target="_blank" rel="noopener" href="'+esc(waLink(c.wa,'Hola '+c.name.split(' ')[0]+', te escribimos de '+S.cfg.shop.name+'.'))+'">'+ic('chat',14)+'Escribir</a>':''))+kv('DNI',esc(c.dni||'—'))+kv('Correo',esc(c.email||'—'))+kv('Notas',esc(c.notes||'—'))
    +kv('Consentimiento de datos','Atención: '+(c.consent.care?'sí':'no')+' · Novedades: '+(c.consent.mkt?'sí':'no')+' <button type="button" class="btn xs" data-act="cliMkt" data-id="'+c.id+'">'+(c.consent.mkt?'Quitar novedades':'Aceptó novedades')+'</button>')
    +(can('clients_admin')?'<div class="row" style="margin-top:10px"><button type="button" class="btn d xs" data-act="cliAnon" data-id="'+c.id+'">Dar de baja (anonimizar)</button></div>':'')+'</div>'
    +'<div class="col" style="gap:16px"><div class="card"><h3>Cuenta corriente</h3>'+kv('Límite',esc(fmt(c.ccLimitCents)))+kv('Debe',debt>0?'<b>'+esc(fmt(debt))+'</b>':'—')+kv('Disponible',esc(fmt(Math.max(0,c.ccLimitCents-debt))))+(debt>0&&can('payments')?'<div class="row" style="margin-top:10px"><button type="button" class="btn p" data-act="cliPayDebt" data-id="'+c.id+'">'+ic('cash',18)+'Cobrar deuda</button></div>':'')+'</div>'
    +(L.on?'<div class="card"><h3>Sellos de fidelidad</h3><div style="font-size:1.4rem"><b>'+stampsOf(c.id)+'</b> / '+L.goal+'</div><p class="mut sm" style="margin:4px 0 8px">Premio: '+esc(L.prize)+'. Suma un sello cada reparación entregada de al menos '+esc(fmt(L.minCents))+' (con consentimiento).</p>'+(stampsOf(c.id)>=L.goal&&can('clients_edit')?'<button type="button" class="btn p" data-act="cliRedeem" data-id="'+c.id+'">'+ic('star',18)+'Canjear premio</button>':'')+'</div>':'')+'</div></div>'
   +'<div class="card" style="margin-top:16px"><h3>Equipos</h3>'+(devs.length?'<div class="row">'+devs.map(d=>'<span class="badge">'+esc(devLabel(d))+(d.serial?' · S/N '+esc(d.serial):'')+'</span>').join('')+'</div>':'<p class="mut">Sin equipos registrados.</p>')+'</div>'
   +'<div class="card" style="margin-top:16px"><h3>Órdenes</h3>'+tableWrap('<table class="tbl"><thead><tr><th scope="col">Orden</th><th scope="col">Equipo</th><th scope="col" class="hide-sm">Ingreso</th><th scope="col">Estado</th><th scope="col" class="r">Total</th></tr></thead><tbody>'+(ords.length?ords.map(o=>'<tr class="clk" data-act="goto" data-to="orden/'+o.id+'"><td><a href="#panel/orden/'+o.id+'">'+esc(otCode(o))+'</a></td><td>'+esc(devLabel(orderDev(o)))+'</td><td class="hide-sm nowrap">'+esc(fdate(o.dates.created))+'</td><td>'+stBadge(o.status)+'</td><td class="r num">'+esc(fmt(quoteTotals(o).total))+'</td></tr>').join(''):'<tr><td colspan="5"><div class="empty">Sin órdenes.</div></td></tr>')+'</tbody></table>')+'</div>';
}};
ACTS.cliEdit=el=>cliForm(el.dataset.id);
ACTS.cliMkt=el=>{const c=getClient(el.dataset.id);run(()=>clientConsent(c.id,{mkt:!c.consent.mkt}),'Consentimiento actualizado.');};
ACTS.cliRedeem=el=>confirmBox({title:'Canjear premio',html:esc(S.cfg.loyalty.prize)+'. Se descuentan '+S.cfg.loyalty.goal+' sellos.',ok:'Canjear',onOk:()=>{stampRedeem(el.dataset.id);toast('Premio canjeado.','ok');}});
ACTS.cliAnon=el=>confirmBox({title:'Dar de baja al cliente',html:'Se borran sus datos personales (nombre, WhatsApp, DNI, correo) y se conserva el historial de órdenes sin identificarlo. <b>No se puede deshacer.</b>',confirmWord:'BAJA',danger:true,ok:'Dar de baja',onOk:()=>{clientAnonymize(el.dataset.id);toast('Cliente dado de baja.','ok');location.hash='#panel/clientes';}});
ACTS.cliPayDebt=el=>{const c=getClient(el.dataset.id);const debt=ccBalance(c.id);
  if(!openSession()){toast('La caja está cerrada. Abrila para poder cobrar.','bad');location.hash='#panel/caja';return;}
  modal({title:'Cobrar deuda · '+c.name,small:true,html:'<p>Debe <b>'+esc(fmt(debt))+'</b>.</p>'+fld('Importe a cobrar ($)','<input type="text" inputmode="decimal" data-money id="dd-a" placeholder="Importe (puede ser parcial)">'),buttons:[{label:'Cancelar'},{label:'Continuar',cls:'p',onClick:h=>{const a=parseMoney(h.$('#dd-a').value);if(isNaN(a)||a<=0)throw new VBErr('Escribí el importe.');if(a>debt)throw new VBErr('No puede superar la deuda.');setTimeout(()=>payModal({title:'Cobro de deuda · '+c.name,amount:a,client:c,allowCc:false,onSubmit:(lines,key)=>paymentCreate({kind:'deuda',clientId:c.id,lines,amountCents:a,key})}),20);}}]});};
