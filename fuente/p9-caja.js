/* =====================================================================
   COBROS Y CAJA: modal de pago mixto (compartido), pantalla de caja
   (apertura, ingresos/egresos con rubro, arqueo, cierre sellado) y
   venta de mostrador.
   ===================================================================== */
const moneyIn=v=>{v=String(v==null?'':v).trim();if(v==='')return 0;const n=parseMoney(v);return isNaN(n)?NaN:n;};
const moneyVal=c=>c?String(c/100).replace('.',','):'';

/* payModal: título, importe a cobrar, cliente (para cuenta corriente), allowCc, onSubmit(lines,key) → crea el cobro */
function payModal({title,amount,client,allowCc,note,onSubmit,onDone}){
  const key=nid('k');const methods=Object.keys(METHODS).filter(m=>m!=='cc'||(allowCc&&client&&!client.anon&&client.ccLimitCents>0));
  const sess=openSession();
  let h=null;h=modal({title,sticky:true,html:'<div id="pm"></div>',buttons:[{label:'Cancelar'},{label:'Confirmar cobro',cls:'p',onClick:hh=>{const st=state();if(!st.chk.ok)throw new VBErr(st.chk.msg||'Revisá los importes.');
      const p=onSubmit(st.lines,key);toast('Cobro registrado.','ok');if(onDone)setTimeout(()=>onDone(p),20);}}],onOpen:hh=>{h=hh;draw();}});
  const sel={};let eres={};
  function state(){
    const lines=[];let bad=false;
    for(const m of methods){const on=h.$('[data-pm="'+m+'"]');if(!on||!on.checked)continue;const a=moneyIn(h.$('[data-pa="'+m+'"]').value);const l={m,a};if(isNaN(a))bad=true;
      if(m==='efectivo'){const r=h.$('[data-pr="efectivo"]');if(r&&r.value.trim()!==''){const rv=parseMoney(r.value);if(isNaN(rv))bad=true;else l.recibido=rv;}}
      if(DIGITAL.includes(m)||m==='debito'||m==='credito'){const rf=h.$('[data-pf="'+m+'"]');if(rf&&rf.value.trim())l.ref=rf.value.trim();}
      lines.push(l);}
    const chk=bad?{ok:false,msg:'Revisá los importes: hay un número que no se entiende.',diff:amount,sum:0,cc:0,change:0}:payCheck(amount,lines.map(l=>({...l})),client);
    return {lines,chk};
  }
  function draw(){
    const prev={};if(h.$('#pm').children.length){for(const m of methods){const on=h.$('[data-pm="'+m+'"]');if(on)prev[m]={on:on.checked,a:h.$('[data-pa="'+m+'"]').value,r:(h.$('[data-pr="'+m+'"]')||{}).value,f:(h.$('[data-pf="'+m+'"]')||{}).value};}}
    h.$('#pm').innerHTML='<div class="row spread" style="margin-bottom:8px"><div><div class="mut sm">Importe a cobrar</div><div style="font-size:1.8rem" class="num"><b>'+esc(fmt(amount))+'</b></div></div>'+(note?'<div class="mut sm" style="max-width:55%;text-align:right">'+esc(note)+'</div>':'')+'</div>'
     +(!sess?'<div class="alert bad">'+ic('alert',18)+'La caja está cerrada. Abrila antes de cobrar.</div>':'')
     +'<div class="col" style="gap:10px">'+methods.map(m=>{const p=prev[m]||{on:false,a:'',r:'',f:''};
       return '<div class="card flat" style="padding:10px"><div class="row" style="flex-wrap:nowrap"><label class="chk" style="min-width:190px"><input type="checkbox" data-pm="'+m+'"'+(p.on?' checked':'')+'><span><b>'+esc(METHODS[m])+'</b></span></label>'
        +'<div class="field grow" style="min-width:120px"><label class="sr-only" for="pa-'+m+'">Importe en '+esc(METHODS[m])+'</label><input type="text" inputmode="decimal" data-money id="pa-'+m+'" data-pa="'+m+'" placeholder="Importe" value="'+esc(p.a)+'" '+(p.on?'':'disabled')+'></div>'
        +'<button type="button" class="btn xs" data-resto="'+m+'" '+(p.on?'':'disabled')+'>Resto</button></div>'
        +(m==='efectivo'&&p.on?'<div class="row" style="margin-top:6px"><div class="field"><label for="pr-e">Efectivo recibido (para el vuelto)</label><input type="text" inputmode="decimal" data-money id="pr-e" data-pr="efectivo" placeholder="Opcional" value="'+esc(p.r||'')+'"></div></div>':'')
        +(m!=='efectivo'&&m!=='cc'&&p.on?'<div class="row" style="margin-top:6px"><div class="field grow"><label for="pf-'+m+'">'+(DIGITAL.includes(m)?'N.º de operación / comprobante':'Últimos 4 / cupón')+' (opcional)</label><input type="text" id="pf-'+m+'" data-pf="'+m+'" maxlength="40" value="'+esc(p.f||'')+'"></div></div>':'')
        +(m==='cc'&&p.on?'<p class="mut sm" style="margin:6px 0 0">Disponible: '+esc(fmt(Math.max(0,client.ccLimitCents-ccBalance(client.id))))+' (límite '+esc(fmt(client.ccLimitCents))+'). Queda como deuda del cliente.</p>':'')
        +(DIGITAL.includes(m)&&p.on?'<p class="mut sm" style="margin:6px 0 0">Queda «pendiente de verificar» hasta confirmar la acreditación; hasta entonces no se puede entregar el equipo.</p>':'')+'</div>';}).join('')+'</div><div id="pm-sum" aria-live="polite" style="margin-top:12px"></div>';
    h.$$('[data-pm]').forEach(c=>c.onchange=()=>{draw();});
    h.$$('[data-resto]').forEach(b=>b.onclick=()=>{const m=b.dataset.resto;const others=sum(methods.filter(x=>x!==m),x=>{const e=h.$('[data-pa="'+x+'"]');const c=e&&!e.disabled?moneyIn(e.value):0;return isNaN(c)?0:c;});const falta=Math.max(0,amount-others);h.$('[data-pa="'+m+'"]').value=moneyVal(falta);refresh();});
    h.$$('[data-pa],[data-pr],[data-pf]').forEach(i=>i.addEventListener('input',refresh));
    refresh();
  }
  function refresh(){
    const st=state(),c=st.chk;const box=h.$('#pm-sum');if(!box)return;
    let html='';
    if(!st.lines.length)html='<div class="alert info">Elegí cómo paga el cliente. Podés combinar medios (por ejemplo, efectivo + transferencia).</div>';
    else if(c.ok)html='<div class="alert ok" role="status">'+ic('check',18)+'<span>Los importes cierran. '+(c.change?'<b>Vuelto: '+esc(fmt(c.change))+'</b>':'')+(c.cc?' A cuenta corriente: '+esc(fmt(c.cc))+'.':'')+'</span></div>';
    else html='<div class="alert warn" role="status">'+ic('alert',18)+'<span>'+esc(c.msg||'Revisá los importes.')+'</span></div>';
    const ef=st.lines.find(l=>l.m==='efectivo');
    if(ef&&ef.recibido!=null&&c.ok&&c.change>0)html+='<div class="alert info" role="status">Controlá el vuelto antes de confirmar: recibido '+esc(fmt(ef.recibido))+' − cobrado '+esc(fmt(ef.a))+' = <b>'+esc(fmt(c.change))+'</b>.</div>';
    box.innerHTML=html;h.setBtn(1,{disabled:!c.ok||!sess});
  }
  return h;
}
function payFlow(orderId,after){
  const o=getOrder(orderId);const op=orderPay(o);const c=getClient(o.clientId);
  if(!openSession()){toast('La caja está cerrada. Abrila para poder cobrar.','bad');location.hash='#panel/caja';return;}
  payModal({title:'Cobrar '+otCode(o),amount:op.due,client:c,allowCc:true,note:devLabel(orderDev(o))+' · '+clientName(o.clientId)+(op.paid?' · ya cobrado '+fmt(op.paid):''),
    onSubmit:(lines,key)=>paymentCreate({kind:'orden',refId:o.id,lines,amountCents:op.due,key}),onDone:()=>{if(after)after();}});
}

