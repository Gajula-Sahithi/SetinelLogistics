const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

// Firebase Admin Setup
const fs = require('fs');
const keyPath = './serviceAccountKey.json';

let db = null;

if (fs.existsSync(keyPath)) {
  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  db = admin.database();
  console.log("Firebase Admin initialized with Service Account.");
} else {
  console.warn("WARNING: serviceAccountKey.json NOT FOUND. Firebase Admin features will be restricted.");
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// HELPERS
const fetchActiveShipments = async () => {
  if (!db) return [];
  const snapshot = await db.ref('shipments').once('value');
  return snapshot.val() ? Object.values(snapshot.val()) : [];
};

const performAIAnalysis = async (shipment, newsFeed, weather) => {
  try {
    const newsSummaries = newsFeed.slice(0, 5).map(n => `- ${n.title}: ${n.description}`).join('\n');
    const weatherDesc = weather.weather?.[0]?.description || 'Normal';
    const temp = (weather.main?.temp || 0) - 273.15;

    const systemPrompt = `
      You are a senior logistics risk analyst for SentinelLogistics AI. 
      Analyze the risk for shipment ${shipment.id} from ${shipment.origin} to ${shipment.destination}.
      
      RELEVANT LOGISTICS NEWS:
      ${newsSummaries}
      
      CURRENT WEATHER AT SHIPMENT LOCATION:
      - Condition: ${weatherDesc}
      - Temp: ${temp.toFixed(1)}°C
      
      TASK:
      Identify if this shipment is at risk based on the news (strikes, port closures, global logistics events) and weather.
      
      Return ONLY a JSON object with:
      {
          "shipmentId": "${shipment.id}",
          "riskScore": (integer 0-100),
          "riskReason": (string explanation in one sentence),
          "confidence": ("LOW" | "MEDIUM" | "HIGH"),
          "recommendedAction": (string concise recommendation)
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Clean JSON response
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`Gemini Internal Error for ${shipment.id}:`, err.message);
    return {
      shipmentId: shipment.id,
      riskScore: 50,
      riskReason: "Internal AI analysis timeout, using protective baseline.",
      confidence: "LOW",
      recommendedAction: "Manual corridor verification required"
    };
  }
};

// AI DISRUPTION ENGINE POLL
const runDisruptionAnalysis = async () => {
  if (!process.env.NEWSDATA_API_KEY) {
    console.warn("NEWSDATA_API_KEY missing, skipping cycle.");
    return;
  }

  console.log("Starting Unified Disruption Analysis Cycle...");

  try {
    // 1. Fetch News
    const newsResponse = await axios.get(`https://newsdata.io/api/1/news`, {
      params: {
        apikey: process.env.NEWSDATA_API_KEY,
        q: "port strike OR shipment delay OR logistics disruption OR cargo",
        language: "en"
      }
    });
    const newsFeed = newsResponse.data.results || [];

    // 2. Fetch Active Shipments
    const shipments = await fetchActiveShipments();

    // 3. Prepare analysis for each shipment
    for (const shipment of shipments) {
      // Fetch current weather
      let weather = {};
      try {
        const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
          params: {
            lat: shipment.currentLat,
            lon: shipment.currentLng,
            appid: process.env.OPENWEATHER_API_KEY
          }
        });
        weather = weatherResponse.data;
      } catch (e) {
        console.warn(`Weather fetch failed for ${shipment.id}`);
      }

      // 4. Internal AI Assessment
      const assessment = await performAIAnalysis(shipment, newsFeed, weather);

      // 5. Update DB (Strategic Logic)
      // If risk is high, we mark for Manager Review instead of auto-applying
      const isHighRisk = assessment.riskScore > 60;
      const updates = {
        riskScore: assessment.riskScore,
        riskReason: assessment.riskReason,
        confidence: assessment.confidence,
        recommendedAction: assessment.recommendedAction,
        // Only mark as AT_RISK if it was already approved or if it's a new critical threat
        status: isHighRisk ? 'REROUTE_PENDING' : (shipment.status === 'REROUTE_PENDING' ? 'REROUTE_PENDING' : 'ON_TRACK'),
        lastUpdated: new Date().toISOString()
      };

      if (db) {
        await db.ref(`shipments/${shipment.id}`).update(updates);

        if (isHighRisk) {
          await db.ref('disruptions').push({
            timestamp: new Date().toISOString(),
            shipmentId: shipment.id,
            newsHeadline: newsFeed[0]?.title || 'Multiple logistics factors',
            weatherCondition: weather.weather?.[0]?.description || 'Atmospheric volatility',
            geminiAnalysis: assessment.riskReason,
            actionTaken: 'Awaiting Manager Approval'
          });
        }
      }
    }
  } catch (err) {
    console.error("Disruption Assessment Cycle failed:", err.message);
  }
};

// Polling interval (Every 60 minutes)
setInterval(runDisruptionAnalysis, 60 * 60 * 1000);

// API Endpoints
app.get('/api/status', (req, res) => res.send({ status: 'Operational', architecture: 'Single-Server v3.0' }));

app.post('/api/trigger-analysis', async (req, res) => {
  runDisruptionAnalysis();
  res.send({ message: 'Analysis triggered manually' });
});

// Operational Endpoints (Reroute Approval)
app.post('/api/shipments/approve-reroute', async (req, res) => {
  const { shipmentId } = req.body;
  if (!db || !shipmentId) return res.status(400).send({ error: 'Invalid request' });

  try {
    await db.ref(`shipments/${shipmentId}`).update({
      status: 'AT_RISK', // Officially at risk and rerouting
      rerouteApproved: true,
      approvalTimestamp: new Date().toISOString()
    });
    res.send({ message: 'Reroute approved and transmitted to field personnel' });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


// SERVE FRONTEND (Production)
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Handle React Routing (Match all remaining routes)
app.get(/^(?!\/api).*/, (req, res) => {
  const indexFile = path.resolve(__dirname, '../../frontend/dist/index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send("Frontend build not found. Please run 'npm run build' in the frontend directory.");
  }
});

app.listen(PORT, () => {
  console.log(`SENTINEL UNIFIED SERVER RUNNING`);
  console.log(`URL: http://localhost:${PORT}`);
});
