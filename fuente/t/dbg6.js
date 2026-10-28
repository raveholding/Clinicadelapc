const {open}=require('./lib');
(async()=>{const {browser,page}=await open({hash:'#acceso'});const E=(f,...a)=>page.evaluate(f,...a);
await E(()=>window.VBC.login('u-admin'));
console.log(await E(()=>{const o=S.orders.find(x=>x.n===10);return JSON.stringify({q:o.quote,tot:quoteTotals(o),type:o.type});}));
await browser.close();})();