/* ---------- Caja ---------- */
UI.f.caja={sel:null};
const RUBRO_TYPES={ingreso:'Ingreso',egreso:'Egreso',ambos:'Ambos'};
function cashMoveRows(sess){
  const mv=S.cash.moves.filter(m=>m.sessionId===sess.id).sort((a,b)=>b.ts-a.ts);
  const TL={cobro:'Cobro',ingreso:'Ingreso',egreso:'Egreso',reintegro:'Reintegro',anulacion:'Anulación'};
  const acc={ts:m=>m.ts,tp:m=>TL[m.type],me:m=>METHODS[m.method],ru:m=>(S.rubros.find(r=>r.id===m.rubroId)||{}).name,de:m=>m.desc,im:m=>m.amountCents};
  const rows=sortRows('cmv',mv,acc,{key:'ts',dir:'desc'});
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('cmv','ts','Hora')+sortHead('cmv','tp','Tipo')+sortHead('cmv','me','Medio','hide-sm')+sortHead('cmv','ru','Rubro','hide-sm')+sortHead('cmv','de','Detalle')+sortHead('cmv','im','Importe','r')+'</tr></thead><tbody>'
   +(rows.length?rows.map(m=>'<tr><td class="nowrap">'+esc(ftime(m.ts))+'</td><td>'+esc(TL[m.type])+'</td><td class="hide-sm">'+esc(METHODS[m.method])+'</td><td class="hide-sm">'+esc((S.rubros.find(r=>r.id===m.rubroId)||{}).name||'—')+'</td><td>'+esc(m.desc||'')+'</td><td class="r num" style="color:'+(m.amountCents<0?'var(--bad,#b91c1c)':'inherit')+'">'+esc(fmt(m.amountCents))+'</td></tr>').join(''):'<tr><td colspan="6"><div class="empty">Sin movimientos todavía.</div></td></tr>')+'</tbody></table>');
}
function cashOpenView(sess){
  const ar=arqueoCalc(sess);const pend=S.payments.filter(p=>!p.voidedAt&&p.lines.some(l=>!l.verified));
  const tiles='<div class="bento"><div class="card kpi"><div class="mut sm">Fondo inicial</div><div class="big num">'+esc(fmt(ar.fondo))+'</div></div><div class="card kpi"><div class="mut sm">Cobrado en la caja (todos los medios)</div><div class="big num">'+esc(fmt(ar.cobradoReal))+'</div></div><div class="card kpi"><div class="mut sm">Efectivo que debería haber</div><div class="big num">'+esc(fmt(ar.efectivoEsperado))+'</div><div class="mut xs">Fondo + cobros en efectivo + ingresos − egresos − reintegros</div></div><div class="card kpi"><div class="mut sm">Cobros digitales sin verificar</div><div class="big num">'+esc(fmt(ar.pendienteDigital))+'</div></div></div>';
  const medios='<div class="card"><h3>Por medio de pago</h3>'+Object.entries(ar.porMedio).map(([k,v])=>kv(METHODS[k],'<span class="num">'+esc(fmt(v))+'</span>')).join('')+kv('Ingresos manuales','<span class="num">'+esc(fmt(ar.ingresos))+'</span>')+kv('Egresos','<span class="num">'+esc(fmt(ar.egresos))+'</span>')+(ar.ccNuevo?kv('Vendido a cuenta corriente (no es efectivo)','<span class="num">'+esc(fmt(ar.ccNuevo))+'</span>'):'')+'</div>';
  const mover=can('cash')?'<div class="card"><h3>Ingreso o egreso de efectivo</h3><div class="grid g2"><div class="field"><label for="cm-t">Tipo</label><select id="cm-t" data-chg="cmType"><option value="egreso">Egreso (sale plata)</option><option value="ingreso">Ingreso (entra plata)</option></select></div><div class="field"><label for="cm-r">Rubro (obligatorio)</label><select id="cm-r">'+cmRubros('egreso')+'</select></div><div class="field"><label for="cm-a">Importe ($)</label><input type="text" inputmode="decimal" data-money id="cm-a" placeholder="Importe"></div><div class="field"><label for="cm-d">Detalle</label><input type="text" id="cm-d" maxlength="120" placeholder="Ej.: Compra de insumos de limpieza"></div></div><div class="row" style="margin-top:10px"><button type="button" class="btn p" data-act="cmAdd">Registrar movimiento</button></div></div>':'';
  const verif=pend.length&&can('verify_pay')?'<div class="card"><h3>Cobros digitales por verificar</h3>'+pend.map(p=>'<div class="row spread" style="border-bottom:1px solid var(--line);padding:6px 0"><span>'+esc(fdt(p.ts))+' · '+esc(p.lines.filter(l=>!l.verified).map(l=>METHODS[l.m]+' '+fmt(l.a)).join(', '))+'<br><small class="mut">'+esc(p.kind==='orden'?otCode(getOrder(p.refId)):'Venta de mostrador')+'</small></span><button type="button" class="btn xs p" data-act="payVerify" data-id="'+p.id+'">Verificar</button></div>').join('')+'</div>':'';
  const cierre=can('cash_close')?'<div class="card"><h3>Cerrar la caja</h3><p class="mut sm">Contá el efectivo del cajón y escribilo. Si no coincide con lo esperado, explicá el motivo. Al cerrar, el resumen queda sellado y no se puede modificar.</p><div class="grid g2"><div class="field"><label for="cc-d">Efectivo contado ($)</label><input type="text" inputmode="decimal" data-money id="cc-d" placeholder="Lo que contaste" data-inp="ccDiff"></div><div class="field"><label for="cc-n">Observaciones</label><input type="text" id="cc-n" maxlength="300"></div></div><div id="cc-sum" style="margin-top:10px"></div><div class="row" style="margin-top:10px"><button type="button" class="btn d" data-act="ccClose">Cerrar caja…</button></div></div>':'';
  return '<div class="alert ok" style="margin-bottom:14px">'+ic('check',18)+'Caja #'+sess.n+' abierta desde el '+esc(fdt(sess.openedAt))+' por '+esc(userName(sess.openedBy))+'.</div>'+tiles+'<div class="grid g2" style="margin-top:16px"><div class="col" style="gap:16px">'+medios+mover+'</div><div class="col" style="gap:16px">'+verif+cierre+'</div></div><div class="card" style="margin-top:16px"><h3>Movimientos de esta caja</h3>'+region('cmv',()=>cashMoveRows(sess))+'</div>';
}
function cmRubros(type){return opts(S.rubros.filter(r=>!r.sys&&(r.type==='ambos'||r.type===type)).map(r=>[r.id,r.name]),'','Elegí un rubro…');}
CHG.cmType=el=>{$('#cm-r').innerHTML=cmRubros(el.value);};
ACTS.cmAdd=()=>{const a=parseMoney($('#cm-a').value);if(isNaN(a)||a<=0){toast('Escribí un importe mayor a cero.','bad');return;}run(()=>{cashMove({type:$('#cm-t').value,amountCents:a,rubroId:$('#cm-r').value,desc:$('#cm-d').value});},'Movimiento registrado.');};
INP.ccDiff=()=>{const s=openSession();const b=$('#cc-sum');if(!s||!b)return;const v=parseMoney($('#cc-d').value);if(isNaN(v)){b.innerHTML='';return;}const ar=arqueoCalc(s);const d=v-ar.efectivoEsperado;b.innerHTML=d===0?'<div class="alert ok">Coincide con lo esperado ('+esc(fmt(ar.efectivoEsperado))+').</div>':'<div class="alert warn">Esperado '+esc(fmt(ar.efectivoEsperado))+' · contado '+esc(fmt(v))+' · diferencia <b>'+esc(fmt(d))+'</b>. Tenés que explicar el motivo.</div>';};
ACTS.ccClose=()=>{const v=parseMoney($('#cc-d').value);if(isNaN(v)){toast('Escribí el efectivo contado.','bad');return;}const s=openSession();const ar=arqueoCalc(s);
  confirmBox({title:'Cerrar la caja #'+s.n,html:'<p>Esperado en efectivo: <b>'+esc(fmt(ar.efectivoEsperado))+'</b><br>Contado: <b>'+esc(fmt(v))+'</b><br>Diferencia: <b>'+esc(fmt(v-ar.efectivoEsperado))+'</b></p>'+(ar.pendienteDigital?'<div class="alert warn">Hay '+esc(fmt(ar.pendienteDigital))+' de cobros digitales sin verificar.</div>':'')+'<p>El cierre queda sellado y no se puede modificar.</p>',ok:'Cerrar caja',danger:true,onOk:()=>{const ses=cashClose({declaredCents:v,notes:$('#cc-n')?$('#cc-n').value:''});toast('Caja cerrada y sellada.','ok');setTimeout(()=>{UI.f.caja.sel=ses.id;renderView();},30);}});};
