import {state,can,csv} from "./store.js";import {esc,receipt,expense,invoice,project} from "./forms.js";
const n=x=>Math.round(x).toLocaleString("en-US"),sgn=i=>i.kind==="credit"?-1:1;
const net=x=>(x.total??x.amount)-(x.vat||0);
let charts=[];
let F={};
export function render(el,filter){filter=filter||F;F=filter;
  charts.forEach(c=>c.destroy());charts=[];
  const inP=x=>!filter.p||x.projectId===filter.p,inD=x=>!filter.m||(x.date||"").startsWith(filter.m);
  const ex=state.expenses.filter(x=>inP(x)&&inD(x)),inv=state.invoices.filter(x=>inP(x)&&inD(x));
  const exp=ex.reduce((s,x)=>s+net(x),0),rev=inv.reduce((s,x)=>s+sgn(x)*net(x),0),prof=rev-exp;
  const mgr=state.role!=="entry";
  const proj=state.projects.filter(p=>!filter.p||p.id===filter.p).map(p=>{const e=ex.filter(x=>x.projectId===p.id).reduce((s,x)=>s+net(x),0),r=inv.filter(x=>x.projectId===p.id).reduce((s,x)=>s+sgn(x)*net(x),0);return{id:p.id,name:p.name,e,r}});
  const months=[...new Set([...ex,...inv].map(x=>(x.date||"").slice(0,7)))].sort();
  const mv=(a,m,f)=>a.filter(x=>(x.date||"").startsWith(m)).reduce((s,x)=>s+f(x),0);
  const due=customers();
  const bud=mgr?state.projects.filter(p=>p.budget>0&&inP({projectId:p.id})).map(p=>{const s=state.expenses.filter(x=>x.projectId===p.id).reduce((a,x)=>a+net(x),0);return{name:p.name,s,b:p.budget,r:s/p.budget}}):[];
  const warn=bud.some(x=>x.r>.9)?`<div class="box" style="border-color:#b5483a;color:#b5483a">⚠ ${bud.filter(x=>x.r>.9).map(x=>esc(x.name)).join("، ")}: اقتربت من الميزانية أو تجاوزتها.</div>`:"";
  const budBox=bud.length?`<div class="box"><b>الميزانية مقابل الفعلي</b>${bud.map(x=>`<div style="margin:10px 0"><div style="display:flex;justify-content:space-between"><span>${esc(x.name)}</span><span class="${x.r>1?"neg":x.r>.8?"":"pos"}">${n(x.s)} / ${n(x.b)} — ${Math.round(x.r*100)}%${x.r>1?" (تجاوز "+n(x.s-x.b)+")":""}</span></div><div class="bar" style="height:10px"><i style="width:${Math.min(100,x.r*100)}%;background:${x.r>1?"#b5483a":x.r>.8?"#d79b2b":"#2e7d5b"}"></i></div></div>`).join("")}</div>`:"";
  const cats=[...new Set(ex.map(x=>x.category))].sort(),tot=cats.map(c=>ex.filter(x=>x.category===c).reduce((s,x)=>s+net(x),0)),sum=tot.reduce((a,b)=>a+b,0)||1;
  const PAL=["#2f6f9f","#3a9aa6","#d79b2b","#c4573f","#6fa287","#8e6c9e","#7c8fa3","#b98a5e","#4b6584"],col=i=>PAL[i%PAL.length],pct=v=>Math.round(v/sum*1000)/10;
  const order=cats.map((c,i)=>i).sort((a,b)=>tot[b]-tot[a]),pn=state.projects.find(p=>p.id===filter.p)?.name;
  el.innerHTML=`<div class="row" style="margin-bottom:12px"><select id="fp"><option value="">كل المشاريع</option>${state.projects.map(p=>`<option value="${p.id}" ${filter.p===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select><input id="fm" type="month" value="${filter.m||""}"><button id="pr" class="alt" style="flex:0 0 auto">طباعة</button></div>${warn}
  <div class="cards"><div class="c"><small>الإيرادات</small><b>${mgr?n(rev):"—"}</b></div><div class="c"><small>المصاريف</small><b>${n(exp)}</b></div>
  <div class="c"><small>صافي الربح</small><b class="${prof>=0?"pos":"neg"}">${mgr?n(prof):"—"}</b></div><div class="c"><small>الهامش</small><b>${mgr&&rev?Math.round(prof/rev*100)+"%":"—"}</b></div>
  ${mgr?`<div class="c"><small>مستحق على العملاء</small><b>${n(due.reduce((s,d)=>s+d.left,0))}</b></div>`:""}</div>
  ${budBox}
  <div class="g2"><div class="box"><b>مقارنة المشاريع</b><div class="cv"><canvas id="c1"></canvas></div></div><div class="box"><b>الاتجاه الشهري</b><div class="cv"><canvas id="c2"></canvas></div></div></div>
  <div class="g2"><div class="box"><b>توزيع المصاريف حسب البند${pn?" — "+esc(pn):""}</b><div class="cv"><canvas id="c3"></canvas></div></div>
  <div class="box"><b>تفاصيل البنود</b><table><tr><th>البند</th><th>المبلغ</th><th>النسبة</th><th></th></tr>${order.map(i=>`<tr><td><span style="color:${col(i)}">●</span> ${esc(cats[i])}</td><td>${n(tot[i])}</td><td>${pct(tot[i])}%</td><td><div class="bar"><i style="width:${pct(tot[i])}%;background:${col(i)}"></i></div></td></tr>`).join("")||"<tr><td colspan=4>لا توجد مصاريف في هذا الاختيار.</td></tr>"}</table></div></div>
  <div class="box"><b>مقارنة البنود بين المشاريع</b><div class="cv"><canvas id="c4"></canvas></div></div>
  ${mgr?`<div class="box"><b>أرصدة العملاء</b><table><tr><th>العميل</th><th>الفواتير</th><th>المستلم</th><th>المتبقي</th></tr>${due.map(d=>`<tr><td>${esc(d.name)}</td><td>${n(d.total)}</td><td>${n(d.got)}</td><td><b>${n(d.left)}</b></td></tr>`).join("")||"<tr><td colspan=4>لا توجد فواتير بعد. اضغط + لإضافة أول فاتورة.</td></tr>"}</table></div>`:""}`;
  el.querySelector("#fp").onchange=e=>render(el,{...filter,p:e.target.value});el.querySelector("#fm").onchange=e=>render(el,{...filter,m:e.target.value});el.querySelector("#pr").onclick=()=>print();
  Chart.defaults.font.family="'IBM Plex Sans Arabic',system-ui,sans-serif";Chart.defaults.font.size=12;Chart.defaults.color="#6b7c8c";
  const tip={rtl:true,textDirection:"rtl",backgroundColor:"#1f3447",padding:10,cornerRadius:6,callbacks:{label:c=>` ${c.dataset.label||c.label}: ${n(c.parsed.y??c.parsed)}`}};
  const leg={position:"bottom",rtl:true,labels:{usePointStyle:true,pointStyle:"circle",boxWidth:8,padding:16}};
  const k=v=>Math.abs(v)>=1e6?+(v/1e6).toFixed(1)+"M":Math.abs(v)>=1e3?+(v/1e3).toFixed(1)+"K":v;
  const sc={x:{grid:{display:false},border:{display:false}},y:{beginAtZero:true,border:{display:false},grid:{color:"#e6ebf0"},ticks:{callback:k,maxTicksLimit:6}}};
  const C=(id,cfg,has)=>{const cv=el.querySelector(id);if(!has){cv.parentNode.innerHTML='<div class="empty">لا توجد بيانات بعد</div>';return}charts.push(new Chart(cv,cfg))};
  const G="#2e8b6e",R="#c4573f",ln=(l,c,data)=>({label:l,data,borderColor:c,backgroundColor:c+"22",fill:true,tension:.35,pointRadius:3,pointHoverRadius:5,borderWidth:2});
  C("#c1",{type:"bar",data:{labels:proj.map(p=>p.name),datasets:[...(mgr?[{label:"إيراد",data:proj.map(p=>p.r),backgroundColor:G,borderRadius:4,maxBarThickness:36}]:[]),{label:"مصروف",data:proj.map(p=>p.e),backgroundColor:R,borderRadius:4,maxBarThickness:36}]},options:{maintainAspectRatio:false,scales:sc,plugins:{legend:leg,tooltip:tip}}},proj.some(p=>p.e||p.r));
  C("#c2",{type:"line",data:{labels:months,datasets:[...(mgr?[ln("إيراد",G,months.map(m=>mv(inv,m,x=>sgn(x)*net(x))))]:[]),ln("مصروف",R,months.map(m=>mv(ex,m,net)))]},options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},scales:sc,plugins:{legend:leg,tooltip:tip}}},months.length>0);
  const T=tot.reduce((p,q)=>p+q,0),ctr={id:"ctr",afterDraw(c){const{ctx,chartArea:a}=c,x=(a.left+a.right)/2,y=(a.top+a.bottom)/2;ctx.save();ctx.textAlign="center";ctx.fillStyle="#6b7c8c";ctx.font="12px 'IBM Plex Sans Arabic'";ctx.fillText("إجمالي المصاريف",x,y-10);ctx.fillStyle="#1f3447";ctx.font="700 20px 'IBM Plex Sans Arabic'";ctx.fillText(n(T),x,y+14);ctx.restore()}};
  C("#c3",{type:"doughnut",plugins:[ctr],data:{labels:cats,datasets:[{data:tot,backgroundColor:cats.map((c,i)=>col(i)),borderWidth:2,borderColor:"#fff",borderRadius:4,hoverOffset:6}]},options:{maintainAspectRatio:false,cutout:"68%",plugins:{legend:{display:false},tooltip:{...tip,callbacks:{label:c=>` ${c.label}: ${n(c.parsed)} (${pct(c.parsed)}%)`}}}}},tot.length>0);
  C("#c4",{type:"bar",data:{labels:proj.map(p=>p.name),datasets:cats.map((c,i)=>({label:c,backgroundColor:col(i),borderRadius:2,maxBarThickness:48,data:proj.map(p=>ex.filter(x=>x.projectId===p.id&&x.category===c).reduce((s,x)=>s+net(x),0))}))},options:{maintainAspectRatio:false,scales:{x:{...sc.x,stacked:true},y:{...sc.y,stacked:true}},plugins:{legend:leg,tooltip:tip}}},cats.length>0);
}
export function customers(){const m={};
  state.invoices.forEach(i=>{const c=m[i.customer]??={name:i.customer,total:0,got:0};c.total+=sgn(i)*i.total});
  state.receipts.forEach(r=>{const i=state.invoices.find(x=>x.id===r.invoiceId);if(i)m[i.customer].got+=r.amount});
  return Object.values(m).map(c=>({...c,left:c.total-c.got})).sort((a,b)=>b.left-a.left);}
export const invLeft=i=>i.total-state.receipts.filter(r=>r.invoiceId===i.id).reduce((s,r)=>s+r.amount,0);
export function listExpenses(el){const P=id=>state.projects.find(p=>p.id===id)?.name||"";const S={bank:"بنك",cash:"صندوق",custody:"عهدة"},A=x=>state.accounts.find(a=>a.id===x.accountId)?.name||S[x.source]||"";
  el.innerHTML=`<button id="xe" class="alt" style="margin-bottom:8px">تصدير Excel</button><div class="box"><table><tr><th>التاريخ</th><th>المشروع</th><th>البند</th><th>الحساب</th><th>المبلغ</th><th></th></tr>${[...state.expenses].sort((a,b)=>b.date>a.date?1:-1).map(x=>`<tr><td>${x.date}</td><td>${esc(P(x.projectId))}</td><td>${esc(x.category)}</td><td>${esc(A(x))}</td><td>${n(x.amount)}</td><td>${x.hasFile?`<button data-f="${x.id}">📎</button> `:""}${can("edit")?`<button data-ex="${x.id}">تعديل</button>`:""}</td></tr>`).join("")||"<tr><td>لا توجد مصاريف. اضغط + لإضافة أول مصروف.</td></tr>"}</table></div>`;el.querySelector("#xe").onclick=()=>csv("expenses",[["التاريخ","المشروع","البند","الحساب","المبلغ","الضريبة","المورد"],...state.expenses.map(x=>[x.date,P(x.projectId),x.category,A(x),x.amount,x.vat||0,x.vendor||""])]);el.querySelectorAll("[data-ex]").forEach(b=>b.onclick=()=>expense(state.expenses.find(x=>x.id===b.dataset.ex)));}
export function listInvoices(el,canRec){const P=id=>state.projects.find(p=>p.id===id)?.name||"";
  el.innerHTML=`<button id="xi" class="alt" style="margin-bottom:8px">تصدير Excel</button><div class="box"><table><tr><th>التاريخ</th><th>العميل</th><th>المشروع</th><th>الإجمالي</th><th></th>${canRec?"<th>المستلم</th><th>المتبقي</th><th></th>":""}</tr>${[...state.invoices].sort((a,b)=>b.date>a.date?1:-1).map(i=>{const l=invLeft(i),pc=i.total?Math.round((i.total-l)/i.total*100):0;
  return`<tr><td>${i.date}</td><td>${esc(i.customer)}${i.kind==="credit"?" (إشعار دائن)":""}</td><td>${esc(P(i.projectId))}</td><td>${n(i.total)}</td><td>${i.hasFile?`<button data-f="${i.id}">📎</button> `:""}${can("edit")?`<button data-in="${i.id}">تعديل</button>`:""}</td>${canRec?`<td><div class="bar"><i style="width:${pc}%"></i></div></td><td>${n(l)}</td><td>${l>0&&i.kind!=="credit"?`<button data-r="${i.id}">استلام</button>`:""}</td>`:""}</tr>`}).join("")||"<tr><td>لا توجد فواتير.</td></tr>"}</table></div>`;
  el.querySelector("#xi").onclick=()=>csv("invoices",[["التاريخ","العميل","المشروع","الإجمالي","الضريبة","النوع","الرقم"],...state.invoices.map(i=>[i.date,i.customer,P(i.projectId),i.total,i.vat||0,i.kind,i.number||""])]);el.querySelectorAll("[data-in]").forEach(b=>b.onclick=()=>invoice(state.invoices.find(x=>x.id===b.dataset.in)));
  el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{const i=state.invoices.find(x=>x.id===b.dataset.r);receipt(i,invLeft(i))});}
export function listProjects(el){el.innerHTML=`<div class="box"><table><tr><th>المشروع</th><th>العميل</th><th>الميزانية</th><th></th></tr>${state.projects.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.customer||"")}</td><td>${n(p.budget||0)}</td><td>${can("edit")?`<button data-p="${p.id}">تعديل</button>`:""}</td></tr>`).join("")||"<tr><td>أضف أول مشروع بزر +</td></tr>"}</table></div>`;
  el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>project(state.projects.find(x=>x.id===b.dataset.p)));
  if(location.hash==="#demo"&&can("edit")){const x=document.createElement("div");x.className="box";x.innerHTML='<b>بيانات تجريبية</b><div class="row" style="margin-top:8px"><button id="dgo">إضافة بيانات تجريبية</button><button id="drm" style="background:#b5483a">حذف التجريبية فقط</button><button id="dall" style="background:#7a1f14">تصفير كل البيانات</button></div>';el.append(x);
    const go=(k,m)=>async()=>{if(!confirm(m))return;try{alert(await (await import("./demo.js"))[k]())}catch(e){alert("خطأ: "+e.message)}};
    x.querySelector("#dgo").onclick=go("load","إضافة بيانات تجريبية؟");x.querySelector("#drm").onclick=go("wipe","حذف كل البيانات التجريبية؟");x.querySelector("#dall").onclick=async()=>{if(prompt("سيُحذف كل شيء نهائياً (مشاريع، حسابات، مصاريف، فواتير) حتى غير التجريبي. للتأكيد اكتب كلمة: حذف")!=="حذف")return;try{alert(await (await import("./demo.js")).resetAll())}catch(e){alert("خطأ: "+e.message)}};}}
