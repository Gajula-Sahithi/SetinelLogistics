// api/optimize-route.js — POST /api/optimize-route
const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { originLat, originLng, destLat, destLng, transportType, shipmentId } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.json({ optimized: false, message: 'Groq API not configured' });
  }

  try {
    const prompt = `
      You are a logistics expert optimizing a route.
      - Origin: ${originLat}, ${originLng}
      - Destination: ${destLat}, ${destLng}
      - Transport Type: ${transportType || 'Road'}
      - Shipment ID: ${shipmentId || 'N/A'}
      Analyze and provide optimization suggestions considering traffic, weather, and congestion.
      Return ONLY JSON: {
        "optimized": true,
        "suggestions": ["suggestion1"],
        "waypoints": ["lat,lng"],
        "estimatedTimeSavings": "X minutes",
        "riskReduction": "Description",
        "reasoning": "Why this optimization is beneficial"
      }
    `;

    const result = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(result.choices[0].message.content);
    return res.json(data);
  } catch (err) {
    console.error('Route optimization error:', err.message);
    return res.json({ optimized: false, error: err.message });
  }
};
