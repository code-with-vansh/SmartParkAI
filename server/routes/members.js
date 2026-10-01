// ─── Members Route ────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// GET /api/members — list all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/members/inside — members currently inside
router.get('/inside', async (req, res) => {
  try {
    const members = await Member.find({ isInside: true });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members — create new member
router.post('/', async (req, res) => {
  try {
    const { name, flatNumber, mobile, plateNumber, vehicleType, zone } = req.body;
    // Prevent duplicate plate numbers
    const existing = await Member.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existing) {
      return res.status(409).json({ error: 'Plate number already registered as a member' });
    }
    const member = await Member.create({ name, flatNumber, mobile, plateNumber: plateNumber.toUpperCase(), vehicleType, zone: zone || 'A' });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/members/:id — update member
router.put('/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
