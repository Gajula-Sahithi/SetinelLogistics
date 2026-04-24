// api/trigger-analysis.js — POST /api/trigger-analysis
// Triggers a full disruption analysis cycle across all shipments
const { Groq } = require('groq-sdk');
const axios = require('axios');
const { getDb } = require('./_firebase');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const performAIAnalysis = async (shipment, newsFeed, weather) => {
  try {
    const newsSummaries = newsFeed.slice(0, 5).map(n => `- ${n.title}: ${n.description}`).join('\n');
    const weatherDesc = weather.weather?.[0]?.description || 'Normal';
    const temp = (weather.main?.temp || 273.15) - 273.15;

    const prompt = `
      You are a senior logistics risk analyst for SentinelLogistics AI.
      Analyze risk for shipment ${shipment.id} from ${shipment.origin} to ${shipment.destination}.
      ROUTE: ${shipment.waypoints ? JSON.stringify(shipment.waypoints) : 'Direct segment'}
      LOGISTICS NEWS:\n${newsSummaries}
      WEATHER: ${weatherDesc}, ${temp.toFixed(1)}°C
      Return ONLY JSON: {
        "shipmentId": "${shipment.id}",
        "riskScore": (0-100),
        "riskReason": "string",
        "confidence": "LOW|MEDIUM|HIGH",
        "delayProbability": "LOW|MEDIUM|HIGH",
        "estimatedDelayRange": "string",
        "affectedCheckpoint": "string",
        "recommendedAction": "string",
        "mitigationStrategy": "string"
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(result.choices[0].message.content);
  } catch (err) {
    console.error(`AI error for ${shipment.id}:`, err.message);
    return {
      shipmentId: shipment.id,
      riskScore: 50,
      riskReason: 'AI analysis failed — using protective baseline.',
      confidence: 'LOW',
      delayProbability: 'MEDIUM',
      estimatedDelayRange: 'Unknown',
      affectedCheckpoint: 'N/A',
      recommendedAction: 'Manual corridor verification required',
    };
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!process.env.NEWSDATA_API_KEY) {
    return res.status(503).json({ error: 'NEWSDATA_API_KEY not configured' });
  }

  const db = getDb();

  try {
    // 1. Fetch news
    const newsResponse = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: process.env.NEWSDATA_API_KEY,
        q: 'port strike OR shipment delay OR logistics disruption OR cargo',
        language: 'en',
      },
      timeout: 8000,
    });
    const newsFeed = newsResponse.data.results || [];

    // 2. Fetch shipments (from Firebase if available)
    let shipments = [];
    if (db) {
      const snapshot = await db.ref('shipments').once('value');
      shipments = snapshot.val() ? Object.values(snapshot.val()) : [];
    }

    if (shipments.length === 0) {
      return res.json({ message: 'No active shipments to analyse', analysed: 0 });
    }

    const results = [];

    // 3. Analyse each shipment (limit to 5 to stay within Vercel timeout)
    for (const shipment of shipments.slice(0, 5)) {
      let weather = {};
      try {
        const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { lat: shipment.currentLat, lon: shipment.currentLng, appid: process.env.OPENWEATHER_API_KEY },
          timeout: 5000,
        });
        weather = weatherRes.data;
      } catch (e) {
        console.warn(`Weather fetch failed for ${shipment.id}`);
      }

      const assessment = await performAIAnalysis(shipment, newsFeed, weather);
      results.push(assessment);

      if (db) {
        const isHighRisk = assessment.riskScore > 60;
        await db.ref(`shipments/${shipment.id}`).update({
          riskScore: assessment.riskScore,
          riskReason: assessment.riskReason,
          confidence: assessment.confidence,
          recommendedAction: assessment.recommendedAction,
          status: isHighRisk ? 'REROUTE_PENDING' : (shipment.status === 'REROUTE_PENDING' ? 'REROUTE_PENDING' : 'ON_TRACK'),
          lastUpdated: new Date().toISOString(),
        });

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
            actionTaken: 'Awaiting Manager Approval',
          });
        }
      }
    }

    return res.json({ message: 'Analysis complete', analysed: results.length, results });
  } catch (err) {
    console.error('Disruption analysis error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
