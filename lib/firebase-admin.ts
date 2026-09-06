import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");

  let sa: Record<string, string>;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
  }

  // Vercel can single- or double-escape newlines in the private key.
  // Normalise: replace any sequence of backslash+n (however many levels deep)
  // with an actual newline, then ensure the PEM header/footer have no spaces.
  if (sa.private_key) {
    // Handle \\n (double-escaped) and \n (single-escaped)
    sa.private_key = sa.private_key
      .replace(/\\\\n/g, "\n") // triple-paste artefact
      .replace(/\\n/g, "\n"); // normal Vercel escaping
  }

  adminApp = initializeApp({ credential: cert(sa as any) });
  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
