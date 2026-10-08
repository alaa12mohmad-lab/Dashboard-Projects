import {state,add,can} from "./store.js";import {CATS,SOURCES} from "./firebase.js";
const $=s=>document.querySelector(s),today=()=>new Date().toISOString().slice(0,10);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const projOpts=()=>state.projects.map(p=>`<option value="${p.id}" ${p.id===localStorage.lastProj?"selected":""}>${esc(p.name)}</option>`).join("");
export const catList=()=>[...new Set([...CATS,...state.categories.map(c=>c.name)])];
export function close(){$("#modal").hidden=true}
function open(html,onSave){$("#sheet").innerHTML=html;$("#modal").hidden=false;
  $("#sheet").querySelectorAll(".seg").forEach(g=>g.onclick=e=>{if(e.target.dataset.v){g.querySelectorAll("button").forEach(b=>b.classList.remove("on"));e.target.classList.add("on");g.dataset.v=e.target.dataset.v}});
  $("#sf")&&($("#sf").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    document.querySelectorAll("#sheet .seg").forEach(g=>f[g.dataset.n]=g.dataset.v);await onSave(f);close()});}
const seg=(n,opts,def)=>`<div class="seg" data-n="${n}" data-v="${def}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" class="${v===def?"on":""}">${t}</button>`).join("")}</div>`;
export function menu(){
  const items=[];if(can("expense"))items.push(["مصروف",expense]);if(can("invoice"))items.push(["فاتورة بيع",invoice]);if(can("project"))items.push(["مشروع",project]);
  open(items.map((_,i)=>`<button class="m" data-i="${i}" style="width:100%;margin-bottom:8px;padding:14px">${items[i][0]}</button>`).join(""));
  $("#sheet").onclick=e=>{const i=e.target.dataset.i;if(i!==undefined)items[i][1]()};}
export function expense(){open(`<form id="sf"><h3>مصروف جديد</h3>
<label>المبلغ</label><input name="amount" type="number" step="0.01" min="0.01" required autofocus>
<label>المشروع</label><select name="projectId" required>${projOpts()}</select>
<label>البند</label><input name="category" list="cats" placeholder="اختر أو اكتب بندًا جديدًا" required autocomplete="off"><datalist id="cats">${catList().map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
<label>مصدر الدفع</label>${seg("source",SOURCES,"bank")}
<details><summary>المزيد</summary><label>التاريخ</label><input name="date" type="date" value="${today()}"><label>الضريبة (VAT) من المبلغ</label><input name="vat" type="number" step="0.01" value="0"><label>المورد</label><input name="vendor"><label>ملاحظة</label><input name="note"></details>
<button style="width:100%">حفظ المصروف</button></form>`,async f=>{localStorage.lastProj=f.projectId;
    f.category=f.category.trim();await add("expenses",{...f,amount:+f.amount,vat:+f.vat||0,date:f.date||today()});if(!catList().includes(f.category))try{await add("categories",{name:f.category})}catch(e){console.warn(e)}});}
export function invoice(){open(`<form id="sf"><h3>فاتورة بيع</h3>
<label>العميل</label><input name="customer" required autofocus>
<label>المشروع</label><select name="projectId" required>${projOpts()}</select>
<label>الإجمالي شامل الضريبة</label><input name="total" type="number" step="0.01" min="0.01" required>
<label>النوع</label>${seg("kind",[["invoice","فاتورة"],["credit","إشعار دائن"]],"invoice")}
<details><summary>المزيد</summary><label>التاريخ</label><input name="date" type="date" value="${today()}"><label>الضريبة (VAT)</label><input name="vat" type="number" step="0.01" value="0"><label>رقم الفاتورة</label><input name="number"></details>
<button style="width:100%">حفظ</button></form>`,async f=>{localStorage.lastProj=f.projectId;
    await add("invoices",{...f,total:+f.total,vat:+f.vat||0,date:f.date||today()})});}
export function receipt(inv,left){open(`<form id="sf"><h3>تسجيل استلام</h3><p>${esc(inv.customer)} — المتبقي ${left.toLocaleString()}</p>
<label>المبلغ المستلم</label><input name="amount" type="number" step="0.01" min="0.01" max="${left}" required autofocus>
<label>التاريخ</label><input name="date" type="date" value="${today()}"><label>ملاحظة</label><input name="note">
<button style="width:100%">حفظ الاستلام</button></form>`,f=>add("receipts",{...f,amount:+f.amount,invoiceId:inv.id}));}
function project(){open(`<form id="sf"><h3>مشروع جديد</h3><label>اسم المشروع</label><input name="name" required autofocus>
<label>العميل</label><input name="customer"><button style="width:100%">حفظ</button></form>`,f=>add("projects",f));}
