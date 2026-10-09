import {db,auth,COMPANY} from "./firebase.js";
import {collection,onSnapshot,addDoc,updateDoc,getDocs,query,where,serverTimestamp,doc,getDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export const state={projects:[],expenses:[],categories:[],accounts:[],funds:[],audit:[],invoices:[],receipts:[],role:null};
const subs=[];export const onChange=f=>subs.push(f);
export async function start(uid){
  const u=await getDoc(doc(db,"users",uid));state.role=u.exists()?u.data().role:null;
  if(!state.role)return false;
  const cols=["projects","expenses","categories","accounts"];if(state.role!=="entry")cols.push("invoices","receipts","funds","audit");
  cols.forEach(c=>onSnapshot(query(collection(db,c),where("companyId","==",COMPANY)),s=>{
    state[c]=s.docs.map(d=>({id:d.id,...d.data()}));subs.forEach(f=>f());}));
  return true;}
export const add=(c,d)=>addDoc(collection(db,c),{...d,companyId:COMPANY,by:auth.currentUser.uid,createdAt:serverTimestamp()});
export const upd=async(c,id,d)=>{const o=state[c]?.find(x=>x.id===id)||{},ch={};
  for(const k in d)if(String(o[k]??"")!==String(d[k]??""))ch[k]=[o[k]??null,d[k]??null];
  await updateDoc(doc(db,c,id),{...d,updatedBy:auth.currentUser.uid,updatedAt:serverTimestamp()});
  if(Object.keys(ch).length)try{await add("audit",{coll:c,docId:id,changes:ch,byEmail:auth.currentUser.email})}catch(e){console.warn(e)}};
export const bal=(a,skip)=>(a.opening||0)+state.funds.filter(f=>f.accountId===a.id).reduce((s,f)=>s+f.amount,0)-state.expenses.filter(x=>x.accountId===a.id&&x.id!==skip).reduce((s,x)=>s+x.amount,0);
export const getFile=async id=>{const s=await getDocs(query(collection(db,"attachments"),where("refId","==",id)));return s.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))[0]?.data||null};
export function csv(name,rows){const t=rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(",")).join("\r\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+t],{type:"text/csv"}));a.download=name+".csv";a.click()}
export const can=a=>({expense:state.role!=="manager",invoice:["admin","accountant","entry"].includes(state.role),
  receipt:["admin","accountant","manager"].includes(state.role),project:["admin","accountant"].includes(state.role),account:["admin","accountant"].includes(state.role),edit:["admin","accountant"].includes(state.role)})[a];
