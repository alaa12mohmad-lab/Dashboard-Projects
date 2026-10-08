import {state,add,upd,can} from "./store.js";import {CATS,SOURCES} from "./firebase.js";
const $=s=>document.querySelector(s),today=()=>new Date().toISOString().slice(0,10);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const projOpts=(s=localStorage.lastProj)=>state.projects.map(p=>`<option value="${p.id}" ${p.id===s?"selected":""}>${esc(p.name)}</option>`).join("");
export const catList=()=>[...new Set([...CATS,...state.categories.map(c=>c.name)])];
export function close(){$("#modal").hidden=true}
function open(html,onSave){$("#sheet").innerHTML=html;$("#modal").hidden=false;
  $("#sheet").querySelectorAll(".seg").forEach(g=>g.onclick=e=>{if(e.target.dataset.v){g.querySelectorAll("button").forEach(b=>b.classList.remove("on"));e.target.classList.add("on");g.dataset.v=e.target.dataset.v}});
  $("#sf")&&($("#sf").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    document.querySelectorAll("#sheet .seg").forEach(g=>f[g.dataset.n]=g.dataset.v);await onSave(f);close()});}
const seg=(n,opts,def)=>`<div class="seg" data-n="${n}" data-v="${def}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" class="${v===def?"on":""}">${t}</button>`).join("")}</div>`;
export function menu(){
  const items=[];if(can("expense"))items.push(["مصروف",expense]);if(can("invoice"))items.push(["فاتورة بيع",invoice]);if(can("project"))items.push(["مشروع",project]);if(can("account"))items.push(["حساب / عهدة",account]);
  open(items.map((_,i)=>`<button class="m" data-i="${i}" style="width:100%;margin-bottom:8px;padding:14px">${items[i][0]}</button>`).join(""));
  $("#sheet").onclick=e=>{const i=e.target.dataset.i;if(i!==undefined)items[i][1]()};}
const TY={bank:"بنوك",cash:"صناديق",custody:"عهد"};
const accOpts=s=>Object.entries(TY).map(([t,l])=>{const a=state.accounts.filter(x=>x.type===t);return a.length?`<optgroup label="${l}">${a.map(x=>`<option value="${x.id}" ${x.id===(s||localStorage.lastAcc)?"selected":""}>${esc(x.name)}</option>`).join("")}</optgroup>`:""}).join("");
const v=(e,k,d="")=>esc(e?.[k]??d);
export function expense(e){
  if(!state.accounts.length&&!e)return can("account")?account(true):open("<p>لا توجد حسابات بعد. اطلب من المحاسب إضافة حساب (بنك / صندوق / عهدة).</p>");
  open(`<form id="sf"><h3>${e?"تعديل مصروف":"مصروف جديد"}</h3>
<label>المبلغ</label><input name="amount" type="number" step="0.01" min="0.01" required value="${v(e,"amount")}" ${e?"":"autofocus"}>
<label>المشروع</label><select name="projectId" required>${projOpts(e?.projectId)}</select>
<label>البند</label><input name="category" list="cats" placeholder="اختر أو اكتب بندًا جديدًا" required autocomplete="off" value="${v(e,"category")}"><datalist id="cats">${catList().map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
<label>الحساب / مصدر الدفع</label><select name="accountId" required>${accOpts(e?.accountId)}</select>
<details ${e?"open":""}><summary>المزيد</summary><label>التاريخ</label><input name="date" type="date" value="${v(e,"date",today())}"><label>الضريبة (VAT) من المبلغ</label><input name="vat" type="number" step="0.01" value="${v(e,"vat",0)}"><label>المورد</label><input name="vendor" value="${v(e,"vendor")}"><label>ملاحظة</label><input name="note" value="${v(e,"note")}"></details>
<button style="width:100%">${e?"حفظ التعديل":"حفظ المصروف"}</button></form>`,async f=>{
    f.category=f.category.trim();localStorage.lastProj=f.projectId;localStorage.lastAcc=f.accountId;
    const d={...f,amount:+f.amount,vat:+f.vat||0,date:f.date||today(),source:state.accounts.find(a=>a.id===f.accountId)?.type||""};
    await(e?upd("expenses",e.id,d):add("expenses",d));
    if(!catList().includes(f.category))try{await add("categories",{name:f.category})}catch(x){console.warn(x)}});}
export function invoice(e){open(`<form id="sf"><h3>${e?"تعديل فاتورة":"فاتورة بيع"}</h3>
<label>العميل</label><input name="customer" required value="${v(e,"customer")}" ${e?"":"autofocus"}>
<label>المشروع</label><select name="projectId" required>${projOpts(e?.projectId)}</select>
<label>الإجمالي شامل الضريبة</label><input name="total" type="number" step="0.01" min="0.01" required value="${v(e,"total")}">
<label>النوع</label>${seg("kind",[["invoice","فاتورة"],["credit","إشعار دائن"]],e?.kind||"invoice")}
<details ${e?"open":""}><summary>المزيد</summary><label>التاريخ</label><input name="date" type="date" value="${v(e,"date",today())}"><label>الضريبة (VAT)</label><input name="vat" type="number" step="0.01" value="${v(e,"vat",0)}"><label>رقم الفاتورة</label><input name="number" value="${v(e,"number")}"></details>
<button style="width:100%">${e?"حفظ التعديل":"حفظ"}</button></form>`,async f=>{localStorage.lastProj=f.projectId;
    const d={...f,total:+f.total,vat:+f.vat||0,date:f.date||today()};await(e?upd("invoices",e.id,d):add("invoices",d))});}
export function account(first){open(`<form id="sf"><h3>${first?"أضف أول حساب لتسجيل المصاريف":"حساب جديد"}</h3><label>الاسم</label><input name="name" required autofocus placeholder="مثال: بنك الراجحي 1 / عهدة أحمد"><label>النوع</label>${seg("type",[["bank","بنك"],["cash","صندوق"],["custody","عهدة"]],"bank")}<label>الرصيد الافتتاحي</label><input name="opening" type="number" step="0.01" value="0"><button style="width:100%">حفظ الحساب</button></form>`,f=>add("accounts",{...f,opening:+f.opening||0}));}
export function deposit(a){open(`<form id="sf"><h3>إيداع في ${esc(a.name)}</h3><label>المبلغ</label><input name="amount" type="number" step="0.01" min="0.01" required autofocus><label>التاريخ</label><input name="date" type="date" value="${today()}"><label>البيان</label><input name="note"><button style="width:100%">حفظ الإيداع</button></form>`,f=>add("funds",{...f,amount:+f.amount,accountId:a.id}));}
export function receipt(inv,left){open(`<form id="sf"><h3>تسجيل استلام</h3><p>${esc(inv.customer)} — المتبقي ${left.toLocaleString()}</p>
<label>المبلغ المستلم</label><input name="amount" type="number" step="0.01" min="0.01" max="${left}" required autofocus>
<label>التاريخ</label><input name="date" type="date" value="${today()}"><label>ملاحظة</label><input name="note">
<button style="width:100%">حفظ الاستلام</button></form>`,f=>add("receipts",{...f,amount:+f.amount,invoiceId:inv.id}));}
function project(){open(`<form id="sf"><h3>مشروع جديد</h3><label>اسم المشروع</label><input name="name" required autofocus>
<label>العميل</label><input name="customer"><button style="width:100%">حفظ</button></form>`,f=>add("projects",f));}
