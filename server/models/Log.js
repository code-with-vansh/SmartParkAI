// ─── Log Model ────────────────────────────────────────────────────────────────
// Every ENTRY / EXIT event is stored as a log — auto-delete after 10 days
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  plateNumber:  { type: String, required: true, uppercase: true },
  action:       { type: String, enum: ['ENTRY', 'EXIT'], required: true },
  personName:   { type: String, default: 'Unknown' },
  personType:   { type: String, default: 'Unknown' }, // Member | Guest | Delivery | Other
  zone:         { type: String, default: 'B' },
  flatNumber:   { type: String, default: '' },
  plateImage:   { type: String, default: '' },  // Path to saved plate image
  confidence:   { type: Number, default: 0 },   // OCR confidence score
  createdAt:    { type: Date, default: Date.now },
});

// TTL index — MongoDB auto-deletes docs after 10 days
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10 * 24 * 60 * 60 });

module.exports = mongoose.model('Log', LogSchema);
