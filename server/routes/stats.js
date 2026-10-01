// ─── Stats Route ──────────────────────────────────────────────────────────────
// Dashboard summary cards data
const express = require('express');
const router = express.Router();
const Member   = require('../models/Member');
const Guest    = require('../models/Guest');
const Delivery = require('../models/Delivery');
const Log      = require('../models/Log');

// GET /api/stats — returns dashboard summary
router.get('/', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Total vehicles detected today (unique entries)
    const totalToday = await Log.countDocuments({
      action: 'ENTRY',
      createdAt: { $gte: startOfDay },
    });

    // Vehicles currently inside
    const membersInside  = await Member.countDocuments({ isInside: true });
    const guestsInside   = await Guest.countDocuments({ isInside: true });
    const deliveryInside = await Delivery.countDocuments({ isInside: true });
    const totalInside    = membersInside + guestsInside + deliveryInside;

    // Zone A (Members)
    const zoneAInside = await Member.countDocuments({ isInside: true, zone: 'A' });

    // Zone B (Guest + Delivery)
    const zoneBInside = guestsInside + deliveryInside;

    res.json({
      totalVehiclesToday: totalToday,
      activeVehiclesInside: totalInside,
      zoneAOccupied: zoneAInside,
      zoneBOccupied: zoneBInside,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
