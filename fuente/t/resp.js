const {open,ok,done}=require('./lib');
const SCR=['resumen','ingreso','ordenes','caja','mostrador','inventario','compras','clientes','equipo','notificaciones','reportes','config','auditoria'];
(async()=>{
 for(const w of [360,768,1280]){
  const {browser,page,errs}=await open({viewport:{width:w,height:800},hash:'#acceso'});
  await page.evaluate(()=>window.VBC.login('u-admin'));
  const ords=await page.evaluate(()=>S.orders.slice(10,13).map(o=>o.id));
  const routes=[...SCR.map(s=>s),...ords.map(i=>'orden/'+i)];
  for(const r of routes){
    await page.evaluate(r=>{location.hash='#panel/'+r;},r);await page.waitForTimeout(120);
    const m=await page.evaluate(()=>{const de=document.documentElement;const over=de.scrollWidth-de.clientWidth;
      const small=[...document.querySelectorAll('#view button, #view a.btn, #view select, #view input:not([type=checkbox]):not([type=radio]):not([type=hidden]), .top button, .top a.btn')].filter(e=>e.offsetParent!==null&&!e.closest('.tbl')&&!e.closest('.kanban')).map(e=>{const r=e.getBoundingClientRect();return {h:Math.round(r.height),t:(e.innerText||e.getAttribute('aria-label')||e.id||'').slice(0,24),c:e.className}}).filter(x=>x.h>0&&x.h<44&&!/xs|sr-only/.test(x.c));
      return {over,small:small.slice(0,4)};});
    ok(m.over<=1,w+'px '+r+' desborde horizontal de página: '+m.over+'px');
    ok(m.small.length===0,w+'px '+r+' objetivos táctiles <44px: '+JSON.stringify(m.small));
  }
  ok(errs.length===0,w+' errores: '+errs.join('|').slice(0,200));
  if(w===360){await page.evaluate(()=>{location.hash='#panel/ordenes';});await page.waitForTimeout(200);await page.screenshot({path:'/tmp/claude-0/m-ordenes.png'});await page.evaluate(r=>{location.hash='#panel/orden/'+r;},ords[0]);await page.waitForTimeout(200);await page.screenshot({path:'/tmp/claude-0/m-orden.png',fullPage:false});}
  await browser.close();
 }
 done('resp');
})();
