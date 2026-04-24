const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');
const { Groq } = require('groq-sdk');

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

// Initialize Groq AI
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

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
      You are a senior logistics risk analyst for RouteIQLogistics AI. 
      Analyze the risk for shipment ${shipment.id} from ${shipment.origin} to ${shipment.destination}.
      
      ROUTE GEOMETRY (Waypoints):
      ${shipment.waypoints ? JSON.stringify(shipment.waypoints) : 'Direct segment'}

      RELEVANT LOGISTICS NEWS:
      ${newsSummaries}
      
      CURRENT WEATHER AT SHIPMENT LOCATION:
      - Condition: ${weatherDesc}
      - Temp: ${temp.toFixed(1)}Â°C
      
      TASK:
      1. Identify if this shipment is at risk based on the news and weather.
      2. Correlate risks with specific checkpoints or route segments.
      3. Predict the probability of delay (LOW, MEDIUM, HIGH).
      4. Estimate the impact range (e.g., "6-12 hours").
      5. Provide a specific mitigation strategy.

      Return ONLY a JSON object with:
      {
          "shipmentId": "${shipment.id}",
          "riskScore": (integer 0-100),
          "riskReason": (string explanation),
          "confidence": ("LOW" | "MEDIUM" | "HIGH"),
          "delayProbability": ("LOW" | "MEDIUM" | "HIGH"),
          "estimatedDelayRange": (string descriptive, e.g. "8-16 hours"),
          "affectedCheckpoint": (string specific location name),
          "recommendedAction": (string short action),
          "mitigationStrategy": (string detailed tactical advice)
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: systemPrompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0].message.content;

    // Clean JSON response
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const assessmentData = JSON.parse(jsonStr);

    return {
      shipmentId: shipment.id,
      riskScore: assessmentData.riskScore,
      riskReason: assessmentData.riskReason,
      confidence: assessmentData.confidence,
      delayProbability: assessmentData.delayProbability || 'LOW',
      estimatedDelayRange: assessmentData.estimatedDelayRange || 'None',
      affectedCheckpoint: assessmentData.affectedCheckpoint || 'Global',
      recommendedAction: assessmentData.recommendedAction,
      mitigationStrategy: assessmentData.mitigationStrategy || assessmentData.recommendedAction
    };
  } catch (err) {
    console.error(`Groq Internal Error for ${shipment.id}:`, err.message);
    return {
      shipmentId: shipment.id,
      riskScore: 50,
      riskReason: "Internal AI analysis timeout, using protective baseline.",
      confidence: "LOW",
      delayProbability: "MEDIUM",
      estimatedDelayRange: "Unknown",
      affectedCheckpoint: "N/A",
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
    console.log("Fetching news from NewsData API...");
    const newsResponse = await axios.get(`https://newsdata.io/api/1/news`, {
      params: {
        apikey: process.env.NEWSDATA_API_KEY,
        q: "port strike OR shipment delay OR logistics disruption OR cargo",
        language: "en"
      }
    });
    const newsFeed = newsResponse.data.results || [];
    console.log(`Fetched ${newsFeed.length} news articles`);

    // 2. Fetch Active Shipments
    console.log("Fetching active shipments...");
    const shipments = await fetchActiveShipments();
    console.log(`Found ${shipments.length} active shipments`);

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
            delayProbability: assessment.delayProbability,
            estimatedDelayRange: assessment.estimatedDelayRange,
            affectedCheckpoint: assessment.affectedCheckpoint,
            mitigationStrategy: assessment.mitigationStrategy,
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
  
  // Basic validation - doesn't strictly NEED db here if we want to return a possible reason
  if (!shipmentId) return res.status(400).send({ error: 'Invalid request' });

  try {
    // Fetch disruption reason from disruptions collection IF db exists
    let rerouteReason = 'Route optimization or safety concern';
    if (db) {
      try {
        const disruptionsSnapshot = await db.ref('disruptions').orderByChild('shipmentId').equalTo(shipmentId).once('value');
        if (disruptionsSnapshot.exists()) {
          const disruptions = disruptionsSnapshot.val();
          const latestDisruption = Object.values(disruptions).pop();
          if (latestDisruption && latestDisruption.geminiAnalysis) {
            rerouteReason = latestDisruption.geminiAnalysis;
          } else if (latestDisruption && latestDisruption.newsHeadline) {
            rerouteReason = latestDisruption.newsHeadline;
          }
        }
      } catch (e) {
        console.log('Could not fetch disruption reason, using default');
      }

      await db.ref(`shipments/${shipmentId}`).update({
        status: 'AT_RISK',
        rerouteApproved: true,
        approvalTimestamp: new Date().toISOString(),
        rerouteReason: rerouteReason
      });
    }

    res.send({ 
      message: db ? 'Reroute approved and transmitted to field personnel' : 'Strategy approved. Please verify and apply manually.', 
      reason: rerouteReason,
      dbUpdated: !!db
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ETA Estimation using Gemini API
app.post('/api/estimate-eta', async (req, res) => {
  const { totalDistance, remainingDistance, transportType, shipmentId } = req.body;
  
  if (!process.env.GROQ_API_KEY) {
    // Fallback calculation
    const speeds = {
      'Road': 60, // km/h
      'Rail': 80,
      'Air': 800,
      'Sea': 30,
      'Multi-modal': 50
    };
    const speed = speeds[transportType] || 60;
    const hours = remainingDistance / speed;
    return res.send({ eta: `${Math.ceil(hours)} hours`, method: 'fallback' });
  }

  try {
    const systemPrompt = `
      You are a logistics expert. Estimate the ETA for a shipment.
      
      Shipment Details:
      - Total Distance: ${totalDistance.toFixed(1)} km
      - Remaining Distance: ${remainingDistance.toFixed(1)} km
      - Transport Type: ${transportType}
      - Shipment ID: ${shipmentId || 'N/A'}
      
      Consider the following factors:
      - Average speeds for ${transportType} transport
      - Traffic conditions (moderate)
      - Weather conditions (normal)
      - Potential delays (10-15% buffer)
      
      Return ONLY a JSON object with:
      {
        "eta": "X hours Y minutes" or "X days Y hours",
        "confidence": "HIGH|MEDIUM|LOW",
        "factors": ["factor1", "factor2"]
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: systemPrompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0].message.content;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const etaData = JSON.parse(jsonStr);
    
    res.send({ eta: etaData.eta, confidence: etaData.confidence, factors: etaData.factors });
  } catch (err) {
    console.error('Groq ETA estimation error:', err);
    // Fallback calculation
    const speeds = {
      'Road': 60, // km/h
      'Rail': 80,
      'Air': 800,
      'Sea': 30,
      'Multi-modal': 50
    };
    const speed = speeds[transportType] || 60;
    const hours = remainingDistance / speed;
    res.send({ eta: `${Math.ceil(hours)} hours`, method: 'fallback' });
  }
});

// Manual Reroute using Gemini AI
app.post('/api/shipments/reroute', async (req, res) => {
  const { shipmentId, reason, currentRoute, transportType } = req.body;
  console.log(`[REROUTE] Request received for ${shipmentId}`);
  
  if (!shipmentId) return res.status(400).send({ error: 'Invalid request' });

  try {
    // Fetch shipment details IF db exists
    let shipment = null;
    if (db) {
      const shipmentSnapshot = await db.ref(`shipments/${shipmentId}`).once('value');
      shipment = shipmentSnapshot.val();
    }
    
    // If no shipment in DB (or DB restricted), create a mock from request data to allow AI suggestion
    if (!shipment) {
      shipment = {
        id: shipmentId,
        origin: currentRoute ? currentRoute.split(' to ')[0] : 'Unknown',
        destination: currentRoute ? currentRoute.split(' to ')[1] : 'Unknown',
        transportType: transportType || 'Road'
      };
    }

    // Use Groq AI to suggest new route
    if (!process.env.GROQ_API_KEY) {
      // Fallback: simple reroute without AI
      await db.ref(`shipments/${shipmentId}`).update({
        status: 'AT_RISK',
        rerouteApproved: true,
        rerouteReason: reason || 'Manual reroute by Admin/Manager',
        rerouteTimestamp: new Date().toISOString()
      });
      return res.send({ 
        message: 'Reroute initiated (AI unavailable)',
        newRoute: 'Use default routing service'
      });
    }

    const systemPrompt = `
      You are a logistics expert. Suggest an alternative route for a shipment.
      
      Current Shipment:
      - Origin: ${shipment.origin}
      - Destination: ${shipment.destination}
      - Transport Type: ${shipment.transportType || transportType}
      - Current Route: ${currentRoute || 'Standard route'}
      - Reason for Reroute: ${reason || 'Route optimization'}
      
      Consider the following:
      - Alternative paths avoiding congested areas
      - Weather conditions
      - Traffic patterns
      - Transport type constraints
      
      Return ONLY a JSON object with:
      {
        "suggestedRoute": "Description of new route (e.g., 'Via highway A, then B')",
        "waypoints": ["waypoint1", "waypoint2", "waypoint3"],
        "estimatedDelay": "X minutes",
        "riskReduction": "Percentage or description",
        "justification": "Why this route is better"
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: systemPrompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0].message.content;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const routeData = JSON.parse(jsonStr);

    // Update shipment with new route info IF db exists
    if (db) {
      await db.ref(`shipments/${shipmentId}`).update({
        status: 'AT_RISK',
        rerouteApproved: true,
        rerouteReason: reason || routeData.justification,
        suggestedRoute: routeData.suggestedRoute,
        waypoints: routeData.waypoints,
        rerouteTimestamp: new Date().toISOString()
      });

      // Log to disruptions
      await db.ref('disruptions').push({
        timestamp: new Date().toISOString(),
        shipmentId: shipmentId,
        newsHeadline: 'Manual Reroute Initiated',
        geminiAnalysis: routeData.justification,
        actionTaken: 'Route updated with AI suggestion'
      });
    }

    res.send({ 
      message: db ? 'Reroute initiated with AI suggestion' : 'AI analysis complete. Please verify and apply route manually.',
      suggestedRoute: routeData.suggestedRoute,
      waypoints: routeData.waypoints,
      justification: routeData.justification,
      dbUpdated: !!db
    });
  } catch (err) {
    console.error('Manual reroute error:', err);
    res.status(500).send({ error: err.message });
  }
});

// Route Optimization using Groq AI with OpenRouteService
app.post('/api/optimize-route', async (req, res) => {
  const { originLat, originLng, destLat, destLng, transportType, shipmentId } = req.body;
  
  if (!process.env.GROQ_API_KEY) {
    return res.send({ optimized: false, message: 'Groq API not available' });
  }

  try {
    const systemPrompt = `
      You are a logistics expert optimizing a route using OpenRouteService.
      
      Route Parameters:
      - Origin: ${originLat}, ${originLng}
      - Destination: ${destLat}, ${destLng}
      - Transport Type: ${transportType || 'Road'}
      - Shipment ID: ${shipmentId || 'N/A'}
      
      Analyze this route and provide optimization suggestions:
      - Consider traffic patterns
      - Weather conditions
      - Transport type constraints
      - Potential congestion points
      - Alternative waypoints for better routing
      
      Return ONLY a JSON object with:
      {
        "optimized": true,
        "suggestions": ["suggestion1", "suggestion2"],
        "waypoints": ["lat,lng", "lat,lng"],
        "estimatedTimeSavings": "X minutes",
        "riskReduction": "Description",
        "reasoning": "Why this optimization is beneficial"
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: systemPrompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' }
    });

    const text = result.choices[0].message.content;
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const optimizationData = JSON.parse(jsonStr);

    res.send(optimizationData);
  } catch (err) {
    console.error('Route optimization error:', err);
    res.send({ optimized: false, error: err.message });
  }
});

// Test endpoint to create a manual disruption for testing
app.post('/api/test-disruption', async (req, res) => {
  if (!db) {
    return res.status(500).send({ error: 'Firebase not initialized' });
  }

  try {
    await db.ref('disruptions').push({
      timestamp: new Date().toISOString(),
      shipmentId: 'TEST-001',
      newsHeadline: 'Test Disruption: Port Strike in Mumbai',
      weatherCondition: 'Severe weather conditions',
      geminiAnalysis: 'This is a test disruption created manually for testing the Intelligence page. The AI analysis indicates high risk due to port strike and severe weather.',
      actionTaken: 'Awaiting Manager Approval'
    });

    res.send({ message: 'Test disruption created successfully' });
  } catch (err) {
    console.error('Test disruption error:', err);
    res.status(500).send({ error: err.message });
  }
});

// GET version for easier testing
app.get('/api/test-disruption', async (req, res) => {
  if (!db) {
    return res.status(500).send({ error: 'Firebase not initialized' });
  }

  try {
    await db.ref('disruptions').push({
      timestamp: new Date().toISOString(),
      shipmentId: 'TEST-001',
      newsHeadline: 'Test Disruption: Port Strike in Mumbai',
      weatherCondition: 'Severe weather conditions',
      geminiAnalysis: 'This is a test disruption created manually for testing the Intelligence page. The AI analysis indicates high risk due to port strike and severe weather.',
      actionTaken: 'Awaiting Manager Approval'
    });

    res.send({ message: 'Test disruption created successfully' });
  } catch (err) {
    console.error('Test disruption error:', err);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SENTINEL UNIFIED SERVER RUNNING`);
  console.log(`URL: http://localhost:${PORT}`);
});

