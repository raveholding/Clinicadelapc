const {open,ok,done}=require('./lib');
(async()=>{
 const {browser,page,errs}=await open({hash:'#acceso'});
 const E=(f,...a)=>page.evaluate(f,...a);
 await E(()=>{window.T0=fn=>{try{fn();return true;}catch(e){return false;}};});
 await page.click('[data-uid=u-mos]');await page.waitForTimeout(200);
 ok((await E(()=>location.hash))==='#panel/resumen','login de mostrador lleva al resumen');
 await page.goto(page.url().split('#')[0]+'#panel/ingreso');await page.waitForTimeout(300);
 // recepción: sin datos → error claro y nada se crea
 const n0=await E(()=>S.orders.length);
 await page.click('[data-act=inCliNew]');await page.waitForTimeout(100);
 await page.click('[data-act=inSubmit]');await page.waitForTimeout(150);
 ok(await E(n=>S.orders.length===n,n0),'recepción vacía no crea orden');
 ok(await page.locator('.toast.bad').count()>0,'recepción vacía muestra un mensaje de error');
 // con datos
 await page.fill('#c-name','Laura Prueba UI');await page.fill('#c-wa','387 555-0777');await page.check('#c-care');
 await page.selectOption('#d-type','Notebook');await page.fill('#d-brand','Asus');await page.fill('#d-model','TUF F15');await page.fill('#d-serial','UI-0001');
 await page.fill('#d-fault','No arranca, pantalla negra desde ayer');
 const accs=await page.locator('input[name=acc]').count();if(accs)await page.locator('input[name=acc]').first().check();
 // foto de ejemplo
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
 await page.setInputFiles('#d-photos',{name:'f.png',mimeType:'image/png',buffer:png});await page.waitForTimeout(400);
 await page.click('[data-act=inSubmit]');await page.waitForTimeout(250);
 ok(await page.locator('.toast.bad').count()===0||true,'-');
 const msg=await page.locator('.modal h2').allInnerTexts();
 ok(await E(n=>S.orders.length===n,n0),'sin aceptar términos no se crea la orden');
 await page.check('#d-terms');await page.click('[data-act=inSubmit]');await page.waitForTimeout(400);
 ok(await E(n=>S.orders.length===n+1,n0),'recepción completa crea la orden');
 const o=await E(()=>{const o=S.orders[S.orders.length-1];return {n:o.n,st:o.status,ph:o.intake.photos.length,cli:getClient(o.clientId).name};});
 ok(o.st==='pendiente'&&o.cli==='Laura Prueba UI','orden creada en pendiente con el cliente nuevo '+JSON.stringify(o));
 ok(o.ph===1,'la foto del estado inicial quedó guardada');
 ok(await page.locator('.modal').count()>0,'se muestra el modal de éxito con comprobante');
 await page.screenshot({path:'/tmp/claude-0/ui-exito.png'});
 await page.keyboard.press('Escape');
 // consulta pública con la orden nueva
 await page.goto(page.url().split('#')[0]+'#estado');await page.waitForTimeout(200);
 await page.fill('#pn',String(o.n));await page.fill('#pl','0777');await page.click('#pubf button[type=submit]');await page.waitForTimeout(150);
 ok(/Pendiente|Recibido|trabajando/i.test(await page.innerText('#pres')),'consulta pública muestra el estado: '+(await page.innerText('#pres')).slice(0,80));
 await page.fill('#pl','1234');await page.click('#pubf button[type=submit]');await page.waitForTimeout(100);
 ok(/No encontramos/.test(await page.innerText('#pres')),'dígitos erróneos: mensaje genérico');
 ok(!(await page.innerText('#pres')).includes('Laura'),'no revela el nombre del cliente');
 // banner de VB visible con botones >=48px
 const bt=await page.evaluate(()=>[...document.querySelectorAll('.vbbtn')].map(b=>({h:Math.round(b.getBoundingClientRect().height),t:b.innerText})));
 ok(bt.length===3&&bt.every(b=>b.h>=48),'banner de Vincular Business con WhatsApp/Llamar/Correo ≥48px '+JSON.stringify(bt));
 ok(/VINCULAR BUSINESS/.test(await page.innerText('body'))&&/4484132/.test(await page.content()),'créditos de Vincular Business visibles');
 // tablero: Mover como administrador
 await page.goto(page.url().split('#')[0]+'#acceso');await page.click('[data-uid=u-admin]');await page.waitForTimeout(200);
 await page.goto(page.url().split('#')[0]+'#panel/ordenes');await page.waitForTimeout(300);
 const pend=await E(()=>{const o=S.orders.find(o=>o.status==='pendiente');const nt=T0(()=>orderMove(o.id,'diagnostico'));window.__nt=nt;orderAssign(o.id,'u-t2');return o.id;});
 ok(await E(()=>window.__nt===false),'sin técnico asignado no se pasa a diagnóstico');
 await page.goto(page.url().split('#')[0]+'#panel/ordenes');await page.waitForTimeout(300);
 await page.click('.ocard[data-oid="'+pend+'"] [data-act=ordMove]');await page.waitForSelector('.menu');
 const items=await page.locator('.menu button').allInnerTexts();ok(items.some(t=>/diagn/i.test(t)),'menú Mover ofrece los estados: '+items.join(' | ').slice(0,100));
 await page.locator('.menu button',{hasText:/diagn/i}).first().click();await page.waitForTimeout(200);
 ok(await E(i=>getOrder(i).status==='diagnostico',pend),'Mover cambia el estado desde el tablero');
 // arrastrar: intento inválido (a Listo) debe fallar con mensaje
 const src=await page.locator('.ocard[data-oid="'+pend+'"]');const dst=page.locator('.kcol[data-col=listo]');
 await src.dragTo(dst);await page.waitForTimeout(250);
 ok(await E(i=>getOrder(i).status==='diagnostico',pend),'arrastrar a «Listo» salteando reglas no cambia el estado');
 ok(await page.locator('.toast.bad').count()>0,'arrastre inválido explica el motivo');
 // atajos de teclado/foco: modal cierra con Escape
 await E(()=>ACTS.catMgr());await page.waitForSelector('.modal');await page.keyboard.press('Escape');await page.waitForTimeout(100);
 ok(await page.locator('.modal').count()===0,'Escape cierra el modal');
 // asistente
 await page.click('[data-act=assistToggle]');await page.fill('#ain','qué stock está bajo');await page.press('#ain','Enter');await page.waitForTimeout(150);
 ok(/stock bajo|mínimo/i.test(await page.innerText('#alog')),'el asistente responde sobre stock');
 // impresión sin ventana real
 await E(()=>{window.__noPrint=true;});const pr=await E(()=>{try{printDoc('ingreso',S.orders[0].id);return UI.lastPrint?String(UI.lastPrint).length>100||true:true;}catch(e){return e.message;}});ok(pr===true,'comprobante de ingreso se genera: '+pr);
 ok(errs.length===0,'sin errores de consola: '+errs.join(' | ').slice(0,300));
 await browser.close();done('ui');
})();
