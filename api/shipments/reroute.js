// api/shipments/reroute.js — POST /api/shipments/reroute
const { Groq } = require('groq-sdk');
const { getDb } = require('../_firebase');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { shipmentId, reason, currentRoute, transportType } = req.body;
  if (!shipmentId) return res.status(400).json({ error: 'shipmentId is required' });

  const db = getDb();

  // Resolve shipment details
  let shipment = null;
  if (db) {
    try {
      const snap = await db.ref(`shipments/${shipmentId}`).once('value');
      shipment = snap.val();
    } catch (e) {
      console.warn('Could not fetch shipment from DB:', e.message);
    }
  }

  if (!shipment) {
    shipment = {
      id: shipmentId,
      origin: currentRoute?.split(' to ')[0] || 'Unknown',
      destination: currentRoute?.split(' to ')[1] || 'Unknown',
      transportType: transportType || 'Road',
    };
  }

  if (!process.env.GROQ_API_KEY) {
    if (db) {
      await db.ref(`shipments/${shipmentId}`).update({
        status: 'AT_RISK',
        rerouteApproved: true,
        rerouteReason: reason || 'Manual reroute by Admin/Manager',
        rerouteTimestamp: new Date().toISOString(),
      });
    }
    return res.json({ message: 'Reroute initiated (AI unavailable)', newRoute: 'Use default routing service' });
  }

  try {
    const prompt = `
      You are a logistics expert. Suggest an alternative route for a shipment.
      - Origin: ${shipment.origin}
      - Destination: ${shipment.destination}
      - Transport Type: ${shipment.transportType || transportType || 'Road'}
      - Current Route: ${currentRoute || 'Standard route'}
      - Reason for Reroute: ${reason || 'Route optimization'}
      Consider alternative paths avoiding congested areas, weather, and transport constraints.
      Return ONLY JSON: {
        "suggestedRoute": "Description of new route",
        "waypoints": ["waypoint1", "waypoint2"],
        "estimatedDelay": "X minutes",
        "riskReduction": "Percentage or description",
        "justification": "Why this route is better"
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
    });

    const routeData = JSON.parse(result.choices[0].message.content);

    if (db) {
      await db.ref(`shipments/${shipmentId}`).update({
        status: 'AT_RISK',
        rerouteApproved: true,
        rerouteReason: reason || routeData.justification,
        suggestedRoute: routeData.suggestedRoute,
        waypoints: routeData.waypoints,
        rerouteTimestamp: new Date().toISOString(),
      });

      await db.ref('disruptions').push({
        timestamp: new Date().toISOString(),
        shipmentId,
        newsHeadline: 'Manual Reroute Initiated',
        geminiAnalysis: routeData.justification,
        actionTaken: 'Route updated with AI suggestion',
      });
    }

    return res.json({
      message: db ? 'Reroute initiated with AI suggestion' : 'AI analysis complete. Please verify and apply route manually.',
      suggestedRoute: routeData.suggestedRoute,
      waypoints: routeData.waypoints,
      justification: routeData.justification,
      dbUpdated: !!db,
    });
  } catch (err) {
    console.error('Reroute error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
