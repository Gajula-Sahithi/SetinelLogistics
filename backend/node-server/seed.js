const admin = require('firebase-admin');
const fs = require('fs');

// Note: You need to download your service account key from Firebase Console
// and place it as 'serviceAccountKey.json' in this folder for the script to work.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com" // Update this
});

const db = admin.database();

const shipments = [
  {
    id: "SHIP-001",
    origin: "Shanghai",
    destination: "Rotterdam",
    currentLat: 31.2304,
    currentLng: 121.4737,
    status: "ON_TRACK",
    riskScore: 10,
    riskReason: "Normal weather conditions",
    confidence: "HIGH",
    eta: "2024-05-15T12:00:00Z",
    carrier: "Maersk",
    cargo: "Electronics",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 31.23, lng: 121.47 },
      { lat: 1.29, lng: 103.85 },
      { lat: 51.92, lng: 4.47 }
    ]
  },
  {
    id: "SHIP-002",
    origin: "Mumbai",
    destination: "Dubai",
    currentLat: 19.0760,
    currentLng: 72.8777,
    status: "ON_TRACK",
    riskScore: 5,
    riskReason: "Safe route",
    confidence: "HIGH",
    eta: "2024-05-10T08:00:00Z",
    carrier: "MSC",
    cargo: "Textiles",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 19.07, lng: 72.87 },
      { lat: 25.27, lng: 55.33 }
    ]
  },
  {
    id: "SHIP-003",
    origin: "Los Angeles",
    destination: "Chicago",
    currentLat: 34.0522,
    currentLng: -118.2437,
    status: "DELAYED",
    riskScore: 45,
    riskReason: "Heavy traffic in LA port",
    confidence: "MEDIUM",
    eta: "2024-05-12T18:00:00Z",
    carrier: "FedEx",
    cargo: "Medical Supplies",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 34.05, lng: -118.24 },
      { lat: 41.87, lng: -87.62 }
    ]
  },
  {
    id: "SHIP-004",
    origin: "Singapore",
    destination: "Sydney",
    currentLat: 1.3521,
    currentLng: 103.8198,
    status: "ON_TRACK",
    riskScore: 12,
    riskReason: "Clear skies",
    confidence: "HIGH",
    eta: "2024-05-20T06:00:00Z",
    carrier: "COSCO",
    cargo: "Automotive Parts",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 1.35, lng: 103.81 },
      { lat: -33.86, lng: 151.20 }
    ]
  },
  {
    id: "SHIP-005",
    origin: "Hamburg",
    destination: "New York",
    currentLat: 53.5511,
    currentLng: 9.9937,
    status: "AT_RISK",
    riskScore: 75,
    riskReason: "Atlantic storm warning",
    confidence: "HIGH",
    eta: "2024-05-18T14:00:00Z",
    carrier: "Hapag-Lloyd",
    cargo: "Industrial Machinery",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 53.55, lng: 9.99 },
      { lat: 40.71, lng: -74.00 }
    ]
  },
  {
    id: "SHIP-006",
    origin: "Tokyo",
    destination: "Vancouver",
    currentLat: 35.6762,
    currentLng: 139.6503,
    status: "ON_TRACK",
    riskScore: 15,
    riskReason: "Steady winds",
    confidence: "HIGH",
    eta: "2024-05-22T10:00:00Z",
    carrier: "ONE",
    cargo: "Consumer Goods",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 35.67, lng: 139.65 },
      { lat: 49.28, lng: -123.12 }
    ]
  },
  {
    id: "SHIP-007",
    origin: "Cairo",
    destination: "London",
    currentLat: 30.0444,
    currentLng: 31.2357,
    status: "ON_TRACK",
    riskScore: 8,
    riskReason: "Minor port congestion",
    confidence: "MEDIUM",
    eta: "2024-05-14T16:00:00Z",
    carrier: "CMA CGM",
    cargo: "Agricultural Products",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 30.04, lng: 31.23 },
      { lat: 51.50, lng: -0.12 }
    ]
  },
  {
    id: "SHIP-008",
    origin: "São Paulo",
    destination: "Lisbon",
    currentLat: -23.5505,
    currentLng: -46.6333,
    status: "AT_RISK",
    riskScore: 68,
    riskReason: "Fuel supply issues at refueling port",
    confidence: "MEDIUM",
    eta: "2024-05-25T09:00:00Z",
    carrier: "Maersk",
    cargo: "Coffee Beans",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: -23.55, lng: -46.63 },
      { lat: 38.72, lng: -9.13 }
    ]
  },
  {
    id: "SHIP-009",
    origin: "Nairobi",
    destination: "Paris",
    currentLat: -1.2921,
    currentLng: 36.8219,
    status: "ON_TRACK",
    riskScore: 5,
    riskReason: "Optimal flight conditions",
    confidence: "HIGH",
    eta: "2024-05-09T22:00:00Z",
    carrier: "DHL",
    cargo: "Flowers",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: -1.29, lng: 36.82 },
      { lat: 48.85, lng: 2.35 }
    ]
  },
  {
    id: "SHIP-010",
    origin: "Chennai",
    destination: "Colombo",
    currentLat: 13.0827,
    currentLng: 80.2707,
    status: "ON_TRACK",
    riskScore: 3,
    riskReason: "Short sea transit",
    confidence: "HIGH",
    eta: "2024-05-08T12:00:00Z",
    carrier: "Evergreen",
    cargo: "General Cargo",
    lastUpdated: new Date().toISOString(),
    route: [
      { lat: 13.08, lng: 80.27 },
      { lat: 6.92, lng: 79.86 }
    ]
  }
];

async function seedData() {
  try {
    const shipmentsRef = db.ref('shipments');
    const updates = {};
    shipments.forEach(shipment => {
      updates[shipment.id] = shipment;
    });
    await shipmentsRef.set(updates);
    console.log('Successfully seeded shipments data!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
