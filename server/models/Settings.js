// ─── Settings Model ───────────────────────────────────────────────────────────
// Single document — stores all system configuration
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Zone capacities
  zoneACapacity:       { type: Number, default: 50 },
  zoneBCapacity:       { type: Number, default: 30 },

  // Camera settings
  cameraSource:        { type: String, default: 'webcam' }, // webcam | ip | video
  ipCameraUrl:         { type: String, default: 'http://192.168.1.100:8080/video' },
  videoFilePath:       { type: String, default: 'sample.mp4' },

  // Detection settings
  detectionInterval:   { type: Number, default: 2 },   // seconds between detections
  duplicateWindow:     { type: Number, default: 10 },  // seconds to ignore same plate

  // UI settings
  theme:               { type: String, default: 'light' }, // light | dark

  updatedAt:           { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
