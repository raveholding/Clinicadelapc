const {open}=require('./lib');
(async()=>{const {browser,page}=await open({hash:'#acceso'});const E=(f,...a)=>page.evaluate(f,...a);
await E(()=>window.VBC.login('u-admin'));
console.log(await E(()=>JSON.stringify([S.users.map(u=>u.id+':'+u.role),S.orders.filter(o=>o.status==='proceso').map(o=>o.techId+'/'+o.timeLog.some(l=>!l.end))])));
console.log(await E(()=>Object.keys(window).filter(k=>/^(stockForm|itemDel|stock|adj|item)/i.test(k)).join(',')));
console.log(await E(()=>Object.keys(ACTS).filter(k=>/item|stock|svc|usr|sup|rec|pay|cash|cc|cm|ccv/i.test(k)).join(',')));
await browser.close();})();
