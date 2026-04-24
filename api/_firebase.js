// api/_firebase.js — Shared Firebase Admin initializer for all serverless functions
const admin = require('firebase-admin');

let db = null;

const getDb = () => {
  if (db) return db;

  // Prevent re-initialization on warm lambda reuse
  if (admin.apps.length > 0) {
    db = admin.apps[0].database();
    return db;
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    console.warn('FIREBASE_DATABASE_URL not set — DB writes disabled.');
    return null;
  }

  // Support JSON service account injected as env variable
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
      });
      db = admin.database();
      console.log('Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT env var.');
      return db;
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  console.warn('No Firebase service account found — DB writes disabled.');
  return null;
};

module.exports = { getDb };
