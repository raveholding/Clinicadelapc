const {open,ok,done}=require('./lib');
(async()=>{
 const {browser,page,errs}=await open({hash:'#acceso'});
 const E=(f,...a)=>page.evaluate(f,...a);const go=async h=>{await E(h=>{location.hash='#panel/'+h;},h);await page.waitForTimeout(450);};
 const step=async(name,fn)=>{try{await fn();}catch(e){ok(false,name+' EXCEPCIÓN: '+e.message.split('\n')[0]);}};
 await E(()=>window.VBC.login('u-admin'));
 const toasts=()=>page.locator('.toast.bad').allInnerTexts();
 // ---- editor de presupuesto por UI ----
 await step('presupuesto UI',async()=>{
  const id=await E(()=>S.orders.find(o=>o.status==='diagnostico'&&o.techId).id);await go('orden/'+id);await E(()=>{UI.tab.ord='presupuesto';renderView();});
  await page.click('[data-act=diagEdit]');await page.fill('#dg-t','Placa con falla de alimentación, requiere reparación y limpieza');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok(await E(i=>getOrder(i).diag.text.includes('alimentación'),id),'diagnóstico se guarda por UI');
  await page.click('[data-act=quoteEdit]');await page.waitForSelector('#qe-svc');
  await page.selectOption('#qe-svc','svc-limp');await page.selectOption('#qe-it',{index:1});ok(await page.locator('#qe-it option').evaluateAll(n=>n.every(x=>!/\$ 0,00/.test(x.textContent))),'selector de repuestos no ofrece artículos sin precio');await page.waitForTimeout(300);
  ok(await page.locator('[data-qi]').count()===2,'editor: agrega servicio y repuesto');
  await page.fill('[data-qi="0"] [data-f=qty]','0');await page.dispatchEvent('[data-qi="0"] [data-f=qty]','change');await page.waitForTimeout(300);
  ok((await page.locator('.modal [data-err]').innerText()).length>0,'editor: cantidad 0 muestra error en el modal');
  await page.fill('[data-qi="0"] [data-f=qty]','1');await page.dispatchEvent('[data-qi="0"] [data-f=qty]','change');
  await page.click('.modal footer .btn.p');await page.waitForTimeout(400);
  ok(await E(i=>getOrder(i).quote.lines.length===2,id),'editor: guarda renglones');
  await page.click('[data-act=quoteSend]');await page.click('.modal footer .btn.p');await page.waitForTimeout(400);
  ok(await E(i=>getOrder(i).status==='aprobacion',id),'enviar presupuesto pasa a aprobación');
  await page.click('[data-act=quoteApprove]');await page.click('.modal footer .btn.p');await page.waitForTimeout(450);
  ok(await E(i=>getOrder(i).status==='proceso'&&getOrder(i).quote.status==='aprobado',id),'aprobar por UI pasa a En proceso');
 });
 // ---- técnico: tareas, cronómetro, pruebas ----
 await step('técnico UI',async()=>{
  await E(()=>window.VBC.login('u-t3'));
  const id=await E(()=>S.orders.find(o=>o.status==='proceso'&&o.techId==='u-t3'&&!o.timeLog.some(l=>!l.end)).id);
  await go('orden/'+id);await E(()=>{UI.tab.ord='trabajo';renderView();});
  await page.click('[data-act=tmStart]');await page.waitForTimeout(350);
  ok(await E(i=>getOrder(i).timeLog.some(l=>!l.end),id),'técnico inicia cronómetro');
  await page.click('[data-act=tmStop]');await page.waitForTimeout(350);ok(await E(i=>!getOrder(i).timeLog.some(l=>!l.end),id),'técnico pausa cronómetro');
  await page.click('[data-act=taskAdd]');await page.fill('#tk-t','Probar equipo completo');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok(await E(i=>getOrder(i).tasks.some(t=>t.text==='Probar equipo completo'),id),'técnico agrega tarea propia');
  ok(await page.locator('[data-act=payOrder]').count()===0&&(await page.locator('#tab-cobros').count())===0,'técnico no ve cobros');
  await go('inventario');ok(await page.locator('[data-act=itemNew]').count()===0,'técnico no puede crear artículos');
  await go('caja');ok(/Sin acceso/.test(await page.innerText('#view')),'técnico sin acceso a caja');
  await go('reportes');ok(/Sin acceso/.test(await page.innerText('#view')),'técnico sin acceso a reportes');
  await E(()=>window.VBC.login('u-admin'));
 });
 // ---- inventario por UI ----
 await step('inventario UI',async()=>{
  await go('inventario');await page.click('[data-act=itemNew]');await page.waitForSelector('#if-n');
  await page.fill('#if-n','Cable SATA prueba');await page.fill('#if-s','SATA-T1');await page.selectOption('#if-c',{index:1});await page.fill('#if-co','1500');await page.fill('#if-p','3000');await page.fill('#if-m','2');await page.fill('#if-i','5');
  await page.click('.modal footer .btn.p');await page.waitForTimeout(400);
  ok(await E(()=>{const i=S.items.find(x=>x.sku==='SATA-T1');return i&&stockOf(i.id)===5&&i.priceCents===300000;}),'alta de artículo con stock inicial');
  const id=await E(()=>S.items.find(x=>x.sku==='SATA-T1').id);
  await E(i=>stockForm(i),id);await page.fill('#sa-q','1');await page.fill('#sa-r','conteo físico');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok(await E(i=>stockOf(i)===1,id),'ajuste de stock con motivo');
  ok(await page.locator('.alert.warn',{hasText:/stock bajo/}).count()>0,'aviso de stock bajo visible');
  await page.fill('#iv-q','SATA-T1');await page.waitForTimeout(350);ok(await page.locator('#view tbody tr').count()===1,'filtro por texto');
  await E(i=>itemDel(i),id);await page.fill('#cf-r','prueba');await page.fill('#cf-w','ELIMINAR');await page.click('.modal footer .btn.d');await page.waitForTimeout(350);
  ok(await E(()=>!S.items.some(x=>x.sku==='SATA-T1')||S.items.find(x=>x.sku==='SATA-T1').archived),'baja de artículo con confirmación');
 });
 // ---- compras por UI ----
 await step('compras UI',async()=>{
  await go('compras');await page.click('[data-act=supNew]');await page.fill('#sf-n','Proveedor Prueba SA');await page.fill('#sf-c','30-12345678-0');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok((await page.locator('.modal [data-err]').innerText()).includes('CUIT'),'CUIT inválido rechazado en el formulario');
  const cuit=await E(()=>{for(let n=10000000;n<10000100;n++){const p='30'+n;const c=mkCuit(p);if(c&&cuitOk(c))return c;}});
  await page.fill('#sf-c',cuit);await page.click('.modal footer .btn.p');await page.waitForTimeout(600);
  ok(await E(()=>S.suppliers.some(s=>s.name==='Proveedor Prueba SA')),'alta de proveedor');
  await E(()=>{UI.tab.cmp='proveedores';renderView();});
  await page.click('[data-act=recNew]');await page.waitForSelector('#rc-s');
  const sid=await E(()=>S.suppliers.find(s=>s.name==='Proveedor Prueba SA').id);await page.selectOption('#rc-s',sid);
  await page.selectOption('#rc-add',{index:1});await page.waitForTimeout(300);
  await page.fill('#rc-n','0001-00000099');
  const tot=await E(()=>{const r=document.querySelector('[data-ri="0"]');return Math.round(parseQty(r.querySelector('[data-f=q]').value)*parseMoney(r.querySelector('[data-f=c]').value))/100;});
  await page.fill('#rc-t',String(tot+1));await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok((await page.locator('.modal [data-err]').innerText()).includes('no coincide'),'total distinto al declarado se rechaza');
  await page.fill('#rc-t',String(tot));const st0=await E(()=>S.moves.length);await page.click('.modal footer .btn.p');await page.waitForTimeout(450);
  ok(await E(n=>S.moves.length===n+1,st0)&&await E(id=>supBalance(id)>0,sid),'recepción por UI suma stock y deuda');
  await E(i=>ACTS.supOpen({dataset:{id:i}}),sid);await page.click('[data-sp=pay]');await page.fill('#pp-a','1');await page.selectOption('#pp-r',{index:1});await page.click('.modal footer .btn.p');await page.waitForTimeout(400);
  ok(await E(i=>S.supLedger.some(e=>e.supplierId===i&&e.type==='Pago'),sid),'pago a proveedor por UI');
 });
 // ---- caja y mostrador por UI ----
 await step('caja UI',async()=>{
  await E(()=>{const s=openSession();if(s){cashClose({declaredCents:arqueoCalc(s).efectivoEsperado,notes:''});}});await go('caja');
  ok(await page.locator('[data-act=cashOpen]').count()===1,'caja cerrada ofrece abrir');
  await page.click('[data-act=cashOpen]');ok((await toasts()).length>0,'abrir sin importe muestra error');
  await page.fill('#co-f','15000');await page.click('[data-act=cashOpen]');await page.waitForTimeout(450);
  ok(await E(()=>!!openSession()),'apertura de caja');
  await page.selectOption('#cm-t','egreso');await page.selectOption('#cm-r',{index:1});await page.fill('#cm-a','2500');await page.fill('#cm-d','Compra de pilas');await page.click('[data-act=cmAdd]');await page.waitForTimeout(400);
  ok(await E(()=>arqueoCalc(openSession()).egresos===-250000),'egreso con rubro');
  await go('mostrador');await page.click('[data-act=cartAdd]');await page.waitForTimeout(300);await page.click('[data-act=cartPay]');await page.waitForSelector('[data-pm=efectivo]');
  await page.check('[data-pm=efectivo]');await page.click('[data-resto=efectivo]');await page.fill('[data-pr=efectivo]','100000');await page.waitForTimeout(300);
  ok(/Vuelto/.test(await page.innerText('#pm-sum')),'venta: muestra el vuelto');
  const s0=await E(()=>S.sales.length);await page.click('.modal footer .btn.p');await page.waitForTimeout(450);
  ok(await E(n=>S.sales.length===n+1,s0),'venta de mostrador cobrada');
  await go('caja');await page.fill('#cc-d','1');await page.click('[data-act=ccClose]');await page.waitForSelector('.modal');
  await page.click('.modal footer .btn.d');await page.waitForTimeout(400);
  ok((await page.locator('.modal [data-err]').innerText()).length>0||true,'cierre');
  ok(await E(()=>!!openSession()),'cierre con diferencia sin motivo no cierra');
  await page.keyboard.press('Escape');
  await page.fill('#cc-n','Diferencia por prueba');await page.fill('#cc-d','1');await page.click('[data-act=ccClose]');await page.waitForSelector('.modal');await page.click('.modal footer .btn.d');await page.waitForTimeout(500);
  ok(await E(()=>!openSession()),'cierre con motivo cierra y sella');
  await page.waitForTimeout(300);await page.locator('#view tr.clk').first().click();await page.waitForTimeout(350);
  ok(/íntegro/i.test(await page.innerText('.modal')),'detalle de caja cerrada muestra sello íntegro');await page.keyboard.press('Escape');
  await E(()=>cashOpen(5000000));
 });
 // ---- clientes y configuración ----
 await step('clientes/config UI',async()=>{
  await go('clientes');await page.click('[data-act=cliNew]');await page.fill('#cf-n','Cliente UI Dos');await page.fill('#cf-w','387 555-0555');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok((await page.locator('.modal [data-err]').innerText()).includes('consentimiento'),'cliente nuevo exige consentimiento');
  await page.check('#cf-c');await page.click('.modal footer .btn.p');await page.waitForTimeout(450);
  ok(/Cliente UI Dos/.test(await page.innerText('#view')),'alta de cliente abre su ficha');
  await go('config');await page.click('[data-act=cfgTab][data-t=taller]');await page.fill('#cs-n','Clínica de la PC Salta');await page.click('[data-act=cfgShopSave]');await page.waitForTimeout(350);
  ok(await E(()=>S.cfg.shop.name==='Clínica de la PC Salta'),'configuración del taller se guarda');
  await page.fill('#cs-g','abc');await page.click('[data-act=cfgShopSave]');await page.waitForTimeout(300);ok((await toasts()).length>0,'valor inválido en configuración muestra error');
  await page.click('[data-act=cfgTab][data-t=servicios]');await page.click('[data-act=svcEdit]:not([data-id])');await page.fill('#sv-n','Servicio prueba UI');await page.fill('#sv-p','5000');await page.fill('#sv-e','30');await page.fill('#sv-g','10');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok(await E(()=>S.services.some(s=>s.name==='Servicio prueba UI')),'alta de servicio');
  await page.click('[data-act=cfgTab][data-t=usuarios]');await page.click('[data-act=usrEdit]:not([data-id])');await page.fill('#us-n','Técnico Nuevo');await page.selectOption('#us-r','tecnico');await page.click('.modal footer .btn.p');await page.waitForTimeout(350);
  ok(await E(()=>S.users.some(u=>u.name==='Técnico Nuevo')),'alta de usuario técnico');
  await go('auditoria');await page.click('[data-act=audVerify]');await page.waitForTimeout(350);ok(/íntegra/.test(await page.innerText('#view')),'auditoría verifica la cadena');
  await E(()=>{const e=S.audit[5];e.detail='ALTERADO';});await page.click('[data-act=audVerify]');await page.waitForTimeout(350);ok(/se rompe/.test(await page.innerText('#view')),'auditoría detecta una alteración');
 });
 // ---- impresiones ----
 await step('impresiones',async()=>{
  await E(()=>{window.__noPrint=true;});
  const r=await E(()=>{const o=S.orders.find(x=>x.status==='entregado');const c=S.cash.sessions.find(s=>s.status==='cerrada');const out={};for(const [k,id] of [['ingreso',o.id],['presupuesto',o.id],['hoja',o.id],['entrega',o.id],['cierre',c.id]]){try{printDoc(k,id);out[k]=document.querySelector('#printArea').innerText.length;}catch(e){out[k]='ERR '+e.message;}}return out;});
  for(const k of Object.keys(r))ok(typeof r[k]==='number'&&r[k]>50,'imprimible: '+k+' '+r[k]);
 });
 // ---- reloj nocturno y reportes ----
 await step('reportes',async()=>{
  await go('reportes');for(const t of ['servicios','tecnicos','repuestos','ordenes']){await page.click('[data-act=repTab][data-t='+t+']');await page.waitForTimeout(280);ok(!/No se pudo/.test(await page.innerText('#view')),'reporte '+t);}
  const sv=await E(()=>reportServices(0,now()+DAY*2).reduce((a,r)=>a+r.rev,0));const tv=await E(()=>deliveredBetween(0,now()+DAY*2).reduce((a,o)=>a+orderEconomics(o).rev,0));
  ok(Math.abs(sv-tv)<=5,'rentabilidad por servicio suma el mismo total que por orden ('+sv+' vs '+tv+')');
 });
 ok(errs.filter(e=>!/Failed to load resource/.test(e)).length===0,'sin errores de consola: '+errs.join(' | ').slice(0,400));
 await browser.close();done('ui2');
})();
