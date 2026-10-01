// ─── Delivery / Other Model ───────────────────────────────────────────────────
// Delivery persons, plumbers, electricians, etc. — auto-delete 7 days after last seen
const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  mobile:      { type: String, trim: true },
  flatNumber:  { type: String, trim: true },
  plateNumber: { type: String, required: true, trim: true, uppercase: true },
  // Type: Delivery | Plumber | Electrician | Other
  type:        { type: String, default: 'Delivery' },
  zone:        { type: String, default: 'B' },
  isInside:    { type: Boolean, default: false },
  lastEntry:   { type: Date },
  lastExit:    { type: Date },
  lastSeen:    { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now },
});

DeliverySchema.index({ plateNumber: 1 });

module.exports = mongoose.model('Delivery', DeliverySchema);
