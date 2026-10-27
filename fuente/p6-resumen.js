/* =====================================================================
   RESUMEN (Dashboard Analytics): primera pantalla del panel
   ===================================================================== */
UI.f.res={per:'30'};
const PERIODS=[['hoy','Hoy'],['ayer','Ayer'],['7','7 días'],['30','30 días'],['todo','Todo']];
function periodRange(k){const t=now(),s=startOfDay(t);
  if(k==='hoy')return [s,s+DAY];if(k==='ayer')return [s-DAY,s];if(k==='7')return [s-6*DAY,s+DAY];if(k==='30')return [s-29*DAY,s+DAY];return [0,s+DAY*2];}
function lowItems(){return S.items.filter(i=>!i.archived&&i.kind!=='herramienta'&&((i.min>0&&stockOf(i.id)<=i.min)||stockOf(i.id)<0)).sort((a,b)=>(stockOf(a.id)-a.min)-(stockOf(b.id)-b.min));}
function lateOrders(){return S.orders.filter(o=>!ST[o.status].terminal&&isLate(o)).sort((a,b)=>a.stateSince-b.stateSince);}
function activeOrders(){return S.orders.filter(o=>!ST[o.status].terminal);}
function revenueIn(a,b){
  let svc=0,cnt=0;for(const o of deliveredBetween(a,b)){svc+=quoteTotals(o).total;cnt++;}
  let sales=0;for(const s of S.sales)if(s.status==='ok'&&s.ts>=a&&s.ts<b)sales+=s.totalCents;
  return {svc,sales,cnt,total:svc+sales};
}
function cobradoIn(a,b){let t=0;for(const p of S.payments){if(p.voidedAt||p.ts<a||p.ts>=b)continue;for(const l of p.lines)if(l.m!=='cc'&&l.verified)t+=l.a;}return t;}
function marginIn(a,b){let rev=0,cost=0;for(const o of deliveredBetween(a,b)){const e=orderEconomics(o);rev+=e.rev;cost+=e.cost;}
  for(const s of S.sales)if(s.status==='ok'&&s.ts>=a&&s.ts<b){rev+=s.totalCents;cost+=sum(s.items,l=>Math.round(l.qty*l.costCents));}
  return {rev,cost,margin:rev-cost};}
