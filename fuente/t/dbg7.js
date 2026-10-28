const {open}=require('./lib');
(async()=>{const {browser,page}=await open({hash:'#acceso'});const E=(f,...a)=>page.evaluate(f,...a);
await E(()=>window.VBC.login('u-admin'));
await E(()=>{location.hash='#panel/compras';});await page.waitForTimeout(300);
await page.click('[data-act=supNew]');await page.fill('#sf-n','Proveedor Prueba SA');
const cuit=await E(()=>{for(let n=10000000;n<10000100;n++){const c=mkCuit('30'+n);if(c&&cuitOk(c))return c;}});console.log('cuit',cuit);
await page.fill('#sf-c',cuit);await page.click('.modal footer .btn.p');await page.waitForTimeout(400);
console.log(await page.locator('.modal [data-err]').count()?await page.locator('.modal [data-err]').innerText():'sin error', await E(()=>S.suppliers.length));
await browser.close();})();
