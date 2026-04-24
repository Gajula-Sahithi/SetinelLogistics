const { getDatabase, ref, set } = require('firebase-admin/database');
const admin = require('firebase-admin');

// Initialize Firebase Admin (use environment variables)
const serviceAccount = {
  projectId: "routeiqlogistics-69d7b",
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-xxxxx@routeiqlogistics-69d7b.iam.gserviceaccount.com"
};

if (!serviceAccount.privateKey) {
  console.log("WARNING: No private key found. Using REST API approach...");
  console.log("Please create the shipment through the UI instead.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://routeiqlogistics-69d7b-default-rtdb.firebaseio.com"
});

const db = getDatabase();

const mockShipment = {
  id: "TEST-001",
  origin: "Hyderabad",
  destination: "Chennai",
  carrier: "RouteIQ Internal",
  cargo: "Electronics",
  driverEmail: "24211a05h1@bvrit.ac.in",
  driverPhone: "1111111111",
  driverName: "ramu",
  status: "ON_TRACK",
  currentLat: 17.385,
  currentLng: 78.4867,
  riskScore: 0,
  riskReason: "Awaiting first analysis cycle",
  lastUpdated: new Date().toISOString(),
  eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  route: [
    { lat: 17.385, lng: 78.4867 }
  ]
};

async function addShipment() {
  try {
    await set(ref(db, `shipments/${mockShipment.id}`), mockShipment);
    console.log("âœ… Mock shipment added successfully!");
    console.log("Shipment ID:", mockShipment.id);
    console.log("Driver Email:", mockShipment.driverEmail);
    console.log("Driver Name:", mockShipment.driverName);
    console.log("Driver Phone:", mockShipment.driverPhone);
    console.log("\nNow login with email 24211a05h1@bvrit.ac.in to see this shipment in Driver Portal.");
  } catch (error) {
    console.error("âŒ Error adding shipment:", error);
  }
}

addShipment();

