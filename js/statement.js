import {state,can,bal,csv} from "./store.js";import {esc,expense,deposit,transfer} from "./forms.js";
const n=x=>(Math.round(x*100)/100).toLocaleString("en-US"),sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const TY={bank:"بنك",cash:"صندوق",custody:"عهدة"};
export function statement(el,sel,pick){
  const accs=state.accounts,a=accs.find(x=>x.id===sel),none=sel==="none",old=state.expenses.some(x=>!x.accountId);
  const ex=a?state.expenses.filter(x=>x.accountId===a.id):none?state.expenses.filter(x=>!x.accountId):[],fd=a?state.funds.filter(f=>f.accountId===a.id):[];
  const P=id=>state.projects.find(p=>p.id===id)?.name;
  const rows=[...ex.map(x=>({d:x.date||"",t:"مصروف",desc:[P(x.projectId),x.category,x.vendor,x.note].filter(Boolean).join(" — "),out:x.amount,e:x})),...fd.map(f=>({d:f.date||"",t:f.amount<0?"تحويل صادر":(f.note||"").startsWith("تحويل")?"تحويل وارد":"إيداع",desc:f.note||"",inn:f.amount>0?f.amount:0,out:f.amount<0?-f.amount:0}))].sort((p,q)=>p.d>q.d?1:-1);
  let b=a?.opening||0;
  const body=rows.map(r=>{b+=(r.inn||0)-(r.out||0);return`<tr><td>${r.d}</td><td>${r.t}</td><td>${esc(r.desc)}</td><td>${r.inn?n(r.inn):""}</td><td>${r.out?n(r.out):""}</td>${a?`<td><b>${n(b)}</b></td>`:""}<td>${r.e?.hasFile?`<button data-f="${r.e.id}">📎</button> `:""}${r.e&&can("edit")?`<button data-e="${r.e.id}">تعديل</button>`:""}</td></tr>`}).join("");
  el.innerHTML=`<div class="row" style="margin-bottom:12px"><select id="as"><option value="">اختر الحساب</option>${accs.map(x=>`<option value="${x.id}" ${x.id===sel?"selected":""}>${TY[x.type]} — ${esc(x.name)} (${n(bal(x))})</option>`).join("")}${old?`<option value="none" ${none?"selected":""}>مصاريف بدون حساب (قديمة)</option>`:""}</select>${a&&can("account")?`<button id="dp">+ إيداع</button><button id="tr" class="alt">تحويل</button>`:""}${a||none?`<button id="xs" class="alt">تصدير</button>`:""}</div>
${a||none?`<div class="cards">${a?`<div class="c"><small>الرصيد الافتتاحي</small><b>${n(a.opening||0)}</b></div><div class="c"><small>إيداعات وتحويلات (صافي)</small><b>${n(sum(fd,f=>f.amount))}</b></div>`:""}<div class="c"><small>المصروفات</small><b>${n(sum(ex,x=>x.amount))}</b></div>${a?`<div class="c"><small>الرصيد الحالي</small><b class="${bal(a)>=0?"pos":"neg"}">${n(bal(a))}</b></div>`:""}</div>
<div class="box"><table><tr><th>التاريخ</th><th>النوع</th><th>البيان</th><th>داخل</th><th>خارج</th>${a?"<th>الرصيد</th>":""}<th></th></tr>${body||"<tr><td colspan=7>لا توجد حركات.</td></tr>"}</table></div>`:`<div class="box">${accs.length?"اختر حساباً لعرض كشفه.":"لا توجد حسابات. أضف حساباً من زر +."}</div>`}`;
  el.querySelector("#as").onchange=e=>pick(e.target.value);
  const tr=el.querySelector("#tr");if(tr)tr.onclick=()=>transfer(a);const xs=el.querySelector("#xs");if(xs)xs.onclick=()=>csv("statement",[["التاريخ","النوع","البيان","داخل","خارج"],...rows.map(r=>[r.d,r.t,r.desc,r.inn||"",r.out||""])]);const dp=el.querySelector("#dp");if(dp)dp.onclick=()=>deposit(a);
  el.querySelectorAll("[data-e]").forEach(x=>x.onclick=()=>expense(state.expenses.find(y=>y.id===x.dataset.e)));
}
