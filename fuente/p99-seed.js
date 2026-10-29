/* =====================================================================
   DATOS DE EJEMPLO (demo). Se generan USANDO las funciones del dominio
   con un reloj simulado de 30 días: por eso stock, caja, auditoría y
   avisos son coherentes entre sí. Todo es ficticio.
   ===================================================================== */
function mkCuit(p10){const w=[5,4,3,2,7,6,5,4,3,2];let s=0;for(let i=0;i<10;i++)s+=Number(p10[i])*w[i];let dv=11-(s%11);if(dv===11)dv=0;if(dv===10)return null;return p10+dv;}
function demoPhoto(label,c1,c2){
  const cv=document.createElement('canvas');cv.width=320;cv.height=240;const g=cv.getContext('2d');
  const gr=g.createLinearGradient(0,0,320,240);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,0,320,240);
  g.fillStyle='rgba(255,255,255,.85)';g.fillRect(40,60,240,110);g.fillStyle='#334155';g.font='bold 18px sans-serif';g.textAlign='center';g.fillText(label,160,122);
  g.font='13px sans-serif';g.fillText('FOTO DE EJEMPLO',160,148);return cv.toDataURL('image/png');
}
/* Catálogo base (rubros, servicios de ejemplo y rubros de inventario): lo usan la demo y la versión real. */
function seedCatalog(){
  /* ---- rubros financieros ---- */
  [['Reparaciones y servicios','ingreso',true],['Ventas de mostrador','ingreso',true],['Cobro de cuenta corriente','ingreso',true],['Reintegros a clientes','egreso',true],
   ['Compra de insumos y repuestos','egreso',false],['Servicios (luz, internet)','egreso',false],['Alquiler del local','egreso',false],['Sueldos y comisiones','egreso',false],['Aporte del dueño','ingreso',false],['Retiro del dueño','egreso',false],['Varios','ambos',false]]
   .forEach(r=>S.rubros.push({id:nid('rb'),name:r[0],type:r[1],sys:r[2]}));
  /* ---- servicios (mano de obra) ---- */
  [['svc-diag','Diagnóstico técnico',10000,45,0],['svc-limp','Limpieza interna y cambio de pasta térmica',18000,60,30],['svc-so','Instalación de sistema operativo y programas',15000,90,30],['svc-fmt','Formateo con respaldo de datos',22000,120,30],
   ['svc-ssd','Cambio de disco / SSD (mano de obra)',12000,45,30],['svc-ram','Ampliación de memoria RAM (mano de obra)',8000,20,30],['svc-pant','Cambio de pantalla de notebook (mano de obra)',25000,60,60],['svc-tecl','Cambio de teclado (mano de obra)',20000,60,30],
   ['svc-virus','Eliminación de virus y optimización',14000,90,15],['svc-fuente','Reparación de fuente / placa (mano de obra)',30000,120,30],['svc-imp','Mantenimiento de impresora',16000,60,30],['svc-bat','Cambio de batería (mano de obra)',9000,20,30]]
   .forEach(s=>S.services.push({id:s[0],name:s[1],priceCents:$p(s[2]),estMin:s[3],warrantyDays:s[4],active:true}));
  /* ---- rubros de inventario ---- */
  const CATS=[['Memorias RAM','#6366f1'],['Discos y SSD','#0ea5e9'],['Pantallas','#14b8a6'],['Baterías y cargadores','#f59e0b'],['Teclados y periféricos','#8b5cf6'],['Fuentes y placas','#ef4444'],['Insumos de taller','#64748b'],['Tintas e impresión','#ec4899'],['Accesorios de venta','#22c55e'],['Herramientas','#78716c']];
  CATS.forEach(c=>catSave({name:c[0],color:c[1]}));
}
function seedDemo(){
  S=emptyState();SEEDING=true;const realBase=now();const base=realBase;
  const day0=startOfDay(base);
  /* ---- usuarios ---- */
  S.users.push({id:'u-admin',name:'Marcos Rivera',role:'admin',active:true},{id:'u-sup',name:'Lucía Fernández',role:'supervisor',active:true},{id:'u-mos',name:'Camila Torres',role:'mostrador',active:true},
    {id:'u-t1',name:'Diego Paz',role:'tecnico',active:true,commissionPct:30},{id:'u-t2',name:'Sofía Luna',role:'tecnico',active:true,commissionPct:30},{id:'u-t3',name:'Mateo Ríos',role:'tecnico',active:true,commissionPct:35});
  SESSION.uid='u-admin';
  seedCatalog();const cat=n=>S.cats.find(c=>c.name===n).id;
  /* ---- proveedores (CUIT con dígito verificador válido; ficticios) ---- */
  const SUP=[['TecnoMayorista Norte S.R.L.','3071234567','Responsable Inscripto','387 555-0201','ventas@tecnomayorista.example','Av. Ficticia 100, Salta'],['Compu Distribuidora del NOA S.A.','3070987654','Responsable Inscripto','387 555-0202','pedidos@compunoa.example','Calle Ejemplo 455, Salta'],['Insumos y Tintas Salta','2720304050','Monotributista','387 555-0203','tintas@insumos.example','Mitre 321, Salta']];
  const sup=[];
  for(const s of SUP){let c=mkCuit(s[1]);if(!c)c=mkCuit(String(Number(s[1])+1));sup.push(supplierSave({name:s[0],cuit:c,iva:s[2],phone:s[3],email:s[4],addr:s[5]}));}
  /* ---- inventario ---- */
  const IT=[ // sku,nombre,tipo,rubro,costo,precio,min,stock,ubic,prov,vendible,unidad
    ['RAM-N8','Memoria RAM DDR4 8 GB (notebook)','repuesto','Memorias RAM',18000,28000,3,6,'A1',0],['RAM-D8','Memoria RAM DDR4 8 GB (PC)','repuesto','Memorias RAM',17000,26000,3,4,'A1',0],['RAM-D3','Memoria RAM DDR3 4 GB','repuesto','Memorias RAM',9000,15000,2,2,'A2',0],
    ['SSD-240','SSD 240 GB SATA','repuesto','Discos y SSD',21000,32000,4,9,'B1',0],['SSD-480','SSD 480 GB SATA','repuesto','Discos y SSD',34000,49000,3,5,'B1',0],['SSD-NV512','SSD NVMe 512 GB','repuesto','Discos y SSD',42000,60000,2,3,'B2',0],['HDD-1T','Disco rígido 1 TB 2,5"','repuesto','Discos y SSD',38000,54000,2,2,'B2',0],
    ['PAN-156','Pantalla notebook 15,6" LED','repuesto','Pantallas',52000,78000,2,3,'C1',1],['PAN-14','Pantalla notebook 14" LED','repuesto','Pantallas',49000,74000,2,1,'C1',1],
    ['BAT-GEN','Batería de notebook genérica','repuesto','Baterías y cargadores',26000,39000,2,4,'C2',1],['CARG-65','Cargador universal para notebook 65 W','repuesto','Baterías y cargadores',14000,22000,3,6,'C2',1,true],['CONN-DC','Ficha DC jack para notebook','repuesto','Baterías y cargadores',2500,6000,4,3,'C3',1],
    ['TEC-ES','Teclado de notebook (español) genérico','repuesto','Teclados y periféricos',11000,18000,3,5,'D1',0],['TEC-USB','Teclado USB español','accesorio','Teclados y periféricos',8000,15000,2,3,'D2',0],['MOU-USB','Mouse óptico USB','accesorio','Teclados y periféricos',4500,9500,3,6,'D2',0],
    ['FUE-500','Fuente de PC 500 W','repuesto','Fuentes y placas',24000,36000,2,3,'E1',1],['FUE-650','Fuente de PC 650 W certificada','repuesto','Fuentes y placas',36000,52000,2,2,'E1',1],['COOL-U','Cooler de CPU universal','repuesto','Fuentes y placas',9000,15000,2,4,'E2',1],
    ['PASTA','Pasta térmica (jeringa 4 g)','insumo','Insumos de taller',3500,6500,5,12,'F1',0],['ALC-1L','Alcohol isopropílico 1 L','insumo','Insumos de taller',7000,0,2,3,'F1',0,false,'lt'],['AIRE','Aire comprimido 400 ml','insumo','Insumos de taller',6000,0,3,8,'F2',0],
    ['TIN-N','Tinta negra compatible 70 ml','insumo','Tintas e impresión',4500,8000,4,10,'G1',2,true],['TIN-C','Tinta color compatible 70 ml','insumo','Tintas e impresión',4500,8000,4,3,'G1',2,true],
    ['CAB-HD','Cable HDMI 1,5 m','accesorio','Accesorios de venta',4000,9000,3,7,'H1',0],['CAB-UC','Cable USB-C 1 m','accesorio','Accesorios de venta',3000,7000,5,12,'H1',0],['PEN-32','Pendrive 32 GB','accesorio','Accesorios de venta',5500,10000,4,8,'H2',0],['PEN-64','Pendrive 64 GB','accesorio','Accesorios de venta',7500,13500,3,2,'H2',0],['KIT-LIMP','Kit de limpieza para pantallas','accesorio','Accesorios de venta',3500,7500,3,5,'H2',0]];
  const TOOLS=[['HER-MULT','Multímetro digital','Herramientas',2,'Banco 1'],['HER-DEST','Juego de destornilladores de precisión','Herramientas',3,'Banco 1'],['HER-PIST','Pistola de calor','Herramientas',1,'Banco 2'],['HER-SOLD','Soldador de punta fina','Herramientas',2,'Banco 2'],['HER-PROB','Probador de fuentes ATX','Herramientas',1,'Banco 2']];
  for(const r of IT)itemSave({name:r[1],sku:r[0],kind:r[2],catId:cat(r[3]),costCents:$p(r[4]),priceCents:$p(r[5]),min:r[6],initial:r[7],loc:r[8],supplierId:sup[r[9]].id,requireStock:true,sellable:r[10]===true||r[2]==='accesorio',unit:r[11]||'u'});
  for(const r of TOOLS)itemSave({name:r[1],sku:r[0],kind:'herramienta',catId:cat(r[2]),costCents:0,priceCents:0,min:0,toolQty:r[3],loc:r[4]});
  const it=sku=>S.items.find(i=>i.sku===sku);
  /* ---- clientes ---- */
  const CL=[['Roberto Aguirre','27111222','roberto.aguirre@mail.example'],['Natalia Quiroga','30222333',''],['Fernando Cabrera','24333444','ferc@mail.example'],['Ana Belén Soria','35444555','anabelen@mail.example'],['Gustavo Mamaní','28555666',''],['Paula Villagrán','33666777','paula.v@mail.example'],['Héctor Chauque','22777888',''],['Marina Ledesma','36888999','marina.l@mail.example'],['Joaquín Arias','40999000',''],['Estudio Contable Núñez','30111000','contacto@nunez.example'],['Valeria Cruz','31123456',''],['Ramiro Salva','29234567','rsalva@mail.example']];
  const cli=[null];CL.forEach((c,i)=>{const n=i+1;cli.push(clientSave({name:c[0],wa:'387 555-01'+String(n).padStart(2,'0'),dni:c[1],email:c[2],consentCare:true,consentMkt:n%3===0}));});
  clientSave({id:cli[3].id,name:cli[3].name,wa:cli[3].wa,dni:cli[3].dni,email:cli[3].email,ccLimitCents:$p(120000)});
  /* ---- reloj simulado ---- */
  const EV=[];let seq=0;
  const stamp=(d,h,m)=>day0-d*DAY+h*HOUR+(m||0)*MIN;
  const at=(d,h,fn,m)=>EV.push({d,h:h+(m||0)/60,fn,i:seq++});
  const photo=[demoPhoto('Equipo recibido','#cbd5e1','#94a3b8'),demoPhoto('Daño visible','#fecaca','#fca5a5'),demoPhoto('Accesorios','#bbf7d0','#86efac')];
  const mo=(id,q)=>{const s=S.services.find(x=>x.id===id);return {kind:'mo',svcId:s.id,desc:s.name,qty:q||1,unitCents:s.priceCents,estMin:s.estMin};};
  const rep=(sku,q)=>{const i=it(sku);return {kind:'rep',itemId:i.id,desc:i.name,qty:q||1,unitCents:i.priceCents};};
  const payOrder=(o,parts,extra)=>{const due=orderPay(o).due;let rest=due;const lines=[];parts.forEach((p,k)=>{const last=k===parts.length-1;const a=last?rest:Math.min(rest,$p(p[1]));rest-=a;const l={m:p[0],a};if(p[2])l.recibido=$p(p[2]);if(p[3])l.ref=p[3];lines.push(l);});return paymentCreate({kind:'orden',refId:o.id,lines,amountCents:due,key:'seed-'+o.id+'-'+(extra||'')});};
  const full=(o,m,rec,ref)=>payOrder(o,[[m,0,rec,ref]]);
  /* plan de una orden: devuelve ayudante con tiempos relativos (días después de crearla) */
  const orders={};
  function plan(key,d,h,cl,dev,fault,o2){
    const P={o:null,key};
    at(d,h,()=>{P.o=orders[key]=orderCreate({clientId:cli[cl].id,device:{type:dev[0],brand:dev[1],model:dev[2],serial:dev[3]},fault,accessories:o2.acc||['Cargador'],conditions:o2.cond||['Rayones leves'],conditionNote:o2.note||'',hasPassword:o2.pass!==false,backup:'nosabe',photos:o2.photos||[],termsAccepted:true,priority:o2.prio||'normal',techId:o2.tech||null,type:o2.type||'reparacion',warrantyOf:o2.warrantyOf?orders[o2.warrantyOf].id:undefined,promisedTs:o2.promised?stamp(d-o2.promised,18):null});},0);
    P.at=(dd,hh,fn,mm)=>at(d-dd,hh,()=>fn(P.o),mm);
    P.diag=(dd,hh,text,cause,tech)=>{P.at(dd,hh,o=>{if(!o.techId)orderAssign(o.id,tech);orderMove(o.id,'diagnostico');diagSave(o.id,{text,cause:cause||''});});};
    P.quote=(dd,hh,lines,opt)=>{P.at(dd,hh,o=>{quoteSave(o.id,{lines,discountCents:opt&&opt.disc?$p(opt.disc):0,discountReason:opt&&opt.disc?opt.why:''});quoteSend(o.id,{});});};
    P.approve=(dd,hh,via,by)=>P.at(dd,hh,o=>quoteApprove(o.id,{via,by:by||clientName(o.clientId)}));
    P.work=(dd,hh,tasks,mins)=>{P.at(dd,hh,o=>{tasks.forEach(t=>taskAdd(o.id,{text:t,techId:o.techId}));timerStart(o.id);},0);P.at(dd,hh+(mins||90)/60,o=>{if(o.timeLog.some(l=>!l.end))timerStop(o.id);});};
    P.doTask=(dd,hh,idx)=>P.at(dd,hh,o=>taskToggle(o.id,o.tasks[idx].id));
    P.use=(dd,hh,sku)=>P.at(dd,hh,o=>{const l=o.quote.lines.find(x=>x.kind==='rep'&&x.itemId===it(sku).id&&x.state==='reservado');if(l)partUse(o.id,l.id);});
    P.testAll=(dd,hh)=>P.at(dd,hh,o=>{o.tests.forEach((t,k)=>{if(!t.ok)testToggle(o.id,k);});});
    P.testSome=(dd,hh,n)=>P.at(dd,hh,o=>{o.tests.forEach((t,k)=>{if(k<n&&!t.ok)testToggle(o.id,k);});});
    P.move=(dd,hh,to)=>P.at(dd,hh,o=>orderMove(o.id,to));
    P.pay=(dd,hh,parts,tag)=>P.at(dd,hh,o=>payOrder(o,parts,tag));
    P.deliver=(dd,hh)=>P.at(dd,hh,o=>orderMove(o.id,'entregado'));
    return P;
  }
  const T1='u-t1',T2='u-t2',T3='u-t3';
  /* H1: notebook que no cargaba (entregada hace 27 días) */
  {const p=plan('H1',29,10,1,['Notebook','Lenovo','IdeaPad 3 15IIL','LNV-A1001'],'No enciende y no carga la batería. Se le cayó el cargador al piso.',{tech:T1,photos:[photo[0],photo[1]],acc:['Cargador','Bolso / funda'],cond:['Rayones leves','Golpe en una esquina']});
   p.diag(0,11,'La ficha de carga (DC jack) está floja y la placa no recibe energía. Se puede reparar.','Ficha DC jack dañada',T1);p.quote(0,12,[mo('svc-fuente'),rep('CONN-DC',1)]);p.approve(0,17,'whatsapp');
   p.work(1,9,['Desarmar y retirar la ficha dañada','Soldar ficha nueva','Probar carga y arranque'],150);p.doTask(1,11,0);p.doTask(1,11,1);p.doTask(1,12,2);p.use(1,12,'CONN-DC');p.move(1,12,'prueba');p.testAll(1,13);p.move(1,14,'listo');p.pay(2,10,[['efectivo',0,60000]]);p.deliver(2,10,'');}
  /* H2: PC lenta (SSD + sistema) */
  {const p=plan('H2',28,11,2,['PC de escritorio','Genérica','Armada i5 8va gen','PC-N2002'],'Muy lenta, tarda más de 10 minutos en iniciar Windows.',{tech:T2,acc:['Cable de poder','Teclado','Mouse'],cond:['Sin daños visibles'],pass:false});
   p.diag(0,12,'El disco rígido tiene sectores dañados. Conviene cambiarlo por un SSD y reinstalar el sistema.','Disco con sectores defectuosos',T2);p.quote(0,13,[mo('svc-ssd'),mo('svc-so'),rep('SSD-240',1)]);p.approve(0,18,'telefono');
   p.work(1,9,['Respaldar archivos del cliente','Instalar SSD y clonar/reinstalar','Instalar programas básicos'],200);p.doTask(1,12,0);p.doTask(1,14,1);p.doTask(1,15,2);p.use(1,15,'SSD-240');p.move(1,15,'prueba');p.testAll(1,16);p.move(1,16,'listo');
   p.pay(3,10,[['efectivo',30000],['transferencia',0,0,'TR-8841']],'mix');p.at(3,10,o=>{for(const pm of paymentsOfOrder(o))paymentVerify(pm.id,'Acreditado');},30);p.deliver(3,11);}
  /* H3: impresora */
  {const p=plan('H3',27,16,5,['Impresora','HP','DeskJet 2775','HP-X3003'],'No imprime en color, las hojas salen con rayas.',{tech:T3,acc:['Cable de poder','Cartuchos / tóner'],cond:['Sin daños visibles'],pass:false});
   p.diag(1,10,'Cabezales tapados por tinta seca. Limpieza profunda y tintas nuevas.','Cabezales obstruidos',T3);p.quote(1,11,[mo('svc-imp'),rep('TIN-C',1),rep('TIN-N',1)]);p.approve(1,12,'presencial');
   p.work(1,15,['Limpieza de cabezales','Cargar tintas y alinear'],80);p.doTask(1,16,0);p.doTask(1,16,1);p.use(1,16,'TIN-C');p.use(1,16,'TIN-N');p.move(1,16,'prueba');p.testAll(1,17);p.move(1,17,'listo');p.pay(2,17,[['efectivo',0]]);p.deliver(2,17);}
  /* H4: pantalla rota */
  {const p=plan('H4',25,9,6,['Notebook','HP','15-dw1000','HP-D4004'],'Se le cayó y la pantalla quedó con una mancha negra y rota.',{tech:T1,photos:[photo[1]],acc:['Cargador'],cond:['Pantalla rota','Golpe en una esquina']});
   p.diag(0,11,'Panel LCD roto. Reemplazo completo de pantalla; el resto funciona.','Panel dañado por golpe',T1);p.quote(0,12,[mo('svc-pant'),rep('PAN-156',1)]);p.approve(0,19,'whatsapp');
   p.work(1,9,['Desarmar tapa y retirar panel','Instalar pantalla nueva','Probar imagen y bisagras'],120);p.doTask(1,11,0);p.doTask(1,12,1);p.doTask(1,12,2);p.use(1,12,'PAN-156');p.move(1,12,'prueba');p.testAll(1,14);p.move(1,15,'listo');p.pay(3,10,[['debito',0,0,'Cupón 4471']]);p.deliver(3,10);}
  /* H5: all-in-one sin video */
  {const p=plan('H5',24,15,7,['All-in-one','Lenovo','IdeaCentre 3','AIO-L5005'],'Enciende pero no da video. Suena un pitido.',{tech:T2,acc:['Cable de poder','Teclado','Mouse'],cond:['Sin daños visibles'],pass:false});
   p.diag(1,10,'Memoria RAM mal asentada y un módulo defectuoso. Se reemplaza el módulo.','Módulo de RAM defectuoso',T2);p.quote(1,11,[mo('svc-ram'),rep('RAM-D8',1)]);p.approve(1,12,'presencial');
   p.work(1,15,['Probar módulos por separado','Instalar RAM nueva','Prueba de memoria 30 min'],70);p.doTask(1,16,0);p.doTask(1,16,1);p.doTask(1,17,2);p.use(1,17,'RAM-D8');p.move(1,17,'prueba');p.testAll(2,9);p.move(2,10,'listo');p.pay(3,16,[['efectivo',0]]);p.deliver(3,16);}
  /* H6: teclado con líquido */
  {const p=plan('H6',22,10,8,['Notebook','Acer','Aspire 5','ACR-F6006'],'Se le derramó café en el teclado, algunas teclas no responden.',{tech:T1,acc:['Cargador'],cond:['Teclas pegajosas'],photos:[photo[2]]});
   p.diag(0,12,'Líquido en el teclado, la placa no se mojó. Se cambia el teclado.','Teclado dañado por líquido',T1);p.quote(0,13,[mo('svc-tecl'),rep('TEC-ES',1)]);p.approve(0,16,'whatsapp');
   p.work(1,9,['Retirar teclado dañado','Limpiar zona con alcohol','Colocar teclado nuevo y probar'],110);p.doTask(1,10,0);p.doTask(1,11,1);p.doTask(1,11,2);p.use(1,11,'TEC-ES');p.move(1,11,'prueba');p.testAll(1,12);p.move(1,13,'listo');p.pay(2,12,[['transferencia',0,0,'TR-9012']]);p.at(2,15,o=>{for(const pm of paymentsOfOrder(o))paymentVerify(pm.id,'Acreditado');});p.deliver(2,16);}
  /* H7: virus */
  {const p=plan('H7',21,11,9,['PC de escritorio','Genérica','Ryzen 3','PC-V7007'],'Ventanas emergentes todo el tiempo y el navegador cambió solo.',{tech:T3,acc:['Cable de poder'],cond:['Sin daños visibles'],pass:false});
   p.diag(0,13,'Malware y extensiones no deseadas. Limpieza completa y optimización.','Malware en el navegador',T3);p.quote(0,14,[mo('svc-virus')]);p.approve(0,15,'telefono');p.work(1,9,['Escaneo y eliminación','Limpiar arranque y optimizar'],100);p.doTask(1,10,0);p.doTask(1,11,1);p.move(1,11,'prueba');p.testAll(1,11);p.move(1,12,'listo');p.pay(3,10,[['efectivo',0]]);p.deliver(3,10);}
  /* H8: presupuesto rechazado, se cobra el diagnóstico */
  {const p=plan('H8',20,10,10,['Notebook','Asus','VivoBook X515','ASU-R8008'],'La pantalla no muestra imagen, solo se escucha que enciende.',{tech:T2,acc:['Cargador'],cond:['Sin daños visibles']});
   p.diag(0,12,'Falla de placa madre (video). La reparación cuesta más que un equipo usado equivalente.','Placa madre dañada',T2);p.at(0,13,o=>{quoteSave(o.id,{lines:[mo('svc-fuente',2),mo('svc-pant',2)],discountCents:0});quoteSend(o.id,{});});
   p.at(1,10,o=>quoteReject(o.id,{reason:'Prefiere comprar otro equipo',chargeDiag:true}));p.pay(1,11,[['efectivo',0]]);p.deliver(1,11);}
  /* H9: batería */
  {const p=plan('H9',19,16,11,['Notebook','Samsung','NP350','SAM-B9009'],'La batería no carga y el equipo se apaga si se desenchufa.',{tech:T2,acc:['Cargador'],cond:['Sin daños visibles'],pass:false});
   p.diag(1,10,'Batería agotada. Se reemplaza por una nueva.','Batería agotada',T2);p.quote(1,11,[mo('svc-bat'),rep('BAT-GEN',1)]);p.approve(1,12,'whatsapp');p.work(1,15,['Cambiar batería','Calibrar y probar carga'],60);p.doTask(1,16,0);p.doTask(1,16,1);p.use(1,16,'BAT-GEN');p.move(1,16,'prueba');p.testAll(1,17);p.move(1,17,'listo');p.pay(3,12,[['efectivo',0,60000]]);p.deliver(3,12);}
  /* H10: PC gamer, tarjeta de crédito */
  {const p=plan('H10',17,10,1,['PC de escritorio','Genérica','Gamer Ryzen 5','PC-G1010'],'Se reinicia sola cuando juega. Hace mucho ruido.',{tech:T3,acc:['Cable de poder'],cond:['Mucho polvo'],pass:false});
   p.diag(0,12,'Temperaturas muy altas por polvo y pasta térmica seca. Cooler con rulemán desgastado.','Sobrecalentamiento',T3);p.quote(0,13,[mo('svc-limp'),rep('PASTA',1),rep('COOL-U',1)],{disc:2000,why:'Cliente frecuente'});p.approve(0,14,'whatsapp');
   p.work(1,9,['Desarmar y limpiar','Cambiar pasta térmica y cooler','Prueba de estrés 15 min'],120);p.doTask(1,10,0);p.doTask(1,11,1);p.doTask(1,12,2);p.use(1,12,'PASTA');p.use(1,12,'COOL-U');p.move(1,12,'prueba');p.testAll(1,13);p.move(1,14,'listo');p.pay(3,11,[['credito',0,0,'Cupón 7781']]);p.deliver(3,11);}
  /* H11: disco con errores */
  {const p=plan('H11',15,11,12,['Notebook','Positivo','Master N40','POS-D1111'],'Windows no inicia, aparece pantalla azul y error de disco.',{tech:T1,acc:['Cargador'],cond:['Sin daños visibles']});
   p.diag(0,13,'Disco con errores graves. Se cambia por SSD, se recuperan los archivos y se reinstala el sistema.','Disco defectuoso',T1);p.quote(0,14,[mo('svc-ssd'),mo('svc-fmt'),rep('SSD-480',1)]);p.approve(0,18,'whatsapp');
   p.work(1,9,['Recuperar archivos del disco viejo','Instalar SSD','Reinstalar sistema y programas'],240);p.doTask(1,11,0);p.doTask(1,13,1);p.doTask(1,14,2);p.use(1,14,'SSD-480');p.move(1,14,'prueba');p.testAll(1,15);p.move(1,16,'listo');p.pay(3,10,[['efectivo',50000],['transferencia',0,0,'TR-9533']],'mix2');p.at(3,10,o=>{for(const pm of paymentsOfOrder(o))paymentVerify(pm.id,'Acreditado');},30);p.deliver(3,12);}
  /* H12: fuente quemada, deuda en cuenta corriente */
  {const p=plan('H12',13,10,3,['PC de escritorio','Genérica','Core i3','PC-F1212'],'No enciende. Hubo una tormenta eléctrica y sintió olor a quemado.',{tech:T3,acc:['Cable de poder'],cond:['Olor a quemado'],pass:false,photos:[photo[0]]});
   p.diag(0,12,'Fuente quemada. La placa y el resto están sanos.','Fuente quemada por sobretensión',T3);p.quote(0,13,[mo('svc-fuente'),rep('FUE-650',1)]);p.approve(0,15,'telefono');p.work(1,9,['Retirar fuente quemada','Instalar fuente nueva','Probar tensiones'],80);p.doTask(1,10,0);p.doTask(1,10,1);p.doTask(1,11,2);p.use(1,11,'FUE-650');p.move(1,11,'prueba');p.testAll(1,12);p.move(1,13,'listo');p.pay(2,17,[['efectivo',40000],['cc',0]],'cc');p.deliver(2,17);}
  /* H13: garantía de H1 */
  {const p=plan('H13',11,10,1,['Notebook','Lenovo','IdeaPad 3 15IIL','LNV-A1001'],'Volvió a fallar la carga: a veces carga y a veces no.',{tech:T1,type:'garantia',warrantyOf:'H1',acc:['Cargador'],cond:['Sin daños visibles']});
   p.diag(0,11,'El cable del cargador tiene un corte interno; la reparación anterior está bien.','Cable de cargador dañado',T1);p.at(0,12,o=>{quoteSave(o.id,{lines:[mo('svc-fuente')]});});p.move(0,12,'proceso');p.work(0,15,['Probar con otro cargador','Reponer cargador universal'],40);p.doTask(0,16,0);p.doTask(0,16,1);p.move(0,16,'prueba');p.testAll(0,17);p.move(1,10,'listo');p.deliver(1,11);}
  /* R1: limpieza, entregada hace 6 días */
  {const p=plan('R1',9,10,4,['Notebook','Dell','Inspiron 15 3000','DEL-R1101'],'Se apaga sola después de un rato de uso y calienta mucho.',{tech:T2,acc:['Cargador'],cond:['Mucho polvo'],pass:false});
   p.diag(0,12,'Cooler tapado con polvo y pasta seca. Limpieza interna.','Sobrecalentamiento',T2);p.quote(0,13,[mo('svc-limp'),rep('PASTA',1)]);p.approve(0,14,'whatsapp');p.work(1,9,['Limpieza interna','Cambiar pasta térmica','Prueba de estrés'],90);p.doTask(1,10,0);p.doTask(1,10,1);p.doTask(1,11,2);p.use(1,11,'PASTA');p.move(1,11,'prueba');p.testAll(1,12);p.move(1,12,'listo');p.pay(3,11,[['efectivo',0,30000]]);p.deliver(3,11);}
  /* R2: monitor listo, sin cobrar */
  {const p=plan('R2',8,11,2,['Monitor','Samsung','S24F350','MON-S2202'],'El monitor no enciende, el LED parpadea.',{tech:T2,acc:['Cable de poder','Cable de video'],cond:['Sin daños visibles'],pass:false});
   p.diag(0,13,'Falla en la etapa de alimentación interna. Se repara con soldadura.','Etapa de alimentación',T2);p.quote(0,14,[mo('svc-fuente')]);p.approve(1,10,'telefono');p.work(1,11,['Reparar etapa de alimentación','Probar imagen 2 h'],150);p.doTask(1,13,0);p.doTask(1,15,1);p.move(1,15,'prueba');p.testAll(2,9);p.move(2,11,'listo');}
  /* R3: en proceso, con cronómetro corriendo hoy */
  {const p=plan('R3',7,10,5,['Notebook','Lenovo','ThinkPad E14','LNV-T3303'],'Muy lenta, el disco está al 100% todo el tiempo.',{tech:T1,acc:['Cargador'],cond:['Sin daños visibles'],promised:6});
   p.diag(0,12,'Disco rígido lento y con errores. Se cambia por SSD NVMe y se clona el sistema.','Disco lento',T1);p.quote(0,13,[mo('svc-ssd'),mo('svc-so'),rep('SSD-NV512',1)]);p.approve(1,10,'whatsapp');
   p.at(1,11,o=>{['Clonar el sistema al SSD nuevo','Instalar SSD y verificar arranque','Instalar programas del cliente'].forEach(t=>taskAdd(o.id,{text:t,techId:o.techId}));timerStart(o.id);});p.at(1,13,o=>timerStop(o.id));p.doTask(1,13,0);
   p.at(7,9,o=>timerStart(o.id),30);}
  /* R4: presupuesto enviado (vigente) -> consulta pública de la demo */
  {const p=plan('R4',6,16,6,['PC de escritorio','Genérica','Core i5','PC-D4404'],'No da video, la pantalla queda en negro aunque enciende.',{tech:T3,acc:['Cable de poder','Teclado','Mouse'],cond:['Sin daños visibles'],pass:false});
   p.diag(1,10,'Placa de video con fallas. Se recomienda cambiar la memoria y limpiar contactos.','Contactos y memoria',T3);p.quote(5,11,[mo('svc-ram'),mo('svc-limp'),rep('RAM-D8',1),rep('PASTA',1)]);}
  /* R5: presupuesto enviado hace tiempo -> atrasada */
  {const p=plan('R5',6,11,7,['Impresora','Epson','L3150','EPS-A5505'],'Se atasca el papel en cada hoja.',{tech:T2,acc:['Cable de poder','Cable USB'],cond:['Sin daños visibles'],pass:false});
   p.diag(0,13,'Rodillos de arrastre gastados. Mantenimiento completo.','Rodillos gastados',T2);p.quote(0,14,[mo('svc-imp')]);}
  /* R6: en prueba, con anticipo digital sin verificar */
  {const p=plan('R6',5,10,8,['Notebook','HP','14-cf2000','HP-P6606'],'Pantalla rota por un golpe en la mochila.',{tech:T1,prio:'alta',photos:[photo[1],photo[0]],acc:['Cargador','Bolso / funda'],cond:['Pantalla rota'],promised:3});
   p.diag(0,12,'Panel roto. Reemplazo de pantalla de 14 pulgadas.','Panel dañado',T1);p.quote(0,13,[mo('svc-pant'),rep('PAN-14',1)]);p.approve(0,17,'whatsapp');
   p.pay(0,18,[['transferencia',30000,0,'TR-9988']],'anticipo');
   p.work(1,9,['Desarmar tapa y retirar panel','Instalar pantalla nueva','Probar imagen y bisagras'],130);p.doTask(1,11,0);p.doTask(1,11,1);p.doTask(1,12,2);p.use(1,12,'PAN-14');p.move(1,12,'prueba');p.testSome(1,14,3);}
  /* R7: proceso, falta repuesto (ficha DC) */
  {const p=plan('R7',4,10,9,['Notebook','Dell','Latitude 3410','DEL-C7707'],'No carga la batería, el conector se mueve.',{tech:T3,acc:['Cargador'],cond:['Sin daños visibles'],pass:false});
   p.diag(0,12,'Ficha de carga rota. Se reemplaza el conector.','Ficha DC rota',T3);p.quote(0,13,[mo('svc-fuente'),rep('CONN-DC',2)]);p.approve(0,16,'telefono');}
  /* R8: proceso, también necesita ficha DC (queda faltante) */
  {const p=plan('R8',3,11,10,['Notebook','Acer','Aspire 3','ACR-C8808'],'No carga. Dice "conectado, no carga".',{tech:T2,acc:['Cargador'],cond:['Rayones leves'],pass:false});
   p.diag(0,13,'Conector de carga en mal estado.','Ficha DC rota',T2);p.quote(0,14,[mo('svc-fuente'),rep('CONN-DC',2)]);p.approve(0,16,'whatsapp');p.at(1,9,o=>reqCreate({orderId:o.id,desc:'Pedir más fichas DC jack: hay varias notebooks con el mismo problema',qty:6}));}
  /* R9: diagnóstico en curso */
  {const p=plan('R9',3,15,11,['Tablet / celular','Samsung','Galaxy Tab A8','TAB-S9909'],'No enciende después de un golpe.',{tech:T2,acc:['Cargador','Funda'],cond:['Golpe en una esquina'],pass:false});
   p.at(1,10,o=>{orderMove(o.id,'diagnostico');timerStart(o.id);});p.at(1,11,o=>timerStop(o.id));}
  /* R10: pendiente sin técnico, atrasada */
  {const p=plan('R10',2,10,12,['PC de escritorio','Genérica','Core i7','PC-R1010'],'Hace un ruido fuerte y se reinicia sola.',{prio:'alta',acc:['Cable de poder'],cond:['Sin daños visibles'],pass:false});}
  /* R11: entregada hoy */
  {const p=plan('R11',2,16,3,['Notebook','Lenovo','V15','LNV-W1111'],'Quiere reinstalar Windows y los programas de oficina.',{tech:T3,acc:['Cargador'],cond:['Sin daños visibles'],pass:false});
   p.diag(0,17,'Sistema con fallas de arranque; se reinstala todo.','Sistema dañado',T3);p.quote(0,18,[mo('svc-fmt')]);p.approve(1,9,'whatsapp');p.work(1,10,['Respaldar y reinstalar','Instalar programas'],150);p.doTask(1,12,0);p.doTask(1,13,1);p.move(1,13,'prueba');p.testAll(1,14);p.move(1,15,'listo');p.pay(2,9,[['debito',0,0,'Cupón 5120']]);p.deliver(2,9);}
  /* R12: urgente sin técnico */
  {const p=plan('R12',1,9,2,['Notebook','Lenovo','IdeaPad 5','LNV-U1212'],'La bisagra se rompió y la tapa se separa de la base.',{prio:'urgente',acc:['Cargador'],cond:['Bisagra rota','Golpe en una esquina'],photos:[photo[1]],promised:2});}
  /* R13: diagnóstico */
  {const p=plan('R13',1,12,4,['All-in-one','HP','Pavilion 24','AIO-H1313'],'La pantalla tiene líneas verticales de colores.',{tech:T2,acc:['Cable de poder','Teclado','Mouse'],cond:['Sin daños visibles'],pass:false});
   p.at(0,13,o=>{orderMove(o.id,'diagnostico');timerStart(o.id);});p.at(0,14,o=>timerStop(o.id));}
  /* R14, R15: de hoy */
  {plan('R14',0,9,5,['Notebook','HP','Pavilion 15','HP-N1414'],'El teclado no responde, algunas teclas no escriben.',{acc:['Cargador'],cond:['Sin daños visibles'],pass:false});}
  {const p=plan('R15',0,10,6,['Notebook','Dell','Vostro 3500','DEL-N1515'],'No reconoce el disco y no inicia el sistema.',{tech:T3,acc:['Cargador'],cond:['Sin daños visibles']});
   p.at(0,10,o=>{orderMove(o.id,'diagnostico');},30);}
  /* ---- caja: egresos, ingresos y ventas de mostrador (días fijos) ---- */
  const rb=n=>S.rubros.find(r=>r.name===n).id;
  at(28,9,()=>cashMove({type:'ingreso',amountCents:$p(50000),rubroId:rb('Aporte del dueño'),desc:'Aporte para cambio de la caja'}),20);
  at(20,15,()=>cashMove({type:'egreso',amountCents:$p(12000),rubroId:rb('Compra de insumos y repuestos'),desc:'Compra de alcohol y paños en la ferretería'}));
  at(15,14,()=>cashMove({type:'egreso',amountCents:$p(18000),rubroId:rb('Servicios (luz, internet)'),desc:'Pago de internet del taller'}));
  at(9,16,()=>cashMove({type:'egreso',amountCents:$p(20000),rubroId:rb("Retiro del dueño"),desc:"Retiro semanal"}));
  const sale=(items,m,rec)=>{const total=sum(items,r=>Math.round(r[1]*it(r[0]).priceCents));return saleCreate({items:items.map(r=>({itemId:it(r[0]).id,qty:r[1]})),lines:[{m,a:total,...(rec?{recibido:$p(rec)}:{})}],key:'seed-sale-'+seq++});};
  at(24,12,()=>sale([['PEN-32',1]],'efectivo',20000));at(21,17,()=>sale([['MOU-USB',1],['CAB-HD',1]],'efectivo'));at(17,11,()=>sale([['CARG-65',1]],'debito'));at(12,18,()=>sale([['PEN-64',1]],'efectivo'));at(8,10,()=>sale([['KIT-LIMP',2]],'efectivo'));at(5,12,()=>sale([['TEC-USB',1],['MOU-USB',1]],'efectivo',30000));at(2,11,()=>sale([['CAB-UC',2]],'efectivo'));at(1,16,()=>sale([['PEN-32',1]],'transferencia'));at(0,9,()=>sale([['TIN-N',1],['CAB-HD',1]],'efectivo',30000),40);
  /* ---- compras a proveedores ---- */
  at(25,10,()=>receiptCreate({key:'seed-rc1',supplierId:sup[0].id,docType:'Factura',docNo:'0003-00012345',date:stamp(25,10),lines:[{itemId:it('SSD-240').id,qty:5,costCents:$p(21500)},{itemId:it('PASTA').id,qty:6,costCents:$p(3600)}],declaredTotalCents:$p(21500)*5+$p(3600)*6,condition:'cc'}));
  at(22,12,()=>supplierPay({supplierId:sup[0].id,amountCents:$p(60000),method:'transferencia',rubroId:rb('Compra de insumos y repuestos'),note:'Transferencia TR-7001'}));
  at(14,10,()=>receiptCreate({key:'seed-rc2',supplierId:sup[2].id,docType:'Factura',docNo:'0001-00004410',date:stamp(14,10),lines:[{itemId:it('TIN-N').id,qty:4,costCents:$p(4500)}],declaredTotalCents:$p(4500)*4,condition:'contado',method:'transferencia',rubroId:rb('Compra de insumos y repuestos')}));
  at(2,12,()=>{const g=suggestPO();const ks=Object.keys(g).filter(k=>k!=='_');const sid=g[sup[1].id]?sup[1].id:ks[0];if(sid&&g[sid].length)poSave({supplierId:sid,lines:g[sid],status:'solicitada'});});
  /* ---- herramientas ---- */
  at(12,10,()=>toolLoan(it('HER-MULT').id,T1));at(11,17,()=>{const l=S.loans.find(x=>!x.returnedAt&&x.itemId===it('HER-MULT').id);if(l)toolReturn(l.id);});
  at(2,10,()=>toolLoan(it('HER-PIST').id,T3));at(1,10,()=>toolLoan(it('HER-MULT').id,T1),20);
  /* ---- ejecutar el reloj simulado día por día ---- */
  const DAYS=[];for(let d=29;d>=0;d--)DAYS.push(d);
  let last=day0-30*DAY;
  const setT=ts=>{ts=Math.min(ts,base-30000);if(ts<=last)ts=last+1000;last=ts;T_FIX=ts;};
  EV.sort((a,b)=>b.d-a.d||a.h-b.h||a.i-b.i);
  for(const d of DAYS){
    setT(stamp(d,8,45));if(!openSession())cashOpen($p(d===29?60000:40000));
    for(const e of EV.filter(x=>x.d===d)){setT(stamp(d,Math.floor(e.h),Math.round((e.h%1)*60)));try{e.fn();}catch(err){console.error('SEED',d,e.h,err.message);throw err;}}
    if(d>0){setT(stamp(d,20,45));const s=openSession();const ar=arqueoCalc(s);const diff=d===1?-$p(500):0;cashClose({declaredCents:ar.efectivoEsperado+diff,notes:diff?'Faltante de $ 500, posible error de vuelto. Se revisa.':''});}
  }
  /* ---- verificar el pago digital de R6 queda pendiente a propósito ---- */
  T_FIX=null;
  /* ---- avisos viejos ya leídos; consulta pública de la demo ---- */
  const allIds=S.users.map(u=>u.id);for(const n of S.notifs)if(n.ts<base-2*DAY)n.readBy=[...allIds];
  const dem=orders.R4;S.demo={n:dem.n,last4:waDigits(getClient(dem.clientId).wa).slice(-4)};
  S.seeded=true;S.builtAt=APP.build;SEEDING=false;SESSION.uid=null;
  return S;
}
