import {auth} from "./firebase.js";import {signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {start,onChange,state,can} from "./store.js";import {menu,close} from "./forms.js";import * as D from "./dashboard.js";
const $=s=>document.querySelector(s);let tab="dash",started=false;
const TABS=[["dash","لوحة التحكم"],["exp","المصاريف"],["inv","الفواتير"],["prj","المشاريع"]];
function draw(){const v=$("#view"),mgr=state.role!=="entry";
  $("#nav").innerHTML=TABS.filter(t=>t[0]!=="inv"||mgr).map(([k,t])=>`<a data-k="${k}" class="${k===tab?"on":""}">${t}</a>`).join("");
  $("#nav").onclick=e=>{if(e.target.dataset.k){tab=e.target.dataset.k;draw()}};
  ({dash:()=>D.render(v),exp:()=>D.listExpenses(v),inv:()=>D.listInvoices(v,can("receipt")),prj:()=>D.listProjects(v)})[tab]();
  $("#fab").hidden=!(can("expense")||can("invoice")||can("project"));}
$("#fab").onclick=menu;$("#modal").onclick=e=>{if(e.target.id==="modal")close()};$("#out").onclick=()=>signOut(auth);
$("#lf").onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("#em").value,$("#pw").value)}catch{$("#err").textContent="البريد أو كلمة المرور غير صحيحة."}};
onAuthStateChanged(auth,async u=>{$("#login").hidden=!!u;$("#app").hidden=!u;if(!u)return;
  if(!started){started=true;onChange(draw);
    if(!await start(u.uid)){$("#view").textContent="حسابك غير مفعّل. اطلب من المسؤول إضافة صلاحيتك.";return}}draw();});
