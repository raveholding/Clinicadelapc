const {open}=require('./lib');
(async()=>{const {browser,page}=await open({hash:'#acceso'});const E=(f,...a)=>page.evaluate(f,...a);
await E(()=>window.VBC.login('u-admin'));
console.log(await E(()=>{const b=now()+DAY*2;return JSON.stringify(deliveredBetween(0,b).map(o=>{const e=orderEconomics(o);const r=reportServices(0,b);return null}).length)+JSON.stringify(deliveredBetween(0,b).map(o=>{const eco=orderEconomics(o);const mos=o.quote.lines.filter(l=>l.kind==='mo'&&l.state!=='liberado');const tot=mos.reduce((a,l)=>a+lineAmt(l),0);const share=mos.length?1:0;const got=o.type==='garantia'?0:(mos.length?(tot+Math.round(eco.repRev)-eco.disc):eco.rev);return [otCode(o),eco.rev,got,eco.moRev,tot];}).filter(x=>x[1]!==x[2]));}));
await browser.close();})();
