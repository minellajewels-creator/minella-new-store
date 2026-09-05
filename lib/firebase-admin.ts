import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  }
  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
