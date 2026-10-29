'use strict';
/* =====================================================================
   SISTEMA VB · Clínica de la PC (DEMO de taller) · NÚCLEO
   Utilidades, reloj, formato, hash SHA-256 (síncrono), estado, persistencia,
   permisos, auditoría encadenada y notificaciones internas.
   Desarrollado por VINCULAR BUSINESS · (387) 4484132 · vincularbusiness@gmail.com
   ===================================================================== */
const APP={name:'Clínica de la PC',ver:'V26 · taller 1.0',variant:'__VARIANT__',tz:'America/Argentina/Salta',build:'__BUILD__'};
const VB={name:'VINCULAR BUSINESS',cel:'(387) 4484132',wa:'https://wa.me/5493874484132',tel:'tel:+5493874484132',mail:'vincularbusiness@gmail.com',lema:'Tu idea, en buenas manos.'};

/* ---------- utilidades ---------- */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const ESC_MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'};
const esc=s=>String(s==null?'':s).replace(/[&<>"'`]/g,c=>ESC_MAP[c]);
const COLL=new Intl.Collator('es',{sensitivity:'base',numeric:true});
const DAY=86400000,HOUR=3600000,MIN=60000;
class VBErr extends Error{constructor(m,code){super(m);this.code=code||'E';}}
const fail=(m,code)=>{throw new VBErr(m,code);};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const sum=(a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0);
const uniq=a=>[...new Set(a)];
const $p=n=>Math.round(n*100); // pesos → centavos
const initials=n=>String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();

/* ---------- reloj (ajustable en pruebas: window.__now) ---------- */
let T_FIX=null;
function now(){if(T_FIX!=null)return T_FIX;const w=window.__now;return typeof w==='function'?w():(typeof w==='number'?w:Date.now());}
const _fd=new Intl.DateTimeFormat('es-AR',{timeZone:APP.tz,day:'2-digit',month:'2-digit',year:'numeric'});
const _ft=new Intl.DateTimeFormat('es-AR',{timeZone:APP.tz,hour:'2-digit',minute:'2-digit',hour12:false});
const _fp=new Intl.DateTimeFormat('en-CA',{timeZone:APP.tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function tparts(ts){const o={};_fp.formatToParts(new Date(ts)).forEach(p=>{o[p.type]=p.value;});if(o.hour==='24')o.hour='00';return o;}
const fdate=ts=>ts?_fd.format(new Date(ts)):'—';
const ftime=ts=>ts?_ft.format(new Date(ts)):'—';
const fdt=ts=>ts?fdate(ts)+' '+ftime(ts):'—';
function dayKey(ts){const p=tparts(ts);return p.year+'-'+p.month+'-'+p.day;}
function tzOff(ts){const p=tparts(ts);const u=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);return Math.round((u-Math.floor(ts/1000)*1000)/60000);}
function startOfDay(ts){const p=tparts(ts);return Date.UTC(+p.year,+p.month-1,+p.day)-tzOff(ts)*MIN;}
function dur(ms){ms=Math.max(0,Math.round(ms/MIN));if(ms<60)return ms+' min';const h=Math.floor(ms/60),m=ms%60;if(h<48)return h+' h'+(m?' '+m+' min':'');const d=Math.floor(h/24);return d+' d '+(h%24)+' h';}
function ago(ts){const d=now()-ts;if(d<MIN)return 'recién';return 'hace '+dur(d);}
function clock(ms){ms=Math.max(0,Math.floor(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60),s=ms%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function dateInput(ts){return ts?dayKey(ts):'';}
function parseDateInput(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');if(!m)return NaN;const u=Date.UTC(+m[1],+m[2]-1,+m[3]);return u-tzOff(u+15*HOUR)*MIN;}

/* ---------- dinero y números (centavos enteros, nunca float) ---------- */
function fmt(c){if(c==null||isNaN(c))return '—';const neg=c<0;c=Math.abs(Math.round(c));const p=Math.floor(c/100),d=c%100;let s=String(p).replace(/\B(?=(\d{3})+(?!\d))/g,'.');if(d)s+=','+String(d).padStart(2,'0');return (neg?'−':'')+'$ '+s;}
function parseMoney(v){if(typeof v==='number')return Math.round(v*100);let s=String(v==null?'':v).trim().replace(/[$\s]/g,'');if(!s||!/^-?[\d.,]+$/.test(s))return NaN;if(s.includes(',')){s=s.replace(/\./g,'').replace(',','.');}else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)){s=s.replace(/\./g,'');}const n=Number(s);return isFinite(n)?Math.round(n*100):NaN;}
function parseQty(v){if(typeof v==='number')return v;let s=String(v==null?'':v).trim().replace(',','.');if(!s||!/^-?\d*\.?\d+$/.test(s))return NaN;return Number(s);}
const fq=n=>{n=Math.round(n*1000)/1000;return String(n).replace('.',',');};
const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
function waDigits(s){return String(s||'').replace(/\D/g,'');}
function waFull(s){let d=waDigits(s);if(!d)return '';if(d.startsWith('54'))return d;d=d.replace(/^0+/,'');if(d.startsWith('15')&&d.length<=10)d=d.slice(2);if(d.length===10)return '549'+d;return d;}
function waLink(to,text){const n=waFull(to);return 'https://wa.me/'+n+(text?'?text='+encodeURIComponent(text):'');}

/* ---------- CSV seguro (neutraliza fórmulas) ---------- */
function csvCell(v){let s=v==null?'':String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;if(/[;"\n\r]/.test(s))s='"'+s.replace(/"/g,'""')+'"';return s;}
function toCSV(rows){return '﻿'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');}

/* ---------- SHA-256 síncrono ---------- */
const SHA_K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256(msg){
  const bytes=new TextEncoder().encode(msg),l=bytes.length,padLen=((l+9+63)>>6)<<6,buf=new Uint8Array(padLen);
  buf.set(bytes);buf[l]=0x80;const dv=new DataView(buf.buffer);dv.setUint32(padLen-8,Math.floor(l*8/4294967296));dv.setUint32(padLen-4,(l*8)>>>0);
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const w=new Uint32Array(64);
  for(let o=0;o<padLen;o+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];const s0=((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3);const s1=((b>>>17)|(b<<15))^((b>>>19)|(b<<13))^(b>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));const ch=(e&f)^(~e&g);const t1=(h+S1+ch+SHA_K[i]+w[i])>>>0;const S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));const mj=(a&b)^(a&c)^(b&c);const t2=(S0+mj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    H=[H[0]+a,H[1]+b,H[2]+c,H[3]+d,H[4]+e,H[5]+f,H[6]+g,H[7]+h].map(x=>x>>>0);
  }
  return H.map(x=>x.toString(16).padStart(8,'0')).join('');
}

/* ---------- CUIT (dígito verificador, módulo 11) ---------- */
function cuitDV(base10){const m=[5,4,3,2,7,6,5,4,3,2];let s=0;for(let i=0;i<10;i++)s+=(+base10[i])*m[i];let r=11-(s%11);if(r===11)r=0;if(r===10)r=9;return r;}
function cuitOk(c){c=String(c||'').replace(/\D/g,'');return c.length===11&&cuitDV(c.slice(0,10))===+c[10];}
const cuitFmt=c=>{c=String(c||'').replace(/\D/g,'');return c.length===11?c.slice(0,2)+'-'+c.slice(2,10)+'-'+c[10]:c;};

/* ---------- catálogos fijos ---------- */
const ST={
  pendiente:{id:'pendiente',name:'Pendiente',color:'#64748b',badge:''},
  diagnostico:{id:'diagnostico',name:'En diagnóstico',color:'#2563eb',badge:'info'},
  aprobacion:{id:'aprobacion',name:'Esperando aprobación',color:'#d97706',badge:'warn'},
  proceso:{id:'proceso',name:'En proceso',color:'#0f766e',badge:'teal'},
  prueba:{id:'prueba',name:'En prueba',color:'#6d28d9',badge:'vio'},
  listo:{id:'listo',name:'Listo para retirar',color:'#15803d',badge:'ok'},
  entregado:{id:'entregado',name:'Entregado',color:'#475569',badge:'',terminal:true},
  cancelado:{id:'cancelado',name:'Cancelado',color:'#991b1b',badge:'bad',terminal:true}
};
const ST_FLOW=['pendiente','diagnostico','aprobacion','proceso','prueba','listo','entregado'];
const ST_COLS=['pendiente','diagnostico','aprobacion','proceso','prueba','listo'];
const PRIO={normal:'Normal',alta:'Alta',urgente:'Urgente'};
const METHODS={efectivo:'Efectivo',debito:'Tarjeta débito',credito:'Tarjeta crédito',transferencia:'Transferencia',qr:'QR / billetera',cc:'Cuenta corriente'};
const DIGITAL=['transferencia','qr'];
const COLORS_OK=/^#[0-9a-fA-F]{6}$/;
const safeColor=c=>COLORS_OK.test(c||'')?c:'#64748b';

/* ---------- roles y permisos (se validan en el dominio, no sólo en la interfaz) ---------- */
const PERM_LABEL={view_costs:'ver costos y márgenes',view_reports:'ver reportes',cash:'operar la caja',cash_close:'cerrar la caja',purchases:'proveedores y compras',inventory_edit:'editar inventario',inventory_delete:'eliminar artículos',config:'configuración',audit:'ver auditoría',discount:'aplicar bonificaciones',intake:'recibir equipos',orders_work:'trabajar órdenes',orders_back:'retroceder estados',orders_cancel:'cancelar órdenes',deliver:'entregar equipos',quote_manage:'gestionar presupuestos',payments:'cobrar',clients_edit:'editar clientes',clients_admin:'dar de baja clientes',assign:'asignar técnicos y tareas',request:'pedir repuestos',users:'gestionar usuarios',tools:'préstamo de herramientas',verify_pay:'verificar cobros digitales',void_pay:'anular cobros'};
const ROLES={
  admin:{label:'Administrador',perms:'*'},
  supervisor:{label:'Supervisor',perms:['view_costs','view_reports','cash','cash_close','purchases','inventory_edit','discount','intake','orders_work','orders_back','orders_cancel','deliver','quote_manage','payments','clients_edit','assign','request','tools','verify_pay','void_pay']},
  mostrador:{label:'Recepción / mostrador',perms:['cash','intake','deliver','quote_manage','payments','clients_edit','request']},
  tecnico:{label:'Técnico',perms:['orders_work','request','tools']}
};
const SESSION={uid:null};
const UIDKEY=APP.variant==='demo'?'vbc_uid':'vbc_uid_real';
const IS_DEMO=APP.variant==='demo';
let S=null; // estado
function curUser(){return S&&S.users.find(u=>u.id===SESSION.uid)||null;}
function can(p,u){u=u||curUser();if(!u)return false;const r=ROLES[u.role];return !!r&&(r.perms==='*'||r.perms.includes(p));}
function need(p){if(!can(p))fail('No tenés permiso para '+(PERM_LABEL[p]||p)+'. Pedíselo a un administrador.','perm');}
const userById=id=>S.users.find(u=>u.id===id);
const userName=id=>{const u=userById(id);return u?u.name:'—';};
const techs=()=>S.users.filter(u=>u.role==='tecnico'&&u.active!==false);

/* ---------- configuración por defecto ---------- */
function defCfg(){return {
  shop:{name:'Clínica de la PC',legal:'[PENDIENTE]',cuit:'[PENDIENTE]',addr:'Av. Ejemplo 1234, Salta Capital',wa:'387 555-0100',phone:'(387) 555-0100',mail:'contacto@clinicadelapc.example',hours:'Lun a Vie 9:00–13:00 y 16:30–20:30 · Sáb 9:00–13:00',fiscal:'[PENDIENTE]'},
  rateHourCents:$p(28000),lastBackup:0,
  quoteValidDays:7,
  warrantyDays:30,
  storedDays:15,
  commissionPct:30,
  sla:{pendiente:24,diagnostico:48,aprobacion:72,proceso:96,prueba:24},
  loyalty:{on:true,goal:5,prize:'Limpieza interna sin cargo',minCents:$p(15000)},
  terms:'El equipo se retira presentando esta orden. Los datos del equipo no se respaldan salvo pedido expreso: el cliente declara haber hecho copia de seguridad. Los presupuestos tienen la vigencia indicada. Pasado el plazo de guarda informado sin retirar el equipo, el taller podrá aplicar el procedimiento previsto en la normativa vigente. (Texto de ejemplo: confirmar con un asesor antes de usarlo.)',
  termsConfirmed:false,
  notif:{
    orden_nueva:{on:true,roles:['admin','supervisor','mostrador'],assignee:false},
    estado_cambio:{on:true,roles:['supervisor'],assignee:true},
    listo:{on:true,roles:['admin','mostrador'],assignee:true},
    presupuesto_aprobado:{on:true,roles:['supervisor'],assignee:true},
    presupuesto_rechazado:{on:true,roles:['admin','mostrador'],assignee:true},
    requerimiento:{on:true,roles:['admin','supervisor'],assignee:false},
    stock_bajo:{on:true,roles:['admin','supervisor'],assignee:false},
    tarea_asignada:{on:true,roles:[],assignee:true},
    atraso:{on:true,roles:['admin','supervisor'],assignee:true},
    sin_retirar:{on:true,roles:['mostrador','admin'],assignee:false},
    caja_diferencia:{on:true,roles:['admin'],assignee:false},
    cobro_pendiente:{on:true,roles:['admin','supervisor'],assignee:false}
  },
  types:{
    'Notebook':{acc:['Cargador','Batería','Bolso / funda','Mouse','Disco / SSD instalado','Tapas y tornillos completos'],tests:['Enciende y arranca el sistema','Temperaturas en rango','Prueba de estrés 15 min','Pantalla sin píxeles muertos','Teclado y touchpad','Audio y cámara','Wi-Fi y puertos USB','Batería carga']},
    'PC de escritorio':{acc:['Cable de poder','Teclado','Mouse','Monitor','Parlantes','Tapa lateral'],tests:['Enciende y arranca el sistema','Temperaturas en rango','Prueba de memoria','Disco sano (SMART)','Audio y red','Puertos USB y video']},
    'All-in-one':{acc:['Cable de poder','Teclado','Mouse','Base / soporte'],tests:['Enciende y arranca el sistema','Temperaturas en rango','Pantalla sin fallas','Audio, cámara y red']},
    'Impresora':{acc:['Cable de poder','Cable USB','Cartuchos / tóner','Bandeja de papel'],tests:['Imprime página de prueba','Alineación de cabezales','Escáner / copia','Conectividad']},
    'Monitor':{acc:['Cable de poder','Cable de video','Base / soporte'],tests:['Enciende y muestra imagen','Sin píxeles muertos','Entradas de video']},
    'Tablet / celular':{acc:['Cargador','Cable','Funda','Chip / tarjeta SD'],tests:['Enciende y funciona','Pantalla táctil','Carga correctamente','Cámara y audio']},
    'Otro':{acc:['Cable de poder','Cargador'],tests:['Enciende y funciona','Prueba de uso 15 min']}
  },
  conds:['Golpes en carcasa','Rayones','Pantalla rota o rajada','Bisagras flojas','Teclas faltantes','Faltan tornillos o gomas','Manchas / humedad','Sellos de garantía rotos','Sin daños visibles'],
  msgs:{
    recibido:'Hola {cliente}, recibimos tu {equipo} en {taller}. Tu orden es {ot}. Podés consultar el estado en cualquier momento con ese número.',
    presupuesto:'Hola {cliente}, el presupuesto de tu {equipo} ({ot}) es de {total}. Vale hasta el {vence}. ¿Lo aprobamos? Respondé SÍ para continuar.',
    listo:'Hola {cliente}, tu {equipo} ({ot}) está listo para retirar. Saldo a pagar: {saldo}. Horario: {horario}.',
    demora:'Hola {cliente}, seguimos trabajando en tu {equipo} ({ot}). Te avisamos apenas haya novedades.'
  }
};}
const NOTIF_LABEL={orden_nueva:'Nueva orden ingresada',estado_cambio:'Cambio de estado de una orden',listo:'Equipo listo para retirar',presupuesto_aprobado:'Presupuesto aprobado',presupuesto_rechazado:'Presupuesto rechazado',requerimiento:'Requerimiento técnico (repuesto o herramienta)',stock_bajo:'Stock bajo de un repuesto',tarea_asignada:'Tarea asignada a un técnico',atraso:'Orden atrasada (fuera del tiempo esperado)',sin_retirar:'Equipo listo sin retirar',caja_diferencia:'Diferencia al cerrar la caja',cobro_pendiente:'Cobro digital sin verificar'};

function emptyState(){return {v:1,seq:{id:0,ot:0,cli:0,sale:0,pay:0,po:0,rec:0,cash:0,req:0,sellos:0},cfg:defCfg(),users:[],clients:[],devices:[],orders:[],photos:{},cats:[],items:[],moves:[],loans:[],suppliers:[],pos:[],receipts:[],supLedger:[],reqs:[],sales:[],payments:[],cash:{sessions:[],moves:[]},rubros:[],services:[],stamps:[],notifs:[],audit:[],seeded:false,builtAt:null};}
function nid(p){S.seq.id++;return p+S.seq.id.toString(36);}

/* ---------- persistencia (IndexedDB, un solo registro cifrado a futuro en la nube) ---------- */
const DBX={db:null,
  open(){return new Promise((res,rej)=>{try{const r=indexedDB.open(APP.variant==='demo'?'vb-clinica-pc':'vb-clinica-pc-real',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{this.db=r.result;res(r.result);};r.onerror=()=>rej(r.error);}catch(e){rej(e);}});},
  get(k){return new Promise((res,rej)=>{const t=this.db.transaction('kv').objectStore('kv').get(k);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error);});},
  set(k,v){return new Promise((res,rej)=>{const t=this.db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);});},
  del(k){return new Promise((res,rej)=>{const t=this.db.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
};
let _saveT=null,_saveErr=null,_noSave=false;
function scheduleSave(){if(_noSave)return;clearTimeout(_saveT);_saveT=setTimeout(saveNow,250);}
async function saveNow(){clearTimeout(_saveT);if(_noSave||!DBX.db||!S)return;try{await DBX.set('state',S);_saveErr=null;}catch(e){_saveErr=e;console.warn('No se pudo guardar',e);}}
function mergeDefaults(t,d){for(const k of Object.keys(d)){if(t[k]===undefined)t[k]=JSON.parse(JSON.stringify(d[k]));else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&t[k]&&typeof t[k]==='object')mergeDefaults(t[k],d[k]);}}
function migrate(st){const e=emptyState();for(const k of Object.keys(e)){if(st[k]===undefined)st[k]=e[k];}mergeDefaults(st.cfg,defCfg());mergeDefaults(st.seq,e.seq);return st;}
const _notifHooks=[];
function emitChange(){scheduleSave();if(typeof UI!=='undefined'&&UI.dirty)UI.dirty();}

/* ---------- auditoría encadenada (SHA-256) ---------- */
function audit(action,detail){const prev=S.audit.length?S.audit[S.audit.length-1].hash:'GENESIS';const e={n:S.audit.length+1,ts:now(),uid:SESSION.uid||'sistema',action,detail:detail==null?'':detail,prev};e.hash=sha256([e.prev,e.n,e.ts,e.uid,e.action,JSON.stringify(e.detail)].join('|'));S.audit.push(e);return e;}
function auditVerify(){let prev='GENESIS';for(let i=0;i<S.audit.length;i++){const e=S.audit[i];const h=sha256([prev,e.n,e.ts,e.uid,e.action,JSON.stringify(e.detail)].join('|'));if(e.prev!==prev||e.hash!==h||e.n!==i+1)return {ok:false,at:e.n,total:S.audit.length};prev=e.hash;}return {ok:true,total:S.audit.length};}

/* ---------- notificaciones internas ---------- */
let SEEDING=false;
function notify(type,o){
  const rule=S.cfg.notif[type];if(!rule||!rule.on)return null;
  if(o.key&&S.notifs.some(n=>n.key===o.key))return null;
  const toUsers=uniq([...(o.toUsers||[]),...(rule.assignee&&o.assignee?[o.assignee]:[])].filter(Boolean));
  const n={id:nid('n'),ts:now(),type,title:o.title,body:o.body||'',ref:o.ref||null,toRoles:[...rule.roles],toUsers,key:o.key||null,readBy:[]};
  S.notifs.push(n);if(S.notifs.length>600)S.notifs.splice(0,S.notifs.length-600);
  if(!SEEDING&&typeof UI!=='undefined'&&UI.onNotify)UI.onNotify(n);
  return n;
}
function notifForUser(n,u){u=u||curUser();if(!u)return false;return n.toUsers.includes(u.id)||n.toRoles.includes(u.role);}
const myNotifs=u=>S.notifs.filter(n=>notifForUser(n,u)).sort((a,b)=>b.ts-a.ts);
const unreadCount=u=>{u=u||curUser();return u?S.notifs.filter(n=>notifForUser(n,u)&&!n.readBy.includes(u.id)).length:0;};
