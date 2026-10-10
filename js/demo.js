import {auth,db,COMPANY} from "./firebase.js";
import {collection,doc,writeBatch,getDocs,query,where,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
let seed=7;const rnd=()=>(seed=seed*16807%2147483647)/2147483647,pick=a=>a[Math.floor(rnd()*a.length)],between=(a,b)=>Math.round((a+rnd()*(b-a))/10)*10;
const day=(m,d)=>`2026-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const rdate=()=>{const m=pick([8,9,10]);return day(m,1+Math.floor(rnd()*(m===10?8:28)))};
const vat=t=>Math.round(t*15/115*100)/100;
export async function load(){
  seed=7;const b=writeBatch(db),base={companyId:COMPANY,by:auth.currentUser.uid,demo:true,createdAt:serverTimestamp()};
  const mk=(c,d)=>{const r=doc(collection(db,c));b.set(r,{...base,...d});return r.id};
  const cust=["شركة الأفق للتجارة","مؤسسة النخبة","شركة البناء المتقدم"];
  const P=["مشروع هنجر الدمام","مشروع مستودعات جدة","مشروع مصنع الرياض"].map((name,i)=>{const f=[.6,.4,.8][i],bg=Object.fromEntries(Object.entries({"مواد":300000,"عمالة":150000,"معدات":90000,"إيجار":60000,"رواتب":120000,"نقل":25000,"صيانة":20000,"ضيافة":10000}).map(([k,x])=>[k,x*f]));return mk("projects",{name,customer:cust[i],contractValue:[1500000,1100000,2200000][i],progress:[45,70,30][i],budgets:bg,budget:Object.values(bg).reduce((a,x)=>a+x,0)})});
  const A=[["بنك الراجحي 1","bank",500000],["بنك الأهلي","bank",200000],["الصندوق الرئيسي","cash",50000],["عهدة أحمد","custody",0],["عهدة محمد","custody",0]].map(([name,type,opening])=>({id:mk("accounts",{name,type,opening}),type}));
  [[0,300000,8,5,"إيداع دفعة عميل"],[2,30000,8,20,"تغذية الصندوق"],[3,40000,8,10,"تغذية عهدة"],[3,20000,9,15,"تغذية عهدة"],[4,30000,9,1,"تغذية عهدة"]].forEach(([a,amount,m,d,note])=>mk("funds",{accountId:A[a].id,amount,date:day(m,d),note}));
  ["رواتب","ضيافة","صيانة"].forEach(name=>mk("categories",{name}));
  const big=["مواد","عمالة","معدات","إيجار","رواتب"],small=["نقل","ضيافة","صيانة","مواد"],vend=["مصنع الحديد الوطني","شركة النقل السريع","مؤسسة المعدات الثقيلة","مورد محلي","مقاول باطن"];let n=0;
  [[0,9,8000,45000],[1,6,5000,30000],[2,6,200,4000],[3,5,200,3000],[4,5,200,2500]].forEach(([a,cnt,lo,hi])=>{for(let i=0;i<cnt;i++){const category=pick(a<2?big:small),amount=between(lo,hi);
    mk("expenses",{amount,vat:["رواتب","عمالة","إيجار"].includes(category)?0:vat(amount),projectId:pick(P),category,accountId:A[a].id,source:A[a].type,date:rdate(),vendor:pick(vend)});n++}});
  const I=[[0,350000,8,12,"1001"],[0,280000,9,20,"1002"],[1,420000,8,25,"1003"],[1,180000,10,3,"1004"],[2,600000,9,5,"1005"],[2,250000,9,28,"1006"],[2,30000,10,5,"C-01","credit"]].map(([p,total,m,d,number,kind])=>({id:mk("invoices",{customer:cust[p],projectId:P[p],total,vat:vat(total),date:day(m,d),number,kind:kind||"invoice"})}));
  [[0,350000,8,30],[2,200000,9,10],[1,150000,10,2],[4,300000,9,25]].forEach(([i,amount,m,d])=>mk("receipts",{invoiceId:I[i].id,amount,date:day(m,d),note:"دفعة تجريبية"}));
  await b.commit();return(`تمت الإضافة: 3 مشاريع، 5 حسابات، ${n} مصروفاً، 7 فواتير (منها إشعار دائن)، 4 استلامات. افتح النظام وحدّث الصفحة.`);
}
async function purge(cols,demoOnly){let k=0,err=[];for(const c of cols){try{
  const q=demoOnly?query(collection(db,c),where("companyId","==",COMPANY),where("demo","==",true)):query(collection(db,c),where("companyId","==",COMPANY));
  const s=await getDocs(q);for(let i=0;i<s.docs.length;i+=400){const b=writeBatch(db);s.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}k+=s.size}catch(e){err.push(c+": "+e.message)}}
  return `تم حذف ${k} سجلاً.`+(err.length?"\nتعذر الحذف في:\n"+err.join("\n"):"")}
const ALL=["expenses","invoices","receipts","funds","accounts","categories","projects"];
export const wipe=()=>purge(ALL,true);
export const resetAll=()=>purge([...ALL,"attachments"],false);
