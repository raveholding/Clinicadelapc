/* =====================================================================
   ARRANQUE: abre la base local (IndexedDB), carga o genera los datos de
   ejemplo, restaura la sesión de demo y expone window.VBC para pruebas.
   ===================================================================== */
let _bootWarn=null;
function resetDemo(){
  _noSave=false;S=seedDemo();SESSION.uid=null;try{localStorage.removeItem(UIDKEY);}catch(e){}
  saveNow().then(()=>{location.hash='#acceso';applyRoute();});
}
async function boot(){
  try{
    await DBX.open();const st=await DBX.get('state');
    if(st&&st.v&&st.seeded!==undefined){S=migrate(st);}
    else{S=IS_DEMO?seedDemo():emptyState();await saveNow();}
  }catch(e){
    console.warn('Sin almacenamiento local: el sistema funciona pero no guarda.',e);_noSave=true;_bootWarn='Este navegador no permite guardar datos: el sistema funciona, pero al cerrar la pestaña se pierde lo que cargues.';
    if(!S)S=IS_DEMO?seedDemo():emptyState();
  }
  try{const u=localStorage.getItem(UIDKEY);if(u&&userById(u)&&userById(u).active!==false)SESSION.uid=u;}catch(e){}
  if(SESSION.uid){try{if(scanSla())scheduleSave();}catch(e){console.error(e);}}
  if(!IS_DEMO){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}}
  applyRoute();
  if(_bootWarn)toast(_bootWarn,'bad');
  window.addEventListener('beforeunload',()=>{try{saveNow();}catch(e){}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow();});
}
window.VBC={get S(){return S;},flush:()=>saveNow(),sha256,auditVerify,reset:()=>resetDemo(),login:id=>{SESSION.uid=id;try{localStorage.setItem(UIDKEY,id);}catch(e){}},ready:null};
window.VBC.ready=boot().catch(e=>{console.error('BOOT',e);document.getElementById('root').innerHTML='<div class="pub"><div class="wrap"><div class="alert bad" role="alert">No se pudo iniciar la aplicación: '+String(e&&e.message||e).replace(/[<>&]/g,'')+'</div></div></div>';});
