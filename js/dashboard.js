import {state} from "./store.js";import {esc,receipt} from "./forms.js";
const n=x=>Math.round(x).toLocaleString("en-US"),sgn=i=>i.kind==="credit"?-1:1;
const net=x=>(x.total??x.amount)-(x.vat||0);
let charts=[];
export function render(el,filter={}){
  charts.forEach(c=>c.destroy());charts=[];
  const inP=x=>!filter.p||x.projectId===filter.p,inD=x=>!filter.m||(x.date||"").startsWith(filter.m);
  const ex=state.expenses.filter(x=>inP(x)&&inD(x)),inv=state.invoices.filter(x=>inP(x)&&inD(x));
  const exp=ex.reduce((s,x)=>s+net(x),0),rev=inv.reduce((s,x)=>s+sgn(x)*net(x),0),prof=rev-exp;
  const mgr=state.role!=="entry";
  const proj=state.projects.filter(p=>!filter.p||p.id===filter.p).map(p=>{const e=ex.filter(x=>x.projectId===p.id).reduce((s,x)=>s+net(x),0),r=inv.filter(x=>x.projectId===p.id).reduce((s,x)=>s+sgn(x)*net(x),0);return{id:p.id,name:p.name,e,r}});
  const months=[...new Set([...ex,...inv].map(x=>(x.date||"").slice(0,7)))].sort();
  const mv=(a,m,f)=>a.filter(x=>(x.date||"").startsWith(m)).reduce((s,x)=>s+f(x),0);
  const due=customers();
  const cats=[...new Set(ex.map(x=>x.category))].sort(),tot=cats.map(c=>ex.filter(x=>x.category===c).reduce((s,x)=>s+net(x),0)),sum=tot.reduce((a,b)=>a+b,0)||1;
  const PAL=["#2f6f9f","#b5483a","#2e7d5b","#d79b2b","#7a5ea8","#3a9aa6","#8a6d4b","#c46a8e","#5f7a8c"],col=i=>PAL[i%PAL.length],pct=v=>Math.round(v/sum*1000)/10;
  const order=cats.map((c,i)=>i).sort((a,b)=>tot[b]-tot[a]),pn=state.projects.find(p=>p.id===filter.p)?.name;
  el.innerHTML=`<div class="row" style="margin-bottom:12px"><select id="fp"><option value="">كل المشاريع</option>${state.projects.map(p=>`<option value="${p.id}" ${filter.p===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select><input id="fm" type="month" value="${filter.m||""}"></div>
  <div class="cards"><div class="c"><small>الإيرادات</small><b>${mgr?n(rev):"—"}</b></div><div class="c"><small>المصاريف</small><b>${n(exp)}</b></div>
  <div class="c"><small>صافي الربح</small><b class="${prof>=0?"pos":"neg"}">${mgr?n(prof):"—"}</b></div><div class="c"><small>الهامش</small><b>${mgr&&rev?Math.round(prof/rev*100)+"%":"—"}</b></div>
  ${mgr?`<div class="c"><small>مستحق على العملاء</small><b>${n(due.reduce((s,d)=>s+d.left,0))}</b></div>`:""}</div>
  <div class="g2"><div class="box"><b>مقارنة المشاريع</b><canvas id="c1"></canvas></div><div class="box"><b>الاتجاه الشهري</b><canvas id="c2"></canvas></div></div>
  <div class="g2"><div class="box"><b>توزيع المصاريف حسب البند${pn?" — "+esc(pn):""}</b><canvas id="c3"></canvas></div>
  <div class="box"><b>تفاصيل البنود</b><table><tr><th>البند</th><th>المبلغ</th><th>النسبة</th><th></th></tr>${order.map(i=>`<tr><td><span style="color:${col(i)}">●</span> ${esc(cats[i])}</td><td>${n(tot[i])}</td><td>${pct(tot[i])}%</td><td><div class="bar"><i style="width:${pct(tot[i])}%;background:${col(i)}"></i></div></td></tr>`).join("")||"<tr><td colspan=4>لا توجد مصاريف في هذا الاختيار.</td></tr>"}</table></div></div>
  <div class="box"><b>مقارنة البنود بين المشاريع</b><canvas id="c4"></canvas></div>
  ${mgr?`<div class="box"><b>أرصدة العملاء</b><table><tr><th>العميل</th><th>الفواتير</th><th>المستلم</th><th>المتبقي</th></tr>${due.map(d=>`<tr><td>${esc(d.name)}</td><td>${n(d.total)}</td><td>${n(d.got)}</td><td><b>${n(d.left)}</b></td></tr>`).join("")||"<tr><td colspan=4>لا توجد فواتير بعد. اضغط + لإضافة أول فاتورة.</td></tr>"}</table></div>`:""}`;
  el.querySelector("#fp").onchange=e=>render(el,{...filter,p:e.target.value});el.querySelector("#fm").onchange=e=>render(el,{...filter,m:e.target.value});
  const C=(id,cfg)=>charts.push(new Chart(el.querySelector(id),cfg)),opt={plugins:{legend:{position:"bottom"}}};
  C("#c1",{type:"bar",data:{labels:proj.map(p=>p.name),datasets:[...(mgr?[{label:"إيراد",data:proj.map(p=>p.r),backgroundColor:"#2e7d5b"}]:[]),{label:"مصروف",data:proj.map(p=>p.e),backgroundColor:"#b5483a"}]},options:opt});
  C("#c2",{type:"line",data:{labels:months,datasets:[...(mgr?[{label:"إيراد",data:months.map(m=>mv(inv,m,x=>sgn(x)*net(x))),borderColor:"#2e7d5b"}]:[]),{label:"مصروف",data:months.map(m=>mv(ex,m,net)),borderColor:"#b5483a"}]},options:opt});
  C("#c3",{type:"doughnut",data:{labels:cats.map((c,i)=>c+" "+pct(tot[i])+"%"),datasets:[{data:tot,backgroundColor:cats.map((c,i)=>col(i))}]},options:opt});
  C("#c4",{type:"bar",data:{labels:proj.map(p=>p.name),datasets:cats.map((c,i)=>({label:c,backgroundColor:col(i),data:proj.map(p=>ex.filter(x=>x.projectId===p.id&&x.category===c).reduce((s,x)=>s+net(x),0))}))},options:{scales:{x:{stacked:true},y:{stacked:true}},plugins:{legend:{position:"bottom"}}}});
}
export function customers(){const m={};
  state.invoices.forEach(i=>{const c=m[i.customer]??={name:i.customer,total:0,got:0};c.total+=sgn(i)*i.total});
  state.receipts.forEach(r=>{const i=state.invoices.find(x=>x.id===r.invoiceId);if(i)m[i.customer].got+=r.amount});
  return Object.values(m).map(c=>({...c,left:c.total-c.got})).sort((a,b)=>b.left-a.left);}
export const invLeft=i=>i.total-state.receipts.filter(r=>r.invoiceId===i.id).reduce((s,r)=>s+r.amount,0);
export function listExpenses(el){const P=id=>state.projects.find(p=>p.id===id)?.name||"";const S={bank:"بنك",cash:"صندوق",custody:"عهدة"};
  el.innerHTML=`<div class="box"><table><tr><th>التاريخ</th><th>المشروع</th><th>البند</th><th>المصدر</th><th>المبلغ</th></tr>${[...state.expenses].sort((a,b)=>b.date>a.date?1:-1).map(x=>`<tr><td>${x.date}</td><td>${esc(P(x.projectId))}</td><td>${esc(x.category)}</td><td>${S[x.source]||""}</td><td>${n(x.amount)}</td></tr>`).join("")||"<tr><td>لا توجد مصاريف. اضغط + لإضافة أول مصروف.</td></tr>"}</table></div>`;}
export function listInvoices(el,canRec){const P=id=>state.projects.find(p=>p.id===id)?.name||"";
  el.innerHTML=`<div class="box"><table><tr><th>التاريخ</th><th>العميل</th><th>المشروع</th><th>الإجمالي</th>${canRec?"<th>المستلم</th><th>المتبقي</th><th></th>":""}</tr>${[...state.invoices].sort((a,b)=>b.date>a.date?1:-1).map(i=>{const l=invLeft(i),pc=i.total?Math.round((i.total-l)/i.total*100):0;
  return`<tr><td>${i.date}</td><td>${esc(i.customer)}${i.kind==="credit"?" (إشعار دائن)":""}</td><td>${esc(P(i.projectId))}</td><td>${n(i.total)}</td>${canRec?`<td><div class="bar"><i style="width:${pc}%"></i></div></td><td>${n(l)}</td><td>${l>0&&i.kind!=="credit"?`<button data-r="${i.id}">استلام</button>`:""}</td>`:""}</tr>`}).join("")||"<tr><td>لا توجد فواتير.</td></tr>"}</table></div>`;
  el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{const i=state.invoices.find(x=>x.id===b.dataset.r);receipt(i,invLeft(i))});}
export function listProjects(el){el.innerHTML=`<div class="box"><table><tr><th>المشروع</th><th>العميل</th></tr>${state.projects.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.customer||"")}</td></tr>`).join("")||"<tr><td>أضف أول مشروع بزر +</td></tr>"}</table></div>`;}
