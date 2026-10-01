// ─── Logs Route ───────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// GET /api/logs — all logs (sorted newest first)
router.get('/', async (req, res) => {
  try {
    const { action, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action.toUpperCase();
    const logs = await Log.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/today — only today's logs
router.get('/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const logs = await Log.find({ createdAt: { $gte: startOfDay } }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/latest — last 20 logs for live feed
router.get('/latest', async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
