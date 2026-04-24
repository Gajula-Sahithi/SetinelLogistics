// api/shipments/approve-reroute.js — POST /api/shipments/approve-reroute
const { getDb } = require('../_firebase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { shipmentId } = req.body;
  if (!shipmentId) return res.status(400).json({ error: 'shipmentId is required' });

  const db = getDb();

  try {
    let rerouteReason = 'Route optimization or safety concern';

    if (db) {
      // Try to get the most recent disruption reason for this shipment
      try {
        const snap = await db.ref('disruptions').orderByChild('shipmentId').equalTo(shipmentId).once('value');
        if (snap.exists()) {
          const disruptions = snap.val();
          const latest = Object.values(disruptions).pop();
          if (latest?.geminiAnalysis) rerouteReason = latest.geminiAnalysis;
          else if (latest?.newsHeadline) rerouteReason = latest.newsHeadline;
        }
      } catch (e) {
        console.warn('Could not fetch disruption reason:', e.message);
      }

      await db.ref(`shipments/${shipmentId}`).update({
        status: 'AT_RISK',
        rerouteApproved: true,
        approvalTimestamp: new Date().toISOString(),
        rerouteReason,
      });
    }

    return res.json({
      message: db
        ? 'Reroute approved and transmitted to field personnel'
        : 'Strategy approved. Please verify and apply manually.',
      reason: rerouteReason,
      dbUpdated: !!db,
    });
  } catch (err) {
    console.error('Approve reroute error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