function cashClosedView(){
  const cl=S.cash.sessions.filter(s=>s.status==='cerrada').sort((a,b)=>b.closedAt-a.closedAt);
  const acc={n:s=>s.n,ab:s=>s.openedAt,ce:s=>s.closedAt,co:s=>s.snapshot.efectivoEsperado,de:s=>s.snapshot.declarado,di:s=>s.snapshot.diferencia};
  const rows=sortRows('cc',cl,acc,{key:'ce',dir:'desc'});
  return '<div class="card" style="margin-top:16px"><h3>Cajas cerradas</h3>'+tableWrap('<table class="tbl"><thead><tr>'+sortHead('cc','n','N.º')+sortHead('cc','ab','Apertura','hide-sm')+sortHead('cc','ce','Cierre')+sortHead('cc','co','Esperado','r hide-sm')+sortHead('cc','de','Contado','r hide-sm')+sortHead('cc','di','Diferencia','r')+'<th scope="col">Sello</th></tr></thead><tbody>'
   +(rows.length?rows.map(s=>'<tr class="clk" data-act="ccView" data-id="'+s.id+'"><td><b>#'+s.n+'</b></td><td class="hide-sm nowrap">'+esc(fdt(s.openedAt))+'</td><td class="nowrap">'+esc(fdt(s.closedAt))+'</td><td class="r num hide-sm">'+esc(fmt(s.snapshot.efectivoEsperado))+'</td><td class="r num hide-sm">'+esc(fmt(s.snapshot.declarado))+'</td><td class="r num">'+(s.snapshot.diferencia?'<b style="color:var(--bad,#b91c1c)">'+esc(fmt(s.snapshot.diferencia))+'</b>':'—')+'</td><td>'+(cashSealOk(s)?badge('Íntegro','ok'):badge('ALTERADO','bad'))+'</td></tr>').join(''):'<tr><td colspan="7"><div class="empty">Todavía no hay cajas cerradas.</div></td></tr>')+'</tbody></table>')+'</div>';
}
ACTS.ccView=el=>{const s=S.cash.sessions.find(x=>x.id===el.dataset.id);if(!s)return;const n=s.snapshot;
  modal({title:'Caja #'+s.n+' (cerrada)',wide:true,html:'<div class="row spread" style="margin-bottom:8px">'+(cashSealOk(s)?badge('Sello íntegro: el resumen no fue modificado','ok'):badge('El resumen no coincide con su sello','bad'))+'<span class="mono xs mut">'+esc(s.hash.slice(0,24))+'…</span></div><div class="grid g2"><div>'+kv('Apertura',esc(fdt(n.openedAt))+' · '+esc(userName(n.openedBy)))+kv('Cierre',esc(fdt(n.closedAt))+' · '+esc(userName(n.closedBy)))+kv('Fondo inicial',esc(fmt(n.fondo)))+Object.entries(n.porMedio).map(([k,v])=>kv(METHODS[k],esc(fmt(v)))).join('')+'</div><div>'+kv('Ingresos manuales',esc(fmt(n.ingresos)))+kv('Egresos',esc(fmt(n.egresos)))+kv('Efectivo esperado',esc(fmt(n.efectivoEsperado)))+kv('Efectivo contado',esc(fmt(n.declarado)))+kv('Diferencia','<b>'+esc(fmt(n.diferencia))+'</b>')+kv('Operaciones',String(n.operaciones))+(n.pendienteDigital?kv('Digital sin verificar al cierre',esc(fmt(n.pendienteDigital))):'')+'</div></div>'+(n.observaciones?'<p><b>Observaciones:</b> '+esc(n.observaciones)+'</p>':'')+((s.notes||[]).length?'<h4>Notas posteriores</h4><ul>'+s.notes.map(x=>'<li>'+esc(x.text)+' <small class="mut">'+esc(userName(x.uid))+' · '+esc(fdt(x.ts))+'</small></li>').join('')+'</ul>':'')
    +(can('cash_close')?'<div class="field" style="margin-top:10px"><label for="cn-t">Agregar nota (no cambia el cierre)</label><input type="text" id="cn-t" maxlength="200"></div>':''),
    buttons:[{label:'Cerrar'},{label:'Imprimir',onClick:()=>{printDoc('cierre',s.id);return false;},keep:true},...(can('cash_close')?[{label:'Agregar nota',cls:'p',onClick:h=>{cashNote(s.id,h.$('#cn-t').value);toast('Nota agregada.','ok');}}]:[])]});};
