import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ضع بيانات مشروعك من Firebase Console > Project settings
const cfg={
  apiKey: "AIzaSyAUErRMaG63lmdA9OOmKPHh92kyK42C7IA",
  authDomain: "dashboard-projects-1f79a.firebaseapp.com",
  projectId: "dashboard-projects-1f79a",
  storageBucket: "dashboard-projects-1f79a.firebasestorage.app",
  messagingSenderId: "731782758211",
  appId: "1:731782758211:web:ac66da8a1c5b3a629239f6"
};
const app=initializeApp(cfg);
export const auth=getAuth(app),db=getFirestore(app);
export const COMPANY="default"; // يتغير لاحقًا لدعم أكثر من شركة
export const CATS=["مواد","عمالة","معدات","نقل","إيجار","أخرى"];
export const SOURCES=[["bank","بنك"],["cash","صندوق"],["custody","عهدة"]];
