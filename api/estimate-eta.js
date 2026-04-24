// api/estimate-eta.js — POST /api/estimate-eta
const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const speedDefaults = { Road: 60, Rail: 80, Air: 800, Sea: 30, 'Multi-modal': 50 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { totalDistance, remainingDistance, transportType, shipmentId } = req.body;

  if (!totalDistance || !remainingDistance) {
    return res.status(400).json({ error: 'totalDistance and remainingDistance are required' });
  }

  if (!process.env.GROQ_API_KEY) {
    const speed = speedDefaults[transportType] || 60;
    const hours = remainingDistance / speed;
    return res.json({ eta: `${Math.ceil(hours)} hours`, method: 'fallback' });
  }

  try {
    const prompt = `
      You are a logistics expert. Estimate the ETA for a shipment.
      - Total Distance: ${parseFloat(totalDistance).toFixed(1)} km
      - Remaining Distance: ${parseFloat(remainingDistance).toFixed(1)} km
      - Transport Type: ${transportType}
      - Shipment ID: ${shipmentId || 'N/A'}
      Consider average speeds for ${transportType} transport, moderate traffic, normal weather, and a 10-15% buffer.
      Return ONLY JSON: { "eta": "X hours Y minutes", "confidence": "HIGH|MEDIUM|LOW", "factors": ["factor1"] }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(result.choices[0].message.content);
    return res.json({ eta: data.eta, confidence: data.confidence, factors: data.factors });
  } catch (err) {
    console.error('ETA estimation error:', err.message);
    const speed = speedDefaults[transportType] || 60;
    const hours = remainingDistance / speed;
    return res.json({ eta: `${Math.ceil(hours)} hours`, method: 'fallback' });
  }
};
