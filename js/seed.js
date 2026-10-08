import {auth} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {load,wipe} from "./demo.js";
const $=s=>document.querySelector(s),log=t=>{$("#log").textContent+=t+"\n"};
const run=(f,msg)=>async()=>{if(!confirm(msg))return;try{log(await f())}catch(e){log("خطأ: "+e.message)}};
$("#go").onclick=run(load,"إضافة بيانات تجريبية إلى قاعدة البيانات؟");$("#rm").onclick=run(wipe,"حذف كل البيانات التجريبية؟");
onAuthStateChanged(auth,u=>{$("#go").disabled=$("#rm").disabled=!u;$("#st").textContent=u?"مسجّل الدخول: "+u.email:"سجّل الدخول من الصفحة الرئيسية أولاً ثم أعد فتح هذه الصفحة."});
