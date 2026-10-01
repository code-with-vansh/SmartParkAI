// ─── Member Model ─────────────────────────────────────────────────────────────
// Registered residents / members with assigned parking zone
const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  flatNumber:   { type: String, required: true, trim: true },
  mobile:       { type: String, required: true, trim: true },
  plateNumber:  { type: String, required: true, trim: true, uppercase: true },
  vehicleType:  { type: String, default: 'Car' }, // Car, Bike, etc.
  zone:         { type: String, default: 'A' },   // Zone A for members
  isInside:     { type: Boolean, default: false },
  lastEntry:    { type: Date },
  lastExit:     { type: Date },
  createdAt:    { type: Date, default: Date.now },
});

// Index for fast plate lookups
MemberSchema.index({ plateNumber: 1 });

module.exports = mongoose.model('Member', MemberSchema);