SCREENS.caja={title:'Caja',perm:'cash',view(){
  const sess=openSession();let h=pageHead('Caja','Todo movimiento de dinero queda con rubro, medio y responsable.');
  if(!sess){
    h+='<div class="card"><h3>La caja está cerrada</h3><p class="mut">Abrila con el efectivo que hay en el cajón para empezar a cobrar.</p>'+(can('cash')?'<div class="row"><div class="field"><label for="co-f">Fondo inicial en efectivo ($)</label><input type="text" inputmode="decimal" data-money id="co-f" placeholder="Efectivo en el cajón"></div><button type="button" class="btn p lg" data-act="cashOpen">Abrir caja</button></div>':'')+'</div>';
  }else h+=cashOpenView(sess);
  return h+cashClosedView();
}};
ACTS.cashOpen=()=>{const v=parseMoney($('#co-f').value);if(isNaN(v)||v<0){toast('Escribí el efectivo inicial (puede ser cero).','bad');return;}run(()=>cashOpen(v),'Caja abierta.');};

/* ---------- Venta de mostrador ---------- */
UI.cart={items:[],clientId:'',q:''};
function cartTotal(){return sum(UI.cart.items,r=>Math.round(r.qty*getItem(r.itemId).priceCents));}
function sellable(){const q=UI.cart.q.trim().toLowerCase();return S.items.filter(i=>!i.archived&&i.sellable&&(!q||(i.name+' '+i.sku).toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name));}
function cartBody(){
  const L=UI.cart.items;
  return '<div class="card"><h3>Venta</h3>'+(L.length?tableWrap('<table class="tbl"><thead><tr><th scope="col">Artículo</th><th scope="col" class="r">Cant.</th><th scope="col" class="r">Importe</th><th scope="col"><span class="sr-only">Quitar</span></th></tr></thead><tbody>'+L.map((r,i)=>{const it=getItem(r.itemId);return '<tr><td>'+esc(it.name)+'<br><small class="mut">'+esc(fmt(it.priceCents))+' c/u</small></td><td class="r" style="width:90px"><input type="text" inputmode="decimal" value="'+esc(fq(r.qty))+'" data-chg="cartQty" data-i="'+i+'" aria-label="Cantidad de '+esc(it.name)+'"></td><td class="r num">'+esc(fmt(Math.round(r.qty*it.priceCents)))+'</td><td><button type="button" class="btn xs d" data-act="cartDel" data-i="'+i+'" aria-label="Quitar '+esc(it.name)+'">'+ic('x',14)+'</button></td></tr>';}).join('')+'</tbody></table>'):'<div class="empty">Elegí artículos de la lista.</div>')
   +'<div class="field" style="margin-top:12px"><label for="ct-c">Cliente (opcional, necesario para cuenta corriente)</label><select id="ct-c" data-chg="cartCli">'+opts(S.clients.filter(c=>!c.anon).map(c=>[c.id,c.name]),UI.cart.clientId,'Consumidor final')+'</select></div>'
   +'<div class="row spread" style="margin-top:12px"><div style="font-size:1.5rem">Total <b class="num">'+esc(fmt(cartTotal()))+'</b></div><div class="row"><button type="button" class="btn" data-act="cartClear"'+(L.length?'':' disabled')+'>Vaciar</button><button type="button" class="btn p lg" data-act="cartPay"'+(L.length?'':' disabled')+'>'+ic('cash',20)+'Cobrar</button></div></div></div>';
}
SCREENS.mostrador={title:'Venta de mostrador',perm:'payments',noAuto:true,view(){
  return pageHead('Venta de mostrador','Accesorios e insumos que se venden sin orden de reparación. Descuentan stock y entran a la caja.')
   +(!openSession()?'<div class="alert warn">'+ic('alert',18)+'La caja está cerrada. <a href="#panel/caja">Abrila</a> para poder cobrar.</div>':'')
   +'<div class="grid g2"><div class="card"><h3>Artículos</h3><div class="field"><label for="ct-q" class="sr-only">Buscar</label><input type="search" id="ct-q" placeholder="Buscar artículo o código…" value="'+esc(UI.cart.q)+'" data-inp="cartQ"></div><div id="ct-list">'+cartList()+'</div></div><div id="ct-cart">'+cartBody()+'</div></div>'
   +'<div class="card" style="margin-top:16px"><h3>Últimas ventas</h3>'+salesTable()+'</div>';
}};
function cartList(){const l=sellable();return l.length?'<div class="col" style="gap:6px;max-height:420px;overflow:auto">'+l.map(i=>{const av=availOf(i.id);return '<button type="button" class="btn" style="justify-content:space-between;text-align:left" data-act="cartAdd" data-id="'+i.id+'"'+(i.requireStock&&av<=0?' disabled':'')+'><span>'+esc(i.name)+'<br><small class="mut">'+esc(i.sku)+' · stock '+esc(fq(av))+'</small></span><b class="num">'+esc(fmt(i.priceCents))+'</b></button>';}).join('')+'</div>':'<div class="empty">No hay artículos para la venta con ese criterio.</div>';}
INP.cartQ=el=>{UI.cart.q=el.value;$('#ct-list').innerHTML=cartList();};
ACTS.cartAdd=el=>{const r=UI.cart.items.find(x=>x.itemId===el.dataset.id);if(r)r.qty+=1;else UI.cart.items.push({itemId:el.dataset.id,qty:1});$('#ct-cart').innerHTML=cartBody();};
ACTS.cartDel=el=>{UI.cart.items.splice(+el.dataset.i,1);$('#ct-cart').innerHTML=cartBody();};
ACTS.cartClear=()=>{UI.cart.items=[];$('#ct-cart').innerHTML=cartBody();};
CHG.cartQty=el=>{const q=parseQty(el.value);if(isNaN(q)||q<=0){toast('La cantidad tiene que ser mayor a cero.','bad');}else UI.cart.items[+el.dataset.i].qty=q;$('#ct-cart').innerHTML=cartBody();};
CHG.cartCli=el=>{UI.cart.clientId=el.value;};
ACTS.cartPay=()=>{
  if(!openSession()){toast('La caja está cerrada. Abrila para poder cobrar.','bad');return;}
  const total=cartTotal();const c=UI.cart.clientId?getClient(UI.cart.clientId):null;const items=UI.cart.items.map(r=>({itemId:r.itemId,qty:r.qty}));
  payModal({title:'Cobrar venta de mostrador',amount:total,client:c,allowCc:true,note:items.length+' artículo'+(items.length>1?'s':''),
    onSubmit:(lines,key)=>saleCreate({items,clientId:UI.cart.clientId||null,lines,key}),onDone:()=>{UI.cart.items=[];UI.cart.clientId='';renderView();}});
};
function salesTable(){
  const ss=[...S.sales].sort((a,b)=>b.ts-a.ts).slice(0,12);
  return ss.length?tableWrap('<table class="tbl"><thead><tr><th scope="col">N.º</th><th scope="col">Fecha</th><th scope="col">Detalle</th><th scope="col" class="r">Total</th><th scope="col">Estado</th></tr></thead><tbody>'+ss.map(s=>'<tr><td>#'+s.n+'</td><td class="nowrap">'+esc(fdt(s.ts))+'</td><td>'+esc(s.items.map(i=>fq(i.qty)+' × '+i.desc).join(', '))+'</td><td class="r num">'+esc(fmt(s.totalCents))+'</td><td>'+(s.status==='anulada'?badge('Anulada','bad'):badge('Cobrada','ok'))+(can('void_pay')&&s.status!=='anulada'&&s.paymentId?' <button type="button" class="btn xs d" data-act="payVoid" data-id="'+s.paymentId+'">Anular</button>':'')+'</td></tr>').join('')+'</tbody></table>'):'<div class="empty">Todavía no hay ventas de mostrador.</div>';
}
