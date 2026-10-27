const {open,ok,done}=require('./lib');
(async()=>{
  const {browser,page,errs}=await open();
  ok(errs.length===0,'sin errores de consola al arrancar: '+errs.join(' | '));
  const info=await page.evaluate(()=>({o:S.orders.length,c:S.clients.length,i:S.items.length,a:window.VBC.auditVerify(),demo:S.demo,seeded:S.seeded,notif:S.notifs.length,pays:S.payments.length,cash:S.cash.sessions.length}));
  console.log(JSON.stringify(info));
  ok(info.o>=25,'órdenes de ejemplo: '+info.o);
  ok(info.a.ok,'cadena de auditoría íntegra');
  await page.screenshot({path:'/tmp/claude-0/shot-public.png'});
  await browser.close();done('smoke');
})();
