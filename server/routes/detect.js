// ─── Detect Route ─────────────────────────────────────────────────────────────
// Called by AI module when a plate is detected
// Handles ENTRY / EXIT logic and unknown vehicle popup trigger

const express = require('express');
const router = express.Router();
const Member   = require('../models/Member');
const Guest    = require('../models/Guest');
const Delivery = require('../models/Delivery');
const Log      = require('../models/Log');
const Settings = require('../models/Settings');

// In-memory cache: plate -> timestamp of last event (for duplicate prevention)
const recentDetections = new Map();
const unknownQueue = [];           //! addedByVanshGarg

// POST /api/detect
// Body: { plateNumber, plateImage, confidence }
router.post('/', async (req, res) => {
  try {
    const { plateNumber, plateImage, confidence } = req.body;

    if (!plateNumber) {
      return res.status(400).json({ error: 'plateNumber is required' });
    }

    const plate = plateNumber.toUpperCase().replace(/\s/g, '');

    // ── Duplicate check ────────────────────────────────────────────────────
    const settings = await Settings.findOne() || {};
    const dupWindow = (settings.duplicateWindow || 10) * 1000; // ms
    const lastSeen = recentDetections.get(plate);
    if (lastSeen && (Date.now() - lastSeen) < dupWindow) {
      return res.json({ status: 'duplicate', message: 'Plate seen too recently, ignoring' });
    }
    recentDetections.set(plate, Date.now());

    // ── Lookup in Members ──────────────────────────────────────────────────
    let member = await Member.findOne({ plateNumber: plate });
    if (member) {
      const action = member.isInside ? 'EXIT' : 'ENTRY';
      if (action === 'ENTRY') {
        member.isInside = true;
        member.lastEntry = new Date();
      } else {
        member.isInside = false;
        member.lastExit = new Date();
      }
      await member.save();

      const log = await Log.create({
        plateNumber: plate,
        action,
        personName: member.name,
        personType: 'Member',
        zone: 'A',
        flatNumber: member.flatNumber,
        plateImage: plateImage || '',
        confidence: confidence || 0,
      });

      return res.json({
        status: 'known',
        action,
        person: { name: member.name, type: 'Member', zone: 'A', flat: member.flatNumber },
        logId: log._id,
      });
    }

    // ── Lookup in Guests ──────────────────────────────────────────────────
    let guest = await Guest.findOne({ plateNumber: plate });
    if (guest) {
      const action = guest.isInside ? 'EXIT' : 'ENTRY';
      if (action === 'ENTRY') {
        guest.isInside = true;
        guest.lastEntry = new Date();
      } else {
        guest.isInside = false;
        guest.lastExit = new Date();
      }
      guest.lastSeen = new Date();
      await guest.save();

      const log = await Log.create({
        plateNumber: plate,
        action,
        personName: guest.name,
        personType: guest.type,
        zone: 'B',
        flatNumber: guest.flatNumber,
        plateImage: plateImage || '',
        confidence: confidence || 0,
      });

      return res.json({
        status: 'known',
        action,
        person: { name: guest.name, type: guest.type, zone: 'B', flat: guest.flatNumber },
        logId: log._id,
      });
    }

    // ── Lookup in Delivery ────────────────────────────────────────────────
    let delivery = await Delivery.findOne({ plateNumber: plate });
    if (delivery) {
      const action = delivery.isInside ? 'EXIT' : 'ENTRY';
      if (action === 'ENTRY') {
        delivery.isInside = true;
        delivery.lastEntry = new Date();
      } else {
        delivery.isInside = false;
        delivery.lastExit = new Date();
      }
      delivery.lastSeen = new Date();
      await delivery.save();

      const log = await Log.create({
        plateNumber: plate,
        action,
        personName: delivery.name,
        personType: delivery.type,
        zone: 'B',
        flatNumber: delivery.flatNumber,
        plateImage: plateImage || '',
        confidence: confidence || 0,
      });

      return res.json({
        status: 'known',
        action,
        person: { name: delivery.name, type: delivery.type, zone: 'B', flat: delivery.flatNumber },
        logId: log._id,
      });
    }

    // ── Unknown plate — trigger frontend popup ────────────────────────────
    unknownQueue.push({ plateNumber: plate, plateImage: plateImage || '' });
    return res.json({
      status: 'unknown',
      plateNumber: plate,
      plateImage: plateImage || '',
      message: 'Plate not found in database. Requires registration.',
    });

  } catch (err) {
    console.error('[Detect] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/detect/unknown — frontend polls this to get pending unknown plates
router.get('/unknown', (req, res) => {
  const pending = unknownQueue.shift() || null; // dequeue one at a time
  res.json({ pending });
});

// POST /api/detect/register
// Called after popup form is submitted for unknown vehicles
router.post('/register', async (req, res) => {
  try {
    const { plateNumber, name, type, mobile, flatNumber, plateImage, confidence } = req.body;
    const plate = plateNumber.toUpperCase().replace(/\s/g, '');

    let person;
    let zone = 'B';

    if (type === 'Guest') {
      person = await Guest.create({ name, mobile, flatNumber, plateNumber: plate, type: 'Guest', isInside: true, lastEntry: new Date(), lastSeen: new Date() });
    } else {
      // Delivery, Plumber, Electrician, Other
      person = await Delivery.create({ name, mobile, flatNumber, plateNumber: plate, type, isInside: true, lastEntry: new Date(), lastSeen: new Date() });
    }

    const log = await Log.create({
      plateNumber: plate,
      action: 'ENTRY',
      personName: name,
      personType: type,
      zone,
      flatNumber,
      plateImage: plateImage || '',
      confidence: confidence || 0,
    });

    res.json({ status: 'registered', action: 'ENTRY', person: { name, type, zone, flat: flatNumber }, logId: log._id });
  } catch (err) {
    console.error('[Register] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
