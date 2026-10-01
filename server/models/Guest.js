// ─── Guest Model ─────────────────────────────────────────────────────────────
// Temporary visitors — auto-delete 7 days after last seen
const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  mobile:      { type: String, trim: true },
  flatNumber:  { type: String, trim: true },  // Which flat they're visiting
  plateNumber: { type: String, required: true, trim: true, uppercase: true },
  type:        { type: String, default: 'Guest' },
  zone:        { type: String, default: 'B' },
  isInside:    { type: Boolean, default: false },
  lastEntry:   { type: Date },
  lastExit:    { type: Date },
  lastSeen:    { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now },
});

GuestSchema.index({ plateNumber: 1 });

module.exports = mongoose.model('Guest', GuestSchema);
