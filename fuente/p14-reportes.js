/* =====================================================================
   REPORTES: rentabilidad por servicio y por técnico, repuestos más
   usados e historial financiero. Cada cifra muestra cómo se calcula.
   ===================================================================== */
UI.f.rep={per:'30',tab:'servicios'};
const REP_PERIODS=[['7','7 días'],['30','30 días'],['todo','Todo']];
function repServicios(a,b){
  const rows=reportServices(a,b);const acc={nm:r=>r.name,n:r=>r.n,rev:r=>r.rev,cost:r=>r.cost,mar:r=>r.margin,pc:r=>r.marginPct,min:r=>r.mins};
  const srt=sortRows('rs',rows,acc,{key:'mar',dir:'desc'});
  const tot={n:sum(rows,r=>r.n),rev:sum(rows,r=>r.rev),cost:sum(rows,r=>r.cost),mins:sum(rows,r=>r.mins)};
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('rs','nm','Servicio')+sortHead('rs','n','Trabajos','r')+sortHead('rs','rev','Ingresos','r')+sortHead('rs','cost','Costo repuestos','r hide-sm')+sortHead('rs','mar','Margen bruto','r')+sortHead('rs','pc','Margen %','r hide-sm')+sortHead('rs','min','Tiempo real','r hide-sm')+'</tr></thead><tbody>'
   +(srt.length?srt.map(r=>'<tr><td><b>'+esc(r.name)+'</b></td><td class="r num">'+r.n+'</td><td class="r num">'+esc(fmt(r.rev))+'</td><td class="r num hide-sm">'+esc(fmt(r.cost))+'</td><td class="r num"><b>'+esc(fmt(r.margin))+'</b></td><td class="r num hide-sm">'+(r.rev?esc(String(r.marginPct).replace('.',','))+' %':'—')+'</td><td class="r num hide-sm">'+esc(dur(r.mins*MIN))+(r.est?'<br><small class="mut">est. '+esc(dur(r.est*MIN))+'</small>':'')+'</td></tr>').join('')+'<tr style="font-weight:700"><td>Total</td><td class="r num">'+tot.n+'</td><td class="r num">'+esc(fmt(tot.rev))+'</td><td class="r num hide-sm">'+esc(fmt(tot.cost))+'</td><td class="r num">'+esc(fmt(tot.rev-tot.cost))+'</td><td class="r num hide-sm">'+(tot.rev?esc(String(pct(tot.rev-tot.cost,tot.rev)).replace('.',','))+' %':'—')+'</td><td class="r num hide-sm">'+esc(dur(tot.mins*MIN))+'</td></tr>':'<tr><td colspan="7"><div class="empty">No hay reparaciones entregadas en este período.</div></td></tr>')+'</tbody></table>');
}
function repTecnicos(a,b){
  const rows=reportTechs(a,b);const acc={nm:r=>r.name,n:r=>r.n,mo:r=>r.moRev,min:r=>r.mins,ef:r=>r.eff,co:r=>r.commission};
  const srt=sortRows('rt',rows,acc,{key:'mo',dir:'desc'});
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('rt','nm','Técnico')+sortHead('rt','n','Trabajos','r')+sortHead('rt','mo','Mano de obra facturada','r')+sortHead('rt','min','Tiempo real','r hide-sm')+sortHead('rt','ef','Eficiencia','r hide-sm')+sortHead('rt','co','Comisión','r')+'</tr></thead><tbody>'
   +srt.map(r=>'<tr><td><b>'+esc(r.name)+'</b><br><small class="mut">comisión '+r.pct+' %</small></td><td class="r num">'+esc(String(r.n).replace('.',','))+'</td><td class="r num">'+esc(fmt(r.moRev))+'</td><td class="r num hide-sm">'+esc(dur(r.mins*MIN))+'</td><td class="r num hide-sm">'+(r.eff?r.eff+' %':'—')+'</td><td class="r num"><b>'+esc(fmt(r.commission))+'</b></td></tr>').join('')+'</tbody></table>');
}
function repRepuestos(a,b){
  const m={};for(const o of deliveredBetween(a,b))for(const l of o.quote.lines)if(l.kind==='rep'&&l.state==='usado'){const r=m[l.itemId]=m[l.itemId]||{name:l.desc,q:0,rev:0,cost:0};r.q+=l.qty;r.rev+=lineAmt(l);r.cost+=Math.round(l.costCents*l.qty);}
  const acc={nm:r=>r.name,q:r=>r.q,rev:r=>r.rev,mar:r=>r.rev-r.cost};const rows=sortRows('rr',Object.values(m),acc,{key:'q',dir:'desc'});
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('rr','nm','Repuesto')+sortHead('rr','q','Cantidad usada','r')+sortHead('rr','rev','Vendido','r')+sortHead('rr','mar','Margen','r')+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr><td>'+esc(r.name)+'</td><td class="r num">'+esc(fq(r.q))+'</td><td class="r num">'+esc(fmt(r.rev))+'</td><td class="r num">'+esc(fmt(r.rev-r.cost))+'</td></tr>').join(''):'<tr><td colspan="4"><div class="empty">Sin repuestos usados en el período.</div></td></tr>')+'</tbody></table>');
}
function repOrdenes(a,b){
  const os=deliveredBetween(a,b);const acc={n:o=>o.n,eq:o=>devLabel(orderDev(o)),tec:o=>o.techId?userName(o.techId):'',rev:o=>orderEconomics(o).rev,cost:o=>orderEconomics(o).cost,mar:o=>orderEconomics(o).margin,ent:o=>o.dates.delivered};
  const rows=sortRows('ro',os,acc,{key:'ent',dir:'desc'});
  return tableWrap('<table class="tbl"><thead><tr>'+sortHead('ro','n','Orden')+sortHead('ro','eq','Equipo','hide-sm')+sortHead('ro','tec','Técnico','hide-sm')+sortHead('ro','rev','Ingreso','r')+sortHead('ro','cost','Costo','r hide-sm')+sortHead('ro','mar','Margen','r')+sortHead('ro','ent','Entrega','hide-sm')+'</tr></thead><tbody>'+(rows.length?rows.map(o=>{const e=orderEconomics(o);return '<tr class="clk" data-act="goto" data-to="orden/'+o.id+'"><td><a href="#panel/orden/'+o.id+'">'+esc(otCode(o))+'</a>'+(o.type==='garantia'?' '+badge('Garantía','info'):'')+'</td><td class="hide-sm">'+esc(devLabel(orderDev(o)))+'</td><td class="hide-sm">'+esc(o.techId?userName(o.techId):'—')+'</td><td class="r num">'+esc(fmt(e.rev))+'</td><td class="r num hide-sm">'+esc(fmt(e.cost))+'</td><td class="r num"><b>'+esc(fmt(e.margin))+'</b></td><td class="hide-sm nowrap">'+esc(fdate(o.dates.delivered))+'</td></tr>';}).join(''):'<tr><td colspan="7"><div class="empty">Sin entregas en el período.</div></td></tr>')+'</tbody></table>');
}
const REP_TABS=[['servicios','Por servicio',repServicios],['tecnicos','Por técnico',repTecnicos],['repuestos','Repuestos',repRepuestos],['ordenes','Por reparación',repOrdenes]];
SCREENS.reportes={title:'Reportes',perm:'view_reports',view(){
  const F=UI.f.rep;const [a,b]=periodRange(F.per);const tab=REP_TABS.find(t=>t[0]===F.tab)||REP_TABS[0];
  const os=deliveredBetween(a,b);const rev=sum(os,o=>orderEconomics(o).rev),cost=sum(os,o=>orderEconomics(o).cost);
  const formula={servicios:'Margen bruto = ingresos − costo de los repuestos usados. La mano de obra y los repuestos de cada orden se reparten entre sus servicios en proporción a lo facturado.',tecnicos:'Comisión = % del importe de mano de obra de cada orden, repartido entre los técnicos según el tiempo cronometrado de cada uno. Eficiencia = tiempo estimado ÷ tiempo real.',repuestos:'Sólo cuenta repuestos marcados como «usados» en reparaciones entregadas.',ordenes:'Ingreso − costo de repuestos usados. No descuenta sueldos ni gastos fijos.'}[tab[0]];
  return pageHead('Reportes de rentabilidad','Basados en las reparaciones <b>entregadas</b> en el período.','<div class="seg" role="group" aria-label="Período">'+REP_PERIODS.map(p=>'<button type="button" data-act="repPer" data-p="'+p[0]+'" aria-pressed="'+(F.per===p[0])+'">'+p[1]+'</button>').join('')+'</div><button type="button" class="btn" data-act="repCsv">'+ic('download',18)+'Exportar CSV</button>')
   +'<div class="bento"><div class="card kpi"><div class="mut sm">Reparaciones entregadas</div><div class="big num">'+os.length+'</div></div><div class="card kpi"><div class="mut sm">Ingresos</div><div class="big num">'+esc(fmt(rev))+'</div></div><div class="card kpi"><div class="mut sm">Costo de repuestos</div><div class="big num">'+esc(fmt(cost))+'</div></div><div class="card kpi"><div class="mut sm">Margen bruto</div><div class="big num">'+esc(fmt(rev-cost))+'</div><div class="mut xs">'+(rev?esc(String(pct(rev-cost,rev)).replace('.',','))+' % de los ingresos':'')+'</div></div></div>'
   +'<div class="tabs" role="tablist" style="margin-top:16px">'+REP_TABS.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab[0])+'" data-act="repTab" data-t="'+t[0]+'">'+esc(t[1])+'</button>').join('')+'</div>'
   +'<div class="card">'+tab[2](a,b)+'<p class="mut xs" style="margin:10px 0 0">'+esc(formula)+'</p></div>';
}};
ACTS.repPer=el=>{UI.f.rep.per=el.dataset.p;renderView();};
ACTS.repTab=el=>{UI.f.rep.tab=el.dataset.t;renderView();};
ACTS.repCsv=()=>{const [a,b]=periodRange(UI.f.rep.per);const t=UI.f.rep.tab;let rows;
  if(t==='servicios'){rows=[['Servicio','Trabajos','Ingresos','Costo repuestos','Margen bruto','Margen %','Min reales','Min estimados']];for(const r of reportServices(a,b))rows.push([r.name,r.n,r.rev/100,r.cost/100,r.margin/100,r.marginPct,r.mins,r.est]);}
  else if(t==='tecnicos'){rows=[['Técnico','Trabajos','Mano de obra facturada','Min reales','Eficiencia %','Comisión %','Comisión']];for(const r of reportTechs(a,b))rows.push([r.name,r.n,r.moRev/100,r.mins,r.eff,r.pct,r.commission/100]);}
  else{rows=[['Orden','Equipo','Técnico','Ingreso','Costo','Margen','Entrega']];for(const o of deliveredBetween(a,b)){const e=orderEconomics(o);rows.push([otCode(o),devLabel(orderDev(o)),o.techId?userName(o.techId):'',e.rev/100,e.cost/100,e.margin/100,fdate(o.dates.delivered)]);}}
  downloadText('reporte-'+t+'.csv',toCSV(rows),'text/csv');};
