# مصاريف وإيرادات المشاريع — كل شيء من GitHub
لا حاجة لأي أمر على جهازك. التعديل من متصفح GitHub، والنشر تلقائي عند كل تعديل على main.

1. **ارفع الملفات** إلى مستودع GitHub (Add file > Upload files)، فرع main.
2. **Settings > Pages > Source: GitHub Actions**. الموقع يظهر على `https://USER.github.io/REPO/`.
3. **Firebase Console**: فعّل Authentication (Email/Password) وFirestore، وألصق الإعدادات في `js/firebase.js` (آمنة للنشر العلني).
4. **Authentication > Settings > Authorized domains**: أضف `USER.github.io` (بدونها لن يعمل الدخول).
5. **المستخدمون**: أنشئهم من Authentication، ثم أضف مستندًا `users/{uid}` فيه `role`: admin | accountant | manager | entry.
6. **القواعد** (مرة واحدة، واحد من اثنين):
   - الأسهل: الصق محتوى `firestore.rules` في Firestore > Rules > Publish.
   - تلقائي: Project settings > Service accounts > Generate key، ثم في GitHub: Settings > Secrets > Actions أضف `FIREBASE_SERVICE_ACCOUNT` (محتوى ملف JSON) و`FIREBASE_PROJECT_ID`. بعدها أي تعديل على `firestore.rules` ينشر وحده.
الإيراد والمصروف صافيان بعد خصم الضريبة.
