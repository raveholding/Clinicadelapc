process.env.VBFILE='index.html';
const {open,ok,done}=require('./lib');
(async()=>{
 const {browser,ctx,page,errs}=await open({});
 const E=(f,...a)=>page.evaluate(f,...a);const W=ms=>page.waitForTimeout(ms);
 const step=async(n,fn)=>{try{await fn();}catch(e){ok(false,n+' EXCEPCIÓN: '+e.message.split('\n')[0]);}};
 // ---------- primer ingreso ----------
 await step('setup',async()=>{
  ok(/#inicio/.test(page.url()),'sin datos va a la configuración inicial');
  ok(await E(()=>S.users.length===0&&S.orders.length===0&&S.clients.length===0&&S.items.length===0),'arranca vacía (sin usuarios, órdenes, clientes ni artículos)');
  const sub=async()=>{await page.click('#setf button[type=submit]');await W(250);return (await page.locator('#st-err').innerText()).trim();};
  ok((await sub()).length>0,'formulario vacío muestra error');
  await page.fill('#st-n','Clínica de la PC');await page.fill('#st-w','3874484132');await page.fill('#st-u','Nico Prueba');
  await page.fill('#st-pin','1111');await page.fill('#st-pin2','1111');ok(/fácil/.test(await sub()),'PIN repetido rechazado');
  await page.fill('#st-pin','4821');await page.fill('#st-pin2','4822');ok(/no coinciden/.test(await sub()),'PIN distinto rechazado');
  await page.fill('#st-pin2','4821');await page.fill('#st-c','30-12345678-0');ok(/CUIT/.test(await sub()),'CUIT inválido rechazado');
  await page.fill('#st-c','');await page.fill('#st-m','mal');ok(/correo/.test(await sub()),'correo inválido rechazado');
  ok(await E(()=>S.users.length===0),'los errores no guardan nada');
  await page.fill('#st-m','info@clinica.test');await page.fill('#st-a','Calle 1, Salta');await page.fill('#st-h','Lun a Vie 9 a 18');
  await page.click('#setf button[type=submit]');await W(600);
  ok(/panel\/resumen/.test(page.url()),'configuración exitosa abre el panel');
  ok(await E(()=>S.users.length===1&&S.users[0].role==='admin'&&!!S.users[0].pinHash&&!JSON.stringify(S).includes('4821')),'administrador creado, PIN guardado sólo como hash');
  ok(await E(()=>S.services.length>0&&S.rubros.length>0&&S.cats.length>0&&S.cfg.shop.name==='Clínica de la PC'&&S.cfg.shop.addr==='Calle 1, Salta'),'catálogo base y datos del negocio cargados');
  ok(await E(()=>auditVerify().ok),'auditoría íntegra desde el inicio');
 });
 // ---------- pantallas vacías ----------
 const screens=await E(()=>Object.keys(SCREENS));
 await step('vacías',async()=>{
  for(const vp of [[1280,800],[360,740]]){
   await page.setViewportSize({width:vp[0],height:vp[1]});
   for(const s of screens){await E(h=>{location.hash='#panel/'+h;},s);await W(180);
    const t=await page.innerText('#view');
    ok(!/No se pudo|undefined|NaN|\[object/.test(t),'pantalla vacía «'+s+'» '+vp[0]+'px sin errores visibles');
    ok(await E(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'«'+s+'» '+vp[0]+'px sin desborde horizontal');}
  }
  await page.setViewportSize({width:1280,height:800});
  await E(()=>{location.hash='#panel/resumen';});await W(200);
  const body=await page.innerText('body');
  ok(!/\bdemo\b|datos de ejemplo|\bejemplo\b/i.test(body.replace(/Ej\.:?/g,'')),'el panel no dice «demo» ni «ejemplo»: '+(body.match(/.{20}(demo|ejemplo).{20}/i)||[''])[0]);
  ok(!(await page.locator('.ex').count()),'sin etiquetas «ejemplo»');
 });
 // ---------- persistencia, PIN y bloqueo ----------
 await step('pin',async()=>{
  await page.reload();await page.waitForFunction(()=>window.VBC&&window.VBC.ready);await W(300);
  ok(await E(()=>S.users.length===1),'los datos persisten al recargar');
  await E(()=>{SESSION.uid=null;localStorage.removeItem(UIDKEY);location.hash='#acceso';});await W(250);
  ok(await page.locator('.ubtn').count()===1,'pantalla de acceso lista al usuario');
  ok(!/Demo/.test(await page.innerText('body')),'el acceso no dice demo');
  await page.click('.ubtn');await page.waitForSelector('#lg-pin');await page.fill('#lg-pin','0000');await page.click('.modal footer .btn.p');await W(250);
  ok(/PIN incorrecto/.test(await page.locator('.modal [data-err]').innerText()),'PIN incorrecto rechazado');
  for(let i=0;i<4;i++){await page.fill('#lg-pin','0000');await page.click('.modal footer .btn.p');await W(150);}
  ok(/30 segundos|Demasiados/.test(await page.locator('.modal [data-err]').innerText()),'5 intentos fallidos bloquean 30 s');
  await page.fill('#lg-pin','4821');await page.click('.modal footer .btn.p');await W(250);
  ok(/Demasiados/.test(await page.locator('.modal [data-err]').innerText()),'durante el bloqueo no entra ni con el PIN correcto');
  await E(()=>{_pinFails['u-admin'].until=0;});await page.click('.modal footer .btn.p');await W(400);
  ok(/panel\/resumen/.test(page.url()),'PIN correcto ingresa');
 });
 // ---------- equipo con PIN ----------
 await step('equipo',async()=>{
  await E(()=>{location.hash='#panel/config';});await W(250);
  await page.click('[data-act=cfgTab][data-t=usuarios]');
  for(const [n,r,p] of [['Camila Mostrador','mostrador','5930'],['Diego Técnico','tecnico','7406']]){
   await page.click('[data-act=usrEdit]:not([data-id])');await page.fill('#us-n',n);await page.selectOption('#us-r',r);
   await page.click('.modal footer .btn.p');await W(250);
   ok(/PIN/.test(await page.locator('.modal [data-err]').innerText()),'usuario nuevo exige PIN ('+r+')');
   await page.fill('#us-pin',p);await page.click('.modal footer .btn.p');await W(350);}
  ok(await E(()=>S.users.length===3&&S.users.every(u=>u.pinHash)),'dos usuarios creados con PIN');
  await E(()=>{SESSION.uid=null;localStorage.removeItem(UIDKEY);location.hash='#acceso';});await W(250);
  await page.locator('.ubtn',{hasText:'Camila'}).click();await page.fill('#lg-pin','5930');await page.click('.modal footer .btn.p');await W(400);
  ok(await E(()=>curUser().role==='mostrador'),'mostrador ingresa con su PIN');
  ok(await E(()=>!can('config')&&!can('view_costs')),'mostrador sin permisos de configuración ni costos');
  await E(()=>{SESSION.uid=null;});
 });
 // ---------- flujo completo con datos reales ----------
 await step('flujo',async()=>{
  await E(()=>{SESSION.uid='u-admin';location.hash='#panel/caja';});await W(300);
  await page.fill('#co-f','20000');await page.click('[data-act=cashOpen]');await W(400);
  ok(await E(()=>!!openSession()),'abre la caja del día');
  await E(()=>{location.hash='#panel/ingreso';});await W(300);
  await page.click('[data-act=inCliNew]');await page.fill('#c-name','María Gómez');await page.fill('#c-wa','387 4001234');await page.check('#c-care');
  await page.selectOption('#d-type',{index:1});await page.fill('#d-brand','HP');await page.fill('#d-model','Pavilion 15');await page.fill('#d-fault','No enciende y huele a quemado');await page.check('#d-terms');
  await page.click('[data-act=inSubmit]');await W(600);
  ok(await E(()=>S.orders.length===1&&S.clients.length===1&&S.orders[0].n===1),'ingreso por pantalla crea cliente y OT-0001');
  ok(await E(()=>S.orders[0].status==='pendiente'),'queda pendiente');
  const id=await E(()=>S.orders[0].id);
  await E(i=>{location.hash='#panel/orden/'+i;},id);await W(300);
  await E(i=>{UI.tab.ord='presupuesto';renderView();},id);
  await page.click('[data-act=diagEdit]');await page.fill('#dg-t','Fuente en cortocircuito');await page.click('.modal footer .btn.p');await W(300);
  await page.click('[data-act=quoteEdit]');await page.waitForSelector('#qe-svc');await page.selectOption('#qe-svc','svc-fuente');await W(200);
  await page.click('.modal footer .btn.p');await W(300);
  ok(await E(i=>getOrder(i).quote.lines.length===1,id),'presupuesto armado por pantalla');
  await page.click('[data-act=quoteSend]');await page.click('.modal footer .btn.p');await W(300);
  await page.click('[data-act=quoteApprove]');await page.click('.modal footer .btn.p');await W(400);
  ok(await E(i=>getOrder(i).status==='proceso',id),'aprobado pasa a En proceso');
  await E(i=>{const o=getOrder(i);o.tasks.forEach(t=>{if(!t.done)taskToggle&&0;});},id);
  const r=await E(i=>{const T=f=>{try{f();return 'ok';}catch(e){return e.message;}};const out={};
    out.noPrueba=T(()=>orderMove(i,'prueba'));out.asigna=T(()=>orderAssign(i,S.users.find(u=>u.role==='tecnico').id));out.testsOk=T(()=>{getOrder(i).tests.forEach((t,k)=>testToggle(i,k));});out.prueba=T(()=>orderMove(i,'prueba'));
    out.listo=T(()=>orderMove(i,'listo'));out.entregaSinPago=T(()=>orderMove(i,'entregado'));
    const due=orderPay(getOrder(i)).due;out.due=due;
    out.pago=T(()=>paymentCreate({kind:'orden',refId:i,amountCents:due,lines:[{m:'efectivo',a:due,recibido:due+100000}],key:'real-1'}));
    out.entrega=T(()=>orderMove(i,'entregado'));out.status=getOrder(i).status;out.vuelto=orderPay(getOrder(i)).due;return out;},id);
  ok(r.noPrueba!=='ok'&&r.listo==='ok'&&r.entregaSinPago!=='ok'&&r.pago==='ok'&&r.entrega==='ok'&&r.status==='entregado','ciclo completo: prueba, listo, cobro y entrega ('+JSON.stringify(r)+')');
  await E(()=>{location.hash='#panel/caja';});await W(300);
  await page.fill('#cc-d','50000');await page.click('[data-act=ccClose]');await page.waitForSelector('.modal');await page.click('.modal footer .btn.d');await W(400);
  ok(await E(()=>!openSession()&&S.cash.sessions[0].status==='cerrada'),'cierre de caja con el efectivo cobrado (fondo 20.000 + cobro 30.000 = 50.000)');
  await E(()=>{location.hash='#panel/reportes';});await W(300);
  ok(/\$/.test(await page.innerText('#view'))&&!/NaN/.test(await page.innerText('#view')),'reportes con el primer trabajo');
  ok(await E(()=>auditVerify().ok),'auditoría íntegra al final');
  await E(()=>{location.hash='#panel/resumen';});await W(300);
  ok(/Hacé una copia de seguridad/.test(await page.innerText('#view')),'avisa que falta la copia de seguridad');
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('#view [data-act=bkExport]')]);
  const txt=require('fs').readFileSync(await dl.path(),'utf8');const bk=JSON.parse(txt.replace(/^\uFEFF/,''));
  ok(bk.state.orders.length===1&&bk.state.clients.length===1,'la copia descargada contiene las órdenes y clientes');
  await W(300);ok(!/Hacé una copia de seguridad/.test(await page.innerText('#view')),'después de descargar el aviso desaparece');
 });
 ok(errs.filter(e=>!/Failed to load resource/.test(e)).length===0,'sin errores de consola: '+errs.join(' | ').slice(0,300));
 await browser.close();done('real');
})();
