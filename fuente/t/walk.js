const {open,ok,done}=require('./lib');
const SCR=['resumen','ingreso','ordenes','caja','mostrador','inventario','compras','clientes','equipo','notificaciones','reportes','config','auditoria'];
(async()=>{
  const {browser,page,errs}=await open({hash:'#acceso'});
  for(const [uid,name] of [['u-admin','admin'],['u-sup','sup'],['u-mos','mostrador'],['u-t1','tecnico']]){
    await page.evaluate(id=>{window.VBC.login(id);},uid);
    for(const s of SCR){
      errs.length=0;
      await page.evaluate(s=>{location.hash='#panel/'+s;},s);await page.waitForTimeout(150);
      const txt=await page.evaluate(()=>document.querySelector('#view')?document.querySelector('#view').innerText.slice(0,80):'NOVIEW');
      ok(errs.length===0,name+'/'+s+' errores: '+errs.join(' | ').slice(0,300));
      ok(txt!=='NOVIEW'&&!/No se pudo mostrar/.test(txt),name+'/'+s+' pantalla: '+txt.replace(/\n/g,' '));
      if(uid==='u-admin')await page.screenshot({path:'/tmp/claude-0/s-'+s+'.png'});
    }
  }
  // fichas
  await page.evaluate(()=>window.VBC.login('u-admin'));
  const ids=await page.evaluate(()=>({o:S.orders.map(o=>o.id),c:S.clients.map(c=>c.id)}));
  for(const id of ids.o){errs.length=0;await page.evaluate(i=>{location.hash='#panel/orden/'+i;},id);await page.waitForTimeout(60);
    for(const t of ['resumen','presupuesto','trabajo','cobros','historial']){await page.evaluate(t=>{UI.tab.ord=t;renderView();},t);}
    ok(errs.length===0,'orden '+id+' errores: '+errs.join(' | ').slice(0,300));}
  for(const id of ids.c){errs.length=0;await page.evaluate(i=>{location.hash='#panel/cliente/'+i;},id);await page.waitForTimeout(60);ok(errs.length===0,'cliente '+id+': '+errs.join(' | ').slice(0,300));}
  await browser.close();done('walk');
})();
