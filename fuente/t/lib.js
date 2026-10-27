const {chromium}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'../../index.html');
async function open(opts={}){
  const browser=await chromium.launch();const ctx=await browser.newContext({viewport:opts.viewport||{width:1280,height:800},locale:'es-AR',timezoneId:'America/Argentina/Salta'});
  const page=await ctx.newPage();const errs=[];
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+': '+m.text());});
  page.on('pageerror',e=>errs.push('pageerror: '+e.message));
  if(opts.clock)await page.clock.install({time:opts.clock});
  await page.goto(URL+(opts.hash||''));await page.waitForFunction(()=>window.VBC&&window.VBC.ready,null,{timeout:20000});await page.evaluate(()=>window.VBC.ready);
  return {browser,ctx,page,errs};
}
let pass=0,fail=0;const fails=[];
function ok(c,msg){if(c){pass++;}else{fail++;fails.push(msg);console.log('  ✗ '+msg);}}
function done(name){console.log((fail?'FALLAN':'OK')+' '+name+': '+pass+' ok, '+fail+' fallas');if(fail)process.exitCode=1;}
module.exports={open,ok,done,URL};
