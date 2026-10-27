const {open,ok,done}=require('./lib');
(async()=>{
 const {browser,page,errs}=await open({hash:'#acceso'});
 const E=(f,...a)=>page.evaluate(f,...a);
 await E(()=>{window.VBC.login('u-admin');window.T=(fn)=>{try{const r=fn();return {ok:true,r};}catch(e){return {ok:false,m:e.message};}};});
 // 1 SHA-256
 const sh=await E(async()=>{const out=[];for(const m of ['','abc','Clínica de la PC|1|ñandú'.repeat(30)]){const b=new TextEncoder().encode(m);const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');out.push(h===sha256(m));}return out;});
 ok(sh.every(Boolean),'sha256 síncrono coincide con crypto.subtle '+sh);
 // 2 ingreso atómico
 let r=await E(()=>{const n=S.clients.length,d=S.devices.length,o=S.orders.length;const x=T(()=>orderCreate({newClient:{name:'Prueba Atomica',wa:'387 555-9999',consentCare:true},device:{type:'Notebook',brand:'X',model:'Y',serial:'ZZ1'},fault:'No enciende nada',termsAccepted:true,photos:['no-es-imagen']}));return {x,n:S.clients.length-n,d:S.devices.length-d,o:S.orders.length-o};});
 ok(!r.x.ok&&r.n===0&&r.d===0&&r.o===0,'ingreso con foto inválida no crea nada (todo o nada) '+JSON.stringify(r));
 r=await E(()=>T(()=>orderCreate({newClient:{name:'Sin Consent',wa:'387 555-9998'},device:{type:'Notebook',brand:'X',model:'Y'},fault:'No enciende nada',termsAccepted:true})));
 ok(!r.ok&&/consentimiento/i.test(r.m),'alta de cliente exige consentimiento: '+r.m);
 // 3 ciclo completo
 const cyc=await E(()=>{const log=[];const o=orderCreate({newClient:{name:'Cliente Ciclo',wa:'387 555-7777',consentCare:true},device:{type:'Notebook',brand:'Lenovo',model:'T14',serial:'CYC-1'},fault:'Pantalla con rayas verticales',termsAccepted:true,techId:'u-t1'});
  const id=o.id;const ram=S.items.find(i=>i.sku==='RAM-N8');const st0=stockOf(ram.id);
  log.push(['sin diag no envía',T(()=>quoteSend(id,{})).ok===false]);
  orderMove(id,'diagnostico');diagSave(id,{text:'Se detecta módulo de RAM defectuoso',cause:'RAM'});
  quoteSave(id,{lines:[{kind:'mo',svcId:'svc-ram',desc:'Ampliación RAM',qty:1,unitCents:$p(8000),estMin:20},{kind:'rep',itemId:ram.id,desc:ram.name,qty:2,unitCents:ram.priceCents}]});
  quoteSend(id,{});log.push(['estado aprobacion',getOrder(id).status==='aprobacion']);
  log.push(['sin aprobar no pasa a proceso',T(()=>orderMove(id,'proceso')).ok===false]);
  quoteApprove(id,{via:'whatsapp',by:'Cliente Ciclo'});log.push(['aprobado→proceso',getOrder(id).status==='proceso']);
  log.push(['reserva descuenta disponible',availOf(ram.id)===st0-2&&stockOf(ram.id)===st0]);
  taskAdd(id,{text:'Cambiar módulos de RAM',techId:'u-t1'});
  log.push(['prueba con tarea pendiente falla',T(()=>orderMove(id,'prueba')).ok===false]);
  taskToggle(id,getOrder(id).tasks[0].id);
  log.push(['repuesto reservado sin usar bloquea listo',T(()=>{orderMove(id,'prueba');getOrder(id).tests.forEach((t,i)=>testToggle(id,i));orderMove(id,'listo');}).ok===false]);
  const line=getOrder(id).quote.lines.find(l=>l.kind==='rep');partUse(id,line.id);log.push(['uso descuenta stock físico',stockOf(ram.id)===st0-2]);
  orderMove(id,'listo');log.push(['listo',getOrder(id).status==='listo']);
  log.push(['entrega con saldo falla',T(()=>orderMove(id,'entregado')).ok===false]);
  const due=orderPay(getOrder(id)).due;log.push(['saldo>0',due>0]);
  log.push(['suma distinta falla',T(()=>paymentCreate({kind:'orden',refId:id,amountCents:due,lines:[{m:'efectivo',a:due-100}]})).ok===false]);
  log.push(['QR no combina',T(()=>paymentCreate({kind:'orden',refId:id,amountCents:due,lines:[{m:'qr',a:due-100},{m:'efectivo',a:100}]})).ok===false]);
  const a1=$p(40000),a2=due-a1;const p=paymentCreate({kind:'orden',refId:id,amountCents:due,lines:[{m:'efectivo',a:a1,recibido:$p(50000)},{m:'transferencia',a:a2,ref:'T1'}],key:'k-cyc'});
  log.push(['pago mixto ok',p.lines.length===2&&p.lines[0].change===$p(10000)]);
  log.push(['idempotente por clave',paymentCreate({kind:'orden',refId:id,amountCents:due,lines:[],key:'k-cyc'}).id===p.id]);
  log.push(['digital sin verificar bloquea entrega',T(()=>orderMove(id,'entregado')).ok===false]);
  paymentVerify(p.id,'ok');orderMove(id,'entregado');log.push(['entregada',getOrder(id).status==='entregado'&&getOrder(id).warrantyUntil>now()]);
  log.push(['cobro a orden cerrada falla',T(()=>paymentCreate({kind:'orden',refId:id,amountCents:100,lines:[{m:'efectivo',a:100}]})).ok===false]);
  log.push(['sello de fidelidad',stampsOf(getOrder(id).clientId)===1]);
  log.push(['auditoría íntegra',auditVerify().ok]);
  return log;});
 cyc.forEach(([n,v])=>ok(v,'ciclo: '+n));
 // 4 cuenta corriente límite
 r=await E(()=>{const c=S.clients.find(x=>x.name==='Cliente Ciclo');const sale=T(()=>saleCreate({items:[{itemId:S.items.find(i=>i.sku==='CARG-65').id,qty:1}],clientId:c.id,lines:[{m:'cc',a:$p(22000)}],key:'cc1'}));return sale;});
 ok(!r.ok&&/cuenta corriente|límite/i.test(r.m),'cc sin límite no se permite: '+r.m);
 // 5 caja: cierre con diferencia y sello
 r=await E(()=>{const s=openSession();const ar=arqueoCalc(s);const a=T(()=>cashClose({declaredCents:ar.efectivoEsperado+500,notes:''}));const b=cashClose({declaredCents:ar.efectivoEsperado+500,notes:'Sobrante por redondeo'});const ok1=cashSealOk(b);b.snapshot.declarado+=100;const ok2=cashSealOk(b);b.snapshot.declarado-=100;return {a,ok1,ok2,diff:b.snapshot.diferencia,open:!!openSession()};});
 ok(!r.a.ok&&/diferencia/i.test(r.a.m),'cierre con diferencia exige motivo');ok(r.ok1&&!r.ok2,'sello de caja detecta alteración');ok(r.diff===500&&!r.open,'caja cerrada con diferencia registrada');
 r=await E(()=>T(()=>cashMove({type:'egreso',amountCents:100,rubroId:S.rubros.find(x=>x.name==='Varios').id,desc:'x x x x'})));ok(!r.ok&&/cerrada/i.test(r.m),'sin caja abierta no hay movimientos');
 await E(()=>{cashOpen($p(10000));});
 // 6 permisos
 const perms=await E(()=>{const out=[];const as=(uid,fn)=>{const prev=SESSION.uid;SESSION.uid=uid;const r=T(fn);SESSION.uid=prev;return r;};
  const o=S.orders.find(x=>x.status==='listo');
  out.push(['técnico no cobra',!as('u-t1',()=>paymentCreate({kind:'orden',refId:o.id,amountCents:100,lines:[{m:'efectivo',a:100}]})).ok]);
  out.push(['técnico no cancela',!as('u-t1',()=>orderMove(o.id,'cancelado',{reason:'x x x'})).ok]);
  out.push(['técnico no edita inventario',!as('u-t1',()=>stockAdjust(S.items[0].id,50,'motivo x')).ok]);
  out.push(['mostrador no trabaja órdenes',!as('u-mos',()=>timerStart(S.orders.find(x=>x.status==='proceso').id)).ok]);
  out.push(['mostrador no cierra caja',!as('u-mos',()=>cashClose({declaredCents:0,notes:'x x x x x'})).ok]);
  out.push(['supervisor no es admin de config',!as('u-sup',()=>cfgShop({name:'X'})).ok]);
  out.push(['técnico no ve costos',!can('view_costs',userById('u-t1'))&&can('view_costs',userById('u-sup'))]);
  out.push(['técnico no ve WhatsApp en ficha',(()=>{const prev=SESSION.uid;SESSION.uid='u-t1';UI.params=[S.orders[0].id];UI.tab.ord='resumen';const h=tabResumen(S.orders[0]);SESSION.uid=prev;return !h.includes(getClient(S.orders[0].clientId).wa);})()]);
  return out;});
 perms.forEach(([n,v])=>ok(v,'permisos: '+n));
 // 7 proveedores y compras
 const comp=await E(()=>{const out=[];const sup=S.suppliers[0];
  out.push(['CUIT inválido',!T(()=>supplierSave({name:'Prov X',cuit:'30-12345678-0'})).ok]);
  const it=S.items.find(i=>i.sku==='PASTA');const st0=stockOf(it.id);const bal0=supBalance(sup.id);
  out.push(['total declarado distinto falla',!T(()=>receiptCreate({supplierId:sup.id,docType:'Factura',docNo:'T-0001',date:now(),lines:[{itemId:it.id,qty:2,costCents:$p(3700)}],declaredTotalCents:1,condition:'cc'})).ok]);
  const rc=receiptCreate({key:'rk1',supplierId:sup.id,docType:'Factura',docNo:'T-0002',date:now(),lines:[{itemId:it.id,qty:2,costCents:$p(3700)}],declaredTotalCents:$p(7400),condition:'cc'});
  out.push(['recepción suma stock y deuda',stockOf(it.id)===st0+2&&supBalance(sup.id)===bal0+$p(7400)]);
  out.push(['recepción idempotente',receiptCreate({key:'rk1',supplierId:sup.id,docType:'Factura',docNo:'otro',date:now(),lines:[],declaredTotalCents:0,condition:'cc'}).id===rc.id&&stockOf(it.id)===st0+2]);
  out.push(['comprobante duplicado falla',!T(()=>receiptCreate({supplierId:sup.id,docType:'Factura',docNo:'T-0002',date:now(),lines:[{itemId:it.id,qty:1,costCents:100}],declaredTotalCents:100,condition:'cc'})).ok]);
  out.push(['pago > deuda falla',!T(()=>supplierPay({supplierId:sup.id,amountCents:supBalance(sup.id)+100,method:'transferencia',rubroId:S.rubros.find(x=>x.name==='Varios').id})).ok]);
  out.push(['costo del artículo actualizado',it.costCents===$p(3700)]);
  return out;});
 comp.forEach(([n,v])=>ok(v,'compras: '+n));
 // 8 consulta pública
 const pub=await E(()=>{const d=S.demo;const o=S.orders.find(x=>x.n===d.n);const a=publicLookup(d.n,d.last4);const b=publicLookup(d.n,'9999');const c=publicLookup(9999,d.last4);
  const keys=Object.keys(a||{});for(let i=0;i<10;i++)publicLookup(d.n,'0000');const lim=publicLookup(d.n,d.last4);
  return {a:!!a,b:b===null,c:c===null,priv:!/Silvia|Roberto|Paula|387|dni/i.test(JSON.stringify(a)),lim:lim&&lim.limited};});
 ok(pub.a,'consulta pública correcta');ok(pub.b&&pub.c,'error genérico con datos erróneos');ok(pub.priv,'la consulta pública no expone datos personales');ok(pub.lim,'límite de intentos');
 // 9 XSS
 await E(()=>{const c=S.clients[0];c.name='<img src=x onerror="window.__xss=1">Hack';const o=S.orders.find(x=>x.clientId===c.id);o.intake.fault='<script>window.__xss=2</script><b onmouseover=1>';});
 for(const route of ['ordenes','clientes','inventario','orden/'+await E(()=>S.orders.find(x=>x.clientId===S.clients[0].id).id),'notificaciones','resumen']){await E(r=>{location.hash='#panel/'+r;},route);await page.waitForTimeout(150);}
 await E(()=>{UI.f.ord.view='lista';location.hash='#panel/ordenes';renderView();});await page.waitForTimeout(150);
 ok(await E(()=>window.__xss===undefined),'XSS: ningún script de campos de usuario se ejecutó');
 ok(await E(()=>!document.querySelector('#view img[src="x"]')),'XSS: el HTML de un campo no se interpreta');
 // 10 orden UI: modal de cobro
 await E(()=>{S.clients[0].name='Roberto Aguirre';UI.f.ord.view='tablero';});
 const r2=await E(()=>S.orders.find(o=>o.status==='listo').id);
 await E(i=>{location.hash='#panel/orden/'+i;UI.tab.ord='cobros';renderView();},r2);await page.waitForTimeout(150);
 await page.click('[data-act=payOrder]');await page.waitForSelector('.modal');
 const due=await E(i=>orderPay(getOrder(i)).due,r2);
 ok(await page.isDisabled('.modal footer .btn.p'),'modal de cobro: confirmar deshabilitado sin importes');
 await page.check('[data-pm=efectivo]');await page.fill('[data-pa=efectivo]',String(Math.round(due/100)-1000));
 await page.waitForTimeout(50);ok(await page.isDisabled('.modal footer .btn.p'),'modal de cobro: sigue deshabilitado si falta importe');
 await page.check('[data-pm=transferencia]');await page.click('[data-resto=transferencia]');await page.waitForTimeout(50);
 ok(await page.isEnabled('.modal footer .btn.p'),'modal de cobro: con el Resto cierra y se habilita');
 await page.click('.modal footer .btn.p');await page.waitForTimeout(200);
 ok(await E(i=>orderPay(getOrder(i)).due===0&&orderPay(getOrder(i)).pend>0,r2),'cobro mixto registrado desde la interfaz (digital pendiente)');
 // 11 persistencia
 await E(()=>{clientSave({name:'Persistente Prueba',wa:'387 555-5555',consentCare:true});});await E(()=>window.VBC.flush());
 await page.reload();await page.waitForFunction(()=>window.VBC&&window.VBC.ready);await E(()=>window.VBC.ready);
 ok(await E(()=>S.clients.some(c=>c.name==='Persistente Prueba')),'persistencia: el dato sobrevive a recargar');
 ok(await E(()=>auditVerify().ok),'auditoría íntegra tras recargar');
 // 12 copia de seguridad
 await E(()=>{window.T=(fn)=>{try{const r=fn();return {ok:true,r};}catch(e){return {ok:false,m:e.message};}};});
 const bk=await E(()=>{const j=backupJson();const bad=T(()=>backupRestore('{"x":1}'));const bad2=T(()=>backupRestore('no json'));const st=backupRestore(j);return {len:j.length>1000,bad:!bad.ok,bad2:!bad2.ok,orders:st.orders.length===S.orders.length};});
 ok(bk.len&&bk.bad&&bk.bad2&&bk.orders,'copia de seguridad: exporta, valida y rechaza archivos inválidos '+JSON.stringify(bk));
 ok(errs.filter(e=>!/SEED/.test(e)).length===0,'sin errores de consola en el recorrido: '+errs.join(' | ').slice(0,300));
 await browser.close();done('flows');
})();
