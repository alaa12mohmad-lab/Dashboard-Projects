import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ضع بيانات مشروعك من Firebase Console > Project settings
const cfg={apiKey:"YOUR_API_KEY",authDomain:"YOUR_PROJECT.firebaseapp.com",projectId:"YOUR_PROJECT",appId:"YOUR_APP_ID"};
const app=initializeApp(cfg);
export const auth=getAuth(app),db=getFirestore(app);
export const COMPANY="default"; // يتغير لاحقًا لدعم أكثر من شركة
export const CATS=["مواد","عمالة","معدات","نقل","إيجار","أخرى"];
export const SOURCES=[["bank","بنك"],["cash","صندوق"],["custody","عهدة"]];
