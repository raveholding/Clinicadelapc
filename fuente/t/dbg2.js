const {open}=require('./lib');
(async()=>{const {browser,page}=await open({hash:'#acceso'});const E=(f,...a)=>page.evaluate(f,...a);
await E(()=>window.VBC.login('u-admin'));
console.log(await E(()=>JSON.stringify([S.services.slice(0,3).map(s=>[s.name,s.priceCents]),S.items.slice(0,3).map(i=>[i.name,i.priceCents,i.costCents])])));
console.log(await E(()=>S.items.filter(i=>!i.priceCents).map(i=>i.name).join('|')));
await browser.close();})();
