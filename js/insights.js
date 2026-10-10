import {state,bal} from "./store.js";
export const DEF={th:{budget:80,spike:50,outlier:3,vendor:40,nofile:5000,overdue:30,other:25},guide:{
budget:"1) راجع حركات البند وتأكد من صحة تسجيلها وتصنيفها.\n2) قدّر المتبقي من الأعمال المرتبطة بالبند.\n3) إن كان التجاوز مبرراً فاطلب تعديل التقدير أو أمر تغيير من العميل.",
forecast:"المشروع يسير نحو تجاوز ميزانيته.\n1) قدّر تكلفة الأعمال المتبقية بدقة.\n2) حدد البنود المسببة للتجاوز.\n3) ناقش مع الإدارة: تعديل الميزانية أو التسعير أو خطة الإنتاج.",
margin:"الهامش ضعيف.\n1) راجع التكاليف المحمّلة على المشروع.\n2) راجع أعمالاً إضافية لم تُفوتر.\n3) أوقف الأعمال خارج النطاق حتى الاعتماد.",
spike:"البند ارتفع فجأة عن معدله.\n1) قارن الأسعار والكميات بالأشهر السابقة.\n2) راجع فواتير الموردين.\n3) تحقق من عدم تكرار القيد.",
outlier:"مصروف أكبر كثيراً من المعتاد في بنده.\n1) تأكد من وجود الفاتورة والاعتماد.\n2) قارنه بعروض الأسعار.\n3) اسأل مدخله عن السبب.",
vendor:"اعتماد مرتفع على مورد واحد.\n1) اطلب عروضاً بديلة.\n2) تفاوض على السعر وشروط الدفع.",
nofile:"مصاريف كبيرة بلا صورة فاتورة.\nاطلب المستند من مدخلها قبل إقفال الشهر.",
overdue:"فواتير متأخرة السداد.\n1) تواصل مع العميل وحدد موعداً.\n2) أوقف الأعمال الإضافية عند الحاجة.",
other:"نسبة بند «أخرى» مرتفعة.\nصنّف المصاريف في بنود واضحة لتصير التقارير أدق.",
account:"رصيد الحساب سالب.\nغذِّ الحساب أو سوِّ العهدة قبل أي صرف جديد."}};
export const DEFCAT={
"مواد":"1) قارن الكميات المستلمة بما تتطلبه الرسومات (هدر القص، الطلب الزائد).\n2) قارن سعر الوحدة بعروض الموردين.\n3) راجع المرتجعات وما بقي في المخزن.\n4) أوقف أي طلب شراء جديد قبل مراجعة الكميات.",
"عمالة":"1) راجع ساعات العمل الإضافي وأعداد العمال مقابل الإنتاج.\n2) قارن مقاولي الباطن بالتسعيرة المتفق عليها.\n3) تأكد أن الإنتاج يوازي نسبة الإنجاز.\n4) أعد توزيع العمالة أو أوقف الإضافي غير الضروري.",
"رواتب":"1) راجع كشف الرواتب: هل المحمّل على المشروع يخص من يعملون فيه فعلاً؟\n2) راجع البدلات والعمل الإضافي والمكافآت.\n3) تأكد من عدم تحميل رواتب من انتهت مهامهم على المشروع.\n4) راجع طريقة توزيع تكلفة الإدارة والمشرفين على المشاريع.",
"معدات":"1) راجع أيام الإيجار الفعلية وتأكد من إعادة المعدة عند انتهاء الحاجة.\n2) قارن الإيجار بتكلفة التملك أو بمورد آخر.\n3) راجع الوقود والصيانة المحمّلة على المعدة.\n4) تأكد من عدم تكرار فواتير الإيجار.",
"نقل":"1) راجع عدد الرحلات والحمولة مقابل المخطط.\n2) ادمج الشحنات وتجنب الرحلات الفارغة.\n3) قارن أسعار شركات النقل.\n4) تأكد من وجود أوامر نقل معتمدة.",
"إيجار":"1) راجع عقد الإيجار وتاريخ انتهائه.\n2) تأكد من عدم تحميل مدة انتهت الحاجة إليها.\n3) تفاوض على السعر أو ابحث عن بديل أرخص.",
"صيانة":"1) راجع أسباب الأعطال المتكررة.\n2) قارن تكلفة الإصلاح بتكلفة الاستبدال.\n3) تأكد من جدولة الصيانة الوقائية.",
"ضيافة":"1) راجع حجم الضيافة مقابل أعداد الفرق والزيارات.\n2) ضع سقفاً شهرياً وأسند الصرف لمسؤول واحد.",
"أخرى":"1) صنّف الحركات في بنود واضحة.\n2) راجع محتوى البند فقد يخفي مصروفاً يخص بنداً آخر."};
export const guideFor=(a,g)=>(a.cat&&(g["cat:"+a.cat]||DEFCAT[a.cat]))||g[a.g]||"";
export const cfg=()=>{const d=state.settings.find(x=>x.id==="cfg");return{th:{...DEF.th,...d?.th},guide:{...DEF.guide,...d?.guide}}};
const n=x=>Math.round(x).toLocaleString("en-US"),net=x=>(x.total??x.amount)-(x.vat||0),sg=i=>i.kind==="credit"?-1:1,lt=(v,x)=>v!=null&&v<x,sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
export function analyze(){const c=cfg(),M=[],A=[],td=new Date().toISOString().slice(0,10),cut=new Date(Date.now()-60*864e5).toISOString().slice(0,10);
  const hid=new Set(state.alerts.filter(a=>a.status==="done"||(a.until&&a.until>td)).map(a=>a.key));
  const add=(sev,t,why,g,p,k,cat)=>{k=`${g}|${p?.id||""}|${k||""}|${sev}`;if(!hid.has(k))A.push({sev,t,why,g,pid:p?.id,pn:p?.name,k,cat})};
  state.projects.forEach(p=>{
    const ex=state.expenses.filter(x=>x.projectId===p.id),inv=state.invoices.filter(x=>x.projectId===p.id),bc=p.budgets||{},bt=sum(Object.values(bc),x=>+x||0)||p.budget||0;
    const spent=sum(ex,net),rev=sum(inv,i=>sg(i)*net(i)),pr=+p.progress||0,cv=+p.contractValue||0,eac=pr>0?spent/(pr/100):null,cpi=pr>0&&spent>0&&bt?bt*pr/100/spent:null;
    const m={p,spent,rev,bt,pr,cv,eac,cpi,use:bt?spent/bt*100:null,margin:rev?(rev-spent)/rev*100:null,fm:cv&&eac?(cv-eac)/cv*100:null};m.mg=m.fm??(cv?null:m.margin);
    m.st=!spent&&!bt&&!rev?"n":(m.use>100||(cpi&&cpi<.85)||lt(m.mg,0))?"r":(m.use>c.th.budget||(cpi&&cpi<.95)||lt(m.mg,10))?"a":"g";M.push(m);
    const cat=k=>ex.filter(x=>x.category===k),cats=[...new Set(ex.map(x=>x.category))];
    Object.entries(bc).forEach(([k,b])=>{const s=sum(cat(k),net),u=s/b*100;if(u>=c.th.budget)add(u>100?"h":"m",`بند «${k}» ${u>100?"تجاوز":"اقترب من"} التقدير`,`صُرف ${n(s)} من تقدير ${n(b)} (${Math.round(u)}%).`,"budget",p,k,k)});
    if(!Object.keys(bc).length&&bt&&m.use>=c.th.budget)add(m.use>100?"h":"m","ميزانية المشروع الإجمالية",`صُرف ${n(spent)} من ${n(bt)} (${Math.round(m.use)}%).`,"budget",p,"all");
    if(eac&&bt&&eac>bt*1.05)add(eac>bt*1.15?"h":"m","توقع تجاوز المشروع لميزانيته",`الإنجاز ${Math.round(pr)}% بينما استُهلك ${Math.round(m.use)}% من الميزانية. التكلفة المتوقعة عند الإتمام ${n(eac)} مقابل ${n(bt)} (تجاوز متوقع ${n(eac-bt)}).`,"forecast",p);
    if(m.mg!=null&&m.mg<10)add(m.mg<0?"h":"m","هامش الربح "+(m.mg<0?"سالب":"ضعيف"),`الهامش ${m.fm!=null?"المتوقع":"الحالي"} ${Math.round(m.mg)}%.`,"margin",p);
    const ms=[...new Set(ex.map(x=>x.date?.slice(0,7)))].filter(Boolean).sort();
    if(ms.length>=3){const cur=ms[ms.length-1],prev=ms.slice(-4,-1);cats.forEach(k=>{const sm=mm=>sum(cat(k).filter(x=>x.date?.startsWith(mm)),net),cu=sm(cur),av=sum(prev,sm)/prev.length;if(av>0&&cu>av*(1+c.th.spike/100)&&cu-av>2000)add("m",`قفزة في بند «${k}»`,`${cur}: ${n(cu)} مقابل متوسط ${n(av)} للأشهر السابقة.`,"spike",p,k+cur,k)})}
    cats.forEach(k=>{const v=cat(k).map(net).sort((a,b)=>a-b);if(v.length<4)return;const md=v[v.length>>1];cat(k).filter(x=>net(x)>md*c.th.outlier&&net(x)>2000&&(x.date||"")>=cut).forEach(x=>add("m",`مصروف شاذ في «${k}»`,`${n(net(x))} بتاريخ ${x.date}${x.vendor?" ("+x.vendor+")":""}، والمعتاد في البند ${n(md)}.`,"outlier",p,x.id,k))});
    if(ex.length>=5){const vs={};ex.filter(x=>x.vendor).forEach(x=>vs[x.vendor]=(vs[x.vendor]||0)+net(x));const [vn,va]=Object.entries(vs).sort((a,b)=>b[1]-a[1])[0]||[];if(vn&&va/spent*100>c.th.vendor)add("l",`تركّز المورد «${vn}»`,`يمثل ${Math.round(va/spent*100)}% من إنفاق المشروع.`,"vendor",p,vn)}
    const nf=ex.filter(x=>!x.hasFile&&net(x)>c.th.nofile);if(nf.length)add("l","مصاريف كبيرة بلا فاتورة",`${nf.length} مصروف أكبر من ${n(c.th.nofile)} بلا صورة، إجماليها ${n(sum(nf,net))}.`,"nofile",p);
    const ot=sum(cat("أخرى"),net);if(spent&&ot/spent*100>c.th.other)add("l","بند «أخرى» مرتفع",`${Math.round(ot/spent*100)}% من المصاريف غير مصنّفة.`,"other",p)});
  if(state.role!=="entry"){const byC={};state.invoices.filter(i=>i.kind!=="credit").forEach(i=>{const l=i.total-sum(state.receipts.filter(r=>r.invoiceId===i.id),r=>r.amount),age=(Date.now()-new Date(i.date))/864e5;if(l>1&&age>c.th.overdue){const o=byC[i.customer]??={l:0,age:0};o.l+=l;o.age=Math.max(o.age,age)}});
    Object.entries(byC).forEach(([cu,o])=>add(o.age>60?"h":"m","فواتير متأخرة: "+cu,`المتبقي ${n(o.l)}، وأقدمها منذ ${Math.round(o.age)} يوماً.`,"overdue",null,cu));
    state.accounts.forEach(a=>{const b=bal(a);if(b<0)add("h","رصيد سالب: "+a.name,`الرصيد ${n(b)}.`,"account",null,a.id)})}
  M.forEach(m=>{const al=A.filter(a=>a.pid===m.p.id);if(al.some(a=>a.sev==="h"))m.st="r";else if(m.st==="g"&&al.some(a=>a.sev==="m"))m.st="a"});
  const o={h:0,m:1,l:2};A.sort((a,b)=>o[a.sev]-o[b.sev]);return{M,A}}
