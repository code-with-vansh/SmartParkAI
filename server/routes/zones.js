// ─── Zones Route ──────────────────────────────────────────────────────────────
// Returns real-time occupancy for Zone A and Zone B
const express = require('express');
const router = express.Router();
const Member   = require('../models/Member');
const Guest    = require('../models/Guest');
const Delivery = require('../models/Delivery');
const Settings = require('../models/Settings');

// GET /api/zones — zone occupancy stats
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne() || { zoneACapacity: 50, zoneBCapacity: 30 };

    // Zone A = Members inside
    const zoneAOccupied = await Member.countDocuments({ isInside: true, zone: 'A' });

    // Zone B = Guests + Delivery inside
    const guestsInside   = await Guest.countDocuments({ isInside: true });
    const deliveryInside = await Delivery.countDocuments({ isInside: true });
    const zoneBOccupied  = guestsInside + deliveryInside;

    res.json({
      zoneA: {
        total:     settings.zoneACapacity,
        occupied:  zoneAOccupied,
        available: Math.max(0, settings.zoneACapacity - zoneAOccupied),
      },
      zoneB: {
        total:     settings.zoneBCapacity,
        occupied:  zoneBOccupied,
        available: Math.max(0, settings.zoneBCapacity - zoneBOccupied),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