function ccTotal(){return sum(S.clients,c=>Math.max(0,ccBalance(c.id)));}
function pendingDigital(){return sum(S.payments.filter(p=>!p.voidedAt),p=>sum(p.lines.filter(l=>!l.verified),l=>l.a));}
function oldOpenCash(){const s=openSession();return s&&startOfDay(s.openedAt)<startOfDay(now())?s:null;}
function chartBars(id,items,names,colors){
  const W=640,H=230,pl=44,pr=8,pt=18,pb=34;const n=items.length;if(!n)return '<div class="empty">Sin datos suficientes</div>';
  const max=Math.max(1,...items.map(i=>sum(i.v,x=>x)));const nice=(()=>{const p=Math.pow(10,Math.floor(Math.log10(max)));const m=max/p;return (m<=1?1:m<=2?2:m<=5?5:10)*p;})();
  const bw=(W-pl-pr)/n,gap=Math.min(8,bw*.25);let g='';
  for(let k=0;k<=3;k++){const y=pt+(H-pt-pb)*(1-k/3);g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="#e1e7eb"/><text x="'+(pl-6)+'" y="'+(y+4)+'" text-anchor="end">'+esc(shortMoney(nice*k/3))+'</text>';}
  items.forEach((it,i)=>{let y0=H-pb;const x=pl+i*bw+gap/2,w=bw-gap;
    it.v.forEach((v,j)=>{const h=(H-pt-pb)*v/nice;if(h<=0)return;y0-=h;g+='<rect x="'+x.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+colors[j]+'"><title>'+esc(it.label+' · '+names[j]+': '+fmt(v))+'</title></rect>';});
    const tot=sum(it.v,x=>x);if(n<=16&&tot>0)g+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y0-4).toFixed(1)+'" text-anchor="middle" font-weight="700">'+esc(shortMoney(tot))+'</text>';
    if(n<=16||i%Math.ceil(n/12)===0)g+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(H-pb+15)+'" text-anchor="middle">'+esc(it.label)+'</text>';});
  const leg=names.map((nm,j)=>'<span class="row gap-s"><i class="dot" style="background:'+colors[j]+'"></i><span class="sm">'+esc(nm)+'</span></span>').join('');
  const tbl='<details style="margin-top:8px"><summary class="sm" style="cursor:pointer;min-height:32px">Ver como tabla</summary>'+tableWrap('<table class="tbl"><thead><tr><th>Día</th>'+names.map(n2=>'<th class="r">'+esc(n2)+'</th>').join('')+'<th class="r">Total</th></tr></thead><tbody>'+items.map(it=>'<tr><td>'+esc(it.label)+'</td>'+it.v.map(v=>'<td class="r num">'+esc(fmt(v))+'</td>').join('')+'<td class="r num"><b>'+esc(fmt(sum(it.v,x=>x)))+'</b></td></tr>').join('')+'</tbody></table>')+'</details>';
  return '<div class="row" style="margin-bottom:6px">'+leg+'</div><svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ingresos por día">'+g+'</svg>'+tbl;
}
function shortMoney(c){const p=c/100;if(p>=1e6)return '$'+(p/1e6).toFixed(1).replace('.',',')+' M';if(p>=1e3)return '$'+Math.round(p/1e3)+' k';return '$'+Math.round(p);}
function statusBars(){
  const cnt={};for(const o of activeOrders())cnt[o.status]=(cnt[o.status]||0)+1;const max=Math.max(1,...Object.values(cnt));
  return '<div class="col gap-s">'+ST_COLS.map(k=>'<a class="row" href="#panel/ordenes" style="text-decoration:none;color:inherit;flex-wrap:nowrap"><span style="flex:0 0 150px" class="sm">'+esc(ST[k].name)+'</span><div class="bar grow" aria-hidden="true"><i style="width:'+((cnt[k]||0)/max*100)+'%;background:'+ST[k].color+'"></i></div><b class="num" style="flex:0 0 28px;text-align:right">'+(cnt[k]||0)+'</b></a>').join('')+'</div>';
}
SCREENS.resumen={title:'Resumen',view(){
  const u=curUser();const per=UI.f.res.per;const [a,b]=periodRange(per);
  const act=activeOrders();
  const bar='<div class="row" role="group" aria-label="Período">'+'<div class="seg">'+PERIODS.map(p=>'<button type="button" data-act="resPer" data-p="'+p[0]+'" aria-pressed="'+(per===p[0])+'">'+p[1]+'</button>').join('')+'</div><button type="button" class="btn g" data-act="resPer" data-p="30">Restablecer</button></div>';
  const head=pageHead('Resumen',esc(S.cfg.shop.name)+' · actualizado '+esc(fdt(now()))+' (hora de Salta) '+exChip(),bar);
  if(u.role==='tecnico')return head+techHome(u);
  const rv=revenueIn(a,b),cob=cobradoIn(a,b),mg=marginIn(a,b);const listo=act.filter(o=>o.status==='listo');const porCobrar=sum(listo,o=>Math.max(0,orderPay(o).due));
  const tile=(cls,l,v,f,extra)=>'<div class="card kpi '+cls+'"><span class="l">'+l+'</span><span class="v num">'+v+'</span>'+(extra||'')+'<span class="f">'+f+'</span></div>';
  let h=head;
  const oc=oldOpenCash();if(oc)h+='<div class="alert warn" style="margin-bottom:14px" role="alert">'+ic('alert',18)+'<span>La caja N.º '+oc.n+' sigue abierta desde el '+esc(fdate(oc.openedAt))+'. '+(can('cash_close')?'<a href="#panel/caja">Cerrala</a> para que no se mezclen los días.':'Avisá a un supervisor para cerrarla.')+'</span></div>';
  h+='<div class="bento">'
   +tile('s3','Órdenes abiertas',act.length,'Fórmula: órdenes que no están entregadas ni canceladas.','<span class="sm mut">'+act.filter(o=>o.status==='proceso').length+' en proceso · '+act.filter(o=>o.status==='prueba').length+' en prueba</span>')
   +tile('s3','Listas para retirar',listo.length,'Saldo a cobrar de esas órdenes: '+fmt(porCobrar)+'.')
   +tile('s3','Ingresos del período',fmt(rv.total),'Fórmula: órdenes entregadas ('+fmt(rv.svc)+', '+rv.cnt+' órdenes) + ventas de mostrador ('+fmt(rv.sales)+').')
   +tile('s3','Cobrado en el período',fmt(cob),'Fórmula: pagos verificados sin cuenta corriente (efectivo, tarjetas, transferencias, QR).')
   +(can('view_costs')?tile('s3','Margen bruto estimado',fmt(mg.margin),'Ingresos − costo de repuestos usados ('+(mg.rev?pct(mg.margin,mg.rev)+' %':'—')+'). No descuenta sueldos, alquiler ni impuestos.'):'')
   +tile('s3','Ticket promedio',rv.cnt?fmt(Math.round(rv.svc/rv.cnt)):'—','Fórmula: ingresos por órdenes entregadas ÷ cantidad de órdenes.')
   +tile('s3','Deuda de clientes',fmt(ccTotal()),'Saldos de cuenta corriente pendientes de cobro.')
   +tile('s3','Cobros digitales sin verificar',fmt(pendingDigital()),'Transferencias y QR que todavía no se confirmaron.')
   +'</div>';
  // gráficos + alertas
  const days=[];const t0=startOfDay(now());const nd=per==='hoy'||per==='ayer'?1:per==='7'?7:30;const from=per==='ayer'?t0-DAY:per==='hoy'?t0:t0-(nd-1)*DAY;
  for(let i=0;i<nd;i++){const d0=from+i*DAY;const r=revenueIn(d0,d0+DAY);const p=tparts(d0+12*HOUR);days.push({label:p.day+'/'+p.month,v:[r.svc,r.sales]});}
  h+='<div class="bento" style="margin-top:16px"><div class="card s8"><h3>Ingresos por día</h3>'+(nd===1?'<p class="mut sm">Elegí 7 o 30 días para ver la evolución.</p>':'')+chartBars('ing',days,['Servicios entregados','Ventas de mostrador'],['#0F766E','#D97706'])+'</div>'
   +'<div class="card s4"><h3>Órdenes por estado</h3>'+statusBars()+'<p class="mut xs" style="margin-top:10px">Tocá una fila para abrir el tablero del taller.</p></div>';
  // alertas
  const al=[];const late=lateOrders();
  if(late.length)al.push(['bad','Órdenes atrasadas ('+late.length+')',late.slice(0,4).map(o=>'<a href="#panel/orden/'+o.id+'">'+esc(otCode(o))+'</a> '+esc(ST[o.status].name)+' hace '+esc(dur(now()-o.stateSince))).join('<br>')]);
  const low=lowItems();if(low.length)al.push([low.some(i=>stockOf(i.id)<0)?'bad':'warn','Stock bajo o negativo ('+low.length+')',low.slice(0,4).map(i=>esc(i.name)+': <b>'+esc(fq(stockOf(i.id)))+'</b> (mín. '+esc(fq(i.min))+')').join('<br>')]);
  const waitQ=act.filter(o=>o.status==='aprobacion');if(waitQ.length)al.push(['warn','Presupuestos esperando respuesta ('+waitQ.length+')',waitQ.slice(0,4).map(o=>'<a href="#panel/orden/'+o.id+'">'+esc(otCode(o))+'</a> '+esc(fmt(quoteTotals(o).total))+(o.quote.validUntil&&o.quote.validUntil<now()?' · <b>vencido</b>':'')).join('<br>')]);
  const stored=listo.filter(o=>now()-o.stateSince>S.cfg.storedDays*DAY);if(stored.length)al.push(['warn','Equipos sin retirar (+'+S.cfg.storedDays+' días)',stored.slice(0,4).map(o=>'<a href="#panel/orden/'+o.id+'">'+esc(otCode(o))+'</a> '+esc(devLabel(orderDev(o)))).join('<br>')]);
  const rq=S.reqs.filter(r=>r.status==='pendiente');if(rq.length)al.push(['info','Requerimientos técnicos pendientes ('+rq.length+')',rq.slice(0,3).map(r=>esc(r.desc)).join('<br>')]);
  if(pendingDigital()>0)al.push(['info','Cobros digitales por verificar',esc(fmt(pendingDigital()))+' esperando confirmación de acreditación.']);
  const bds=S.clients.filter(c=>!c.anon&&c.consent.mkt&&c.birth);
  h+='<div class="card s12"><h3>Alertas</h3>'+(al.length?'<div class="grid g3">'+al.map(x=>'<div class="alert '+x[0]+'" style="flex-direction:column;gap:4px"><b>'+x[1]+'</b><span class="sm">'+x[2]+'</span></div>').join('')+'</div>':'<div class="alert ok">'+ic('check',18)+'Todo en orden: no hay alertas.</div>')+'</div></div>';
  return h;
}};
function techHome(u){
  const mine=activeOrders().filter(o=>o.techId===u.id);const tasks=[];for(const o of activeOrders())for(const t of o.tasks)if(!t.done&&t.techId===u.id)tasks.push({o,t});
  const run=runningTimer(u.id);
  let h='';if(run)h+='<div class="alert info" style="margin-bottom:14px">'+ic('clock',18)+'<span>Cronómetro corriendo en <a href="#panel/orden/'+run.order.id+'"><b>'+esc(otCode(run.order))+'</b></a>: <b class="timer" data-timer="'+run.order.id+'" data-tech="'+u.id+'">'+clock(orderMs(run.order,u.id))+'</b></span></div>';
  h+='<div class="bento"><div class="card s6"><h3>Mis órdenes ('+mine.length+')</h3>'+(mine.length?'<div class="col">'+mine.map(o=>'<a class="card flat" href="#panel/orden/'+o.id+'" style="text-decoration:none;color:inherit"><div class="row spread"><b>'+esc(otCode(o))+' · '+esc(devLabel(orderDev(o)))+'</b>'+stBadge(o.status)+'</div><span class="sm mut">'+esc(o.intake.fault.slice(0,90))+'</span>'+(isLate(o)?'<br>'+badge('Atrasada','bad'):'')+'</a>').join('')+'</div>':'<div class="empty">No tenés órdenes asignadas. Tomá una desde el tablero del taller.</div>')+'</div>'
   +'<div class="card s6"><h3>Mis tareas pendientes ('+tasks.length+')</h3>'+(tasks.length?'<div class="col gap-s">'+tasks.map(x=>'<div class="row"><a href="#panel/orden/'+x.o.id+'">'+esc(otCode(x.o))+'</a><span class="grow">'+esc(x.t.text)+'</span></div>').join('')+'</div>':'<div class="empty">Sin tareas pendientes.</div>')+'</div>'
   +'<div class="card s12"><h3>Alertas</h3>'+(lateOrders().filter(o=>o.techId===u.id).length?lateOrders().filter(o=>o.techId===u.id).map(o=>'<div class="alert bad">'+esc(otCode(o))+' atrasada en '+esc(ST[o.status].name)+'</div>').join(''):'<div class="alert ok">Sin atrasos en tus órdenes.</div>')+'</div></div>';
  return h;
}
ACTS.resPer=el=>{UI.f.res.per=el.dataset.p;renderView();};
