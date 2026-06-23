const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const databaseURL = 'https://drzapp-61e27-default-rtdb.firebaseio.com';

const privateKeyEnv = process.env.private_key || process.env.PRIVATE_KEY;
const clientEmailEnv = process.env.client_email || process.env.CLIENT_EMAIL;
const projectIdEnv = process.env.project_id || process.env.PROJECT_ID;

if (privateKeyEnv && clientEmailEnv && projectIdEnv) {
    try {
        let formattedPrivateKey = privateKeyEnv.trim();
        if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
            formattedPrivateKey = formattedPrivateKey.slice(1, -1);
        }
        if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
            formattedPrivateKey = formattedPrivateKey.slice(1, -1);
        }
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n').trim();

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectIdEnv,
                clientEmail: clientEmailEnv,
                privateKey: formattedPrivateKey
            }),
            databaseURL
        });
        console.log("Firebase Admin initialized using individual environment variables");
    } catch (err) {
        console.error("Error initializing Firebase Admin with individual env variables:", err.message);
        process.exit(1);
    }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL
        });
        console.log("Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT environment variable");
    } catch (err) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
        process.exit(1);
    }
} else if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL
        });
        console.log("Firebase Admin initialized using serviceAccountKey.json");
    } catch (err) {
        console.error("Error parsing serviceAccountKey.json:", err.message);
        process.exit(1);
    }
} else {
    try {
        admin.initializeApp({
            projectId: 'drzapp-61e27',
            databaseURL
        });
        console.log("Firebase Admin initialized with default project ID");
    } catch (err) {
        console.error("Firebase Initialization Error: serviceAccountKey.json was not found.");
        console.error("Please download it from Firebase Console (Settings -> Service Accounts -> Generate new private key) and place it in the Backend folder.");
        process.exit(1);
    }
}

const db = admin.database();
module.exports = db;
