import {db,auth,COMPANY} from "./firebase.js";
import {collection,onSnapshot,addDoc,query,where,serverTimestamp,doc,getDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export const state={projects:[],expenses:[],categories:[],invoices:[],receipts:[],role:null};
const subs=[];export const onChange=f=>subs.push(f);
export async function start(uid){
  const u=await getDoc(doc(db,"users",uid));state.role=u.exists()?u.data().role:null;
  if(!state.role)return false;
  const cols=["projects","expenses","categories"];if(state.role!=="entry")cols.push("invoices","receipts");
  cols.forEach(c=>onSnapshot(query(collection(db,c),where("companyId","==",COMPANY)),s=>{
    state[c]=s.docs.map(d=>({id:d.id,...d.data()}));subs.forEach(f=>f());}));
  return true;}
export const add=(c,d)=>addDoc(collection(db,c),{...d,companyId:COMPANY,by:auth.currentUser.uid,createdAt:serverTimestamp()});
export const can=a=>({expense:state.role!=="manager",invoice:["admin","accountant","entry"].includes(state.role),
  receipt:["admin","accountant","manager"].includes(state.role),project:["admin","accountant"].includes(state.role)})[a];
