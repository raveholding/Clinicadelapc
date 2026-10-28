const {open}=require('./lib');
(async()=>{const {browser,page}=await open({hash:'#acceso'});const E=(f,...a)=>page.evaluate(f,...a);
await E(()=>window.VBC.login('u-admin'));
console.log(await E(()=>{const a=0,b=now()+DAY*2;return JSON.stringify(deliveredBetween(a,b).filter(o=>{const e=orderEconomics(o);const mos=o.quote.lines.filter(l=>l.kind==='mo'&&l.state!=='liberado');return o.type==='garantia'||!mos.length;}).map(o=>[otCode(o),o.type,orderEconomics(o).rev,o.quote.lines.length]));}));
await browser.close();})();
