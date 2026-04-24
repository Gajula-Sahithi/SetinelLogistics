// api/status.js — GET /api/status
module.exports = (req, res) => {
  res.json({ status: 'Operational', architecture: 'Vercel Serverless v1.0' });
};
