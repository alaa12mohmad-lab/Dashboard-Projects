import {state,add,upd,del,can,bal,getFile} from "./store.js";import {CATS,SOURCES} from "./firebase.js";
const $=s=>document.querySelector(s),today=()=>new Date().toISOString().slice(0,10);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const projOpts=(s=localStorage.lastProj)=>state.projects.map(p=>`<option value="${p.id}" ${p.id===s?"selected":""}>${esc(p.name)}</option>`).join("");
export const catList=()=>[...new Set([...CATS,...state.categories.map(c=>c.name)])];
const shrink=f=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const k=Math.min(1,1100/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",.6))};i.onerror=no;i.src=URL.createObjectURL(f)});
const att=async(file,id)=>{if(file&&file.size)try{await add("attachments",{refId:id,data:await shrink(file)})}catch(x){alert("تعذر حفظ الصورة: "+x.message)}};
export async function showFile(id){open("<p>جارٍ التحميل...</p>");const d=await getFile(id);$("#sheet").innerHTML=d?`<img src="${d}" style="width:100%;border-radius:6px"><p><a href="${d}" download="invoice.jpg">تنزيل الصورة</a></p>`:"<p>لا توجد صورة محفوظة.</p>"}
async function delRec(k){const [c,id]=k.split(":"),n=c==="projects"?state.expenses.filter(x=>x.projectId===id).length+state.invoices.filter(x=>x.projectId===id).length:0;
  if(n)return alert(`لا يمكن حذف المشروع: عليه ${n} حركة (مصاريف/فواتير). احذفها أو انقلها لمشروع آخر أولاً.`);
  if(!confirm("حذف نهائي؟ لا يمكن التراجع، وسيُسجَّل الحذف في سجل التعديلات."))return;
  try{await del(c,id);close()}catch(x){alert("تعذر الحذف: "+x.message)}}
export function close(){$("#modal").hidden=true}
function open(html,onSave){$("#sheet").innerHTML=html;$("#modal").hidden=false;$("#sheet").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>delRec(b.dataset.del));
  $("#sheet").querySelectorAll(".seg").forEach(g=>g.onclick=e=>{if(e.target.dataset.v){g.querySelectorAll("button").forEach(b=>b.classList.remove("on"));e.target.classList.add("on");g.dataset.v=e.target.dataset.v}});
  $("#sf")&&($("#sf").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    document.querySelectorAll("#sheet .seg").forEach(g=>f[g.dataset.n]=g.dataset.v);if(await onSave(f)!==false)close()});}
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
<label>صورة الفاتورة (اختياري)</label><input name="file" type="file" accept="image/*">
<details ${e?"open":""}><summary>المزيد</summary><label>التاريخ</label><input name="date" type="date" value="${v(e,"date",today())}"><label>الضريبة (VAT) من المبلغ</label><input name="vat" type="number" step="0.01" value="${v(e,"vat",0)}"><label>المورد</label><input name="vendor" value="${v(e,"vendor")}"><label>ملاحظة</label><input name="note" value="${v(e,"note")}"></details>
<button style="width:100%">${e?"حفظ التعديل":"حفظ المصروف"}</button>${e?`<button type="button" data-del="expenses:${e.id}" style="width:100%;margin-top:8px;background:#b5483a">حذف المصروف</button>`:""}</form>`,async f=>{
    const file=f.file;delete f.file;f.category=f.category.trim();localStorage.lastProj=f.projectId;localStorage.lastAcc=f.accountId;
    const d={...f,amount:+f.amount,vat:+f.vat||0,date:f.date||today(),source:state.accounts.find(a=>a.id===f.accountId)?.type||""};
    const ac=state.accounts.find(a=>a.id===f.accountId),bl=ac&&state.role!=="entry"?bal(ac,e?.id):Infinity;
    if(bl<d.amount&&!confirm(`المبلغ أكبر من رصيد "${ac.name}" (${Math.round(bl).toLocaleString("en-US")}). متابعة؟`))return false;
    if(state.expenses.some(x=>x.id!==e?.id&&x.amount===d.amount&&x.projectId===d.projectId&&x.date===d.date&&(x.vendor||"")===(d.vendor||""))&&!confirm("يوجد مصروف مطابق (نفس المبلغ والمشروع والتاريخ والمورد). هل هو مكرر؟ متابعة الحفظ؟"))return false;
    if(file&&file.size)d.hasFile=true;
    let id=e?.id;if(e)await upd("expenses",id,d);else id=(await add("expenses",d)).id;await att(file,id);
    if(!catList().includes(f.category))try{await add("categories",{name:f.category})}catch(x){console.warn(x)}});}
export function invoice(e){open(`<form id="sf"><h3>${e?"تعديل فاتورة":"فاتورة بيع"}</h3>
<label>العميل</label><input name="customer" required value="${v(e,"customer")}" ${e?"":"autofocus"}>
<label>المشروع</label><select name="projectId" required>${projOpts(e?.projectId)}</select>
<label>الإجمالي شامل الضريبة</label><input name="total" type="number" step="0.01" min="0.01" required value="${v(e,"total")}">
<label>صورة الفاتورة (اختياري)</label><input name="file" type="file" accept="image/*">
<label>النوع</label>${seg("kind",[["invoice","فاتورة"],["credit","إشعار دائن"]],e?.kind||"invoice")}
<details ${e?"open":""}><summary>المزيد</summary><label>التاريخ</label><input name="date" type="date" value="${v(e,"date",today())}"><label>الضريبة (VAT)</label><input name="vat" type="number" step="0.01" value="${v(e,"vat",0)}"><label>رقم الفاتورة</label><input name="number" value="${v(e,"number")}"></details>
<button style="width:100%">${e?"حفظ التعديل":"حفظ"}</button>${e?`<button type="button" data-del="invoices:${e.id}" style="width:100%;margin-top:8px;background:#b5483a">حذف الفاتورة</button>`:""}</form>`,async f=>{localStorage.lastProj=f.projectId;
    const file=f.file;delete f.file;const d={...f,total:+f.total,vat:+f.vat||0,date:f.date||today()};if(file&&file.size)d.hasFile=true;let id=e?.id;if(e)await upd("invoices",id,d);else id=(await add("invoices",d)).id;await att(file,id)});}
export function account(first){open(`<form id="sf"><h3>${first?"أضف أول حساب لتسجيل المصاريف":"حساب جديد"}</h3><label>الاسم</label><input name="name" required autofocus placeholder="مثال: بنك الراجحي 1 / عهدة أحمد"><label>النوع</label>${seg("type",[["bank","بنك"],["cash","صندوق"],["custody","عهدة"]],"bank")}<label>الرصيد الافتتاحي</label><input name="opening" type="number" step="0.01" value="0"><button style="width:100%">حفظ الحساب</button></form>`,f=>add("accounts",{...f,opening:+f.opening||0}));}
export function deposit(a){open(`<form id="sf"><h3>إيداع في ${esc(a.name)}</h3><label>المبلغ</label><input name="amount" type="number" step="0.01" min="0.01" required autofocus><label>التاريخ</label><input name="date" type="date" value="${today()}"><label>البيان</label><input name="note"><button style="width:100%">حفظ الإيداع</button></form>`,f=>add("funds",{...f,amount:+f.amount,accountId:a.id}));}
export function receipt(inv,left){open(`<form id="sf"><h3>تسجيل استلام</h3><p>${esc(inv.customer)} — المتبقي ${left.toLocaleString()}</p>
<label>المبلغ المستلم</label><input name="amount" type="number" step="0.01" min="0.01" max="${left}" required autofocus>
<label>التاريخ</label><input name="date" type="date" value="${today()}"><label>ملاحظة</label><input name="note">
<button style="width:100%">حفظ الاستلام</button></form>`,f=>add("receipts",{...f,amount:+f.amount,invoiceId:inv.id}));}
export function project(e){open(`<form id="sf"><h3>${e?"تعديل مشروع":"مشروع جديد"}</h3><label>اسم المشروع</label><input name="name" required value="${v(e,"name")}"><label>العميل</label><input name="customer" value="${v(e,"customer")}"><label>الميزانية (صافي بعد الضريبة)</label><input name="budget" type="number" step="0.01" min="0" value="${v(e,"budget",0)}"><button style="width:100%">حفظ</button>${e?`<button type="button" data-del="projects:${e.id}" style="width:100%;margin-top:8px;background:#b5483a">حذف المشروع</button>`:""}</form>`,f=>{const d={...f,budget:+f.budget||0};return e?upd("projects",e.id,d):add("projects",d)});}
export function transfer(a){const o=state.accounts.filter(x=>x.id!==a.id);if(!o.length)return open("<p>أضف حساباً آخر أولاً.</p>");
  open(`<form id="sf"><h3>تحويل من ${esc(a.name)}</h3><label>إلى حساب</label><select name="to">${o.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select><label>المبلغ</label><input name="amount" type="number" step="0.01" min="0.01" required><label>التاريخ</label><input name="date" type="date" value="${today()}"><button style="width:100%">تحويل</button></form>`,async f=>{const m=+f.amount,t=state.accounts.find(x=>x.id===f.to);
    await add("funds",{accountId:a.id,amount:-m,date:f.date,note:"تحويل إلى "+t.name});await add("funds",{accountId:t.id,amount:m,date:f.date,note:"تحويل من "+a.name})});}
