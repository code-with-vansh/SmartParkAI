// ─── Smart Park AI - Backend Server ───────────────────────────────────────────
// Entry point: starts Express, connects MongoDB, registers routes, runs cron jobs

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve saved plate images as static files
app.use('/plates', express.static(__dirname + '/../ai/detected_plates'));

// ── Connect to MongoDB ──────────────────────────────────────────────────────
connectDB();

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/detect',   require('./routes/detect'));
app.use('/api/members',  require('./routes/members'));
app.use('/api/guests',   require('./routes/guests'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/logs',     require('./routes/logs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/zones',    require('./routes/zones'));
app.use('/api/stats',    require('./routes/stats'));

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Cron Jobs ────────────────────────────────────────────────────────────────
// Run cleanup every day at midnight
cron.schedule('0 0 * * *', async () => {
  const Log = require('./models/Log');
  const Guest = require('./models/Guest');
  const Delivery = require('./models/Delivery');

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Delete logs older than 10 days
  const logResult = await Log.deleteMany({ createdAt: { $lt: tenDaysAgo } });
  console.log(`[Cron] Deleted ${logResult.deletedCount} old logs`);

  // Delete guests/delivery older than 7 days after their last exit
  const guestResult = await Guest.deleteMany({ lastSeen: { $lt: sevenDaysAgo } });
  const delivResult = await Delivery.deleteMany({ lastSeen: { $lt: sevenDaysAgo } });
  console.log(`[Cron] Deleted ${guestResult.deletedCount} old guests, ${delivResult.deletedCount} old deliveries`);
});

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚗 Smart Park AI Server running on http://localhost:${PORT}`);
  console.log(`📦 MongoDB: ${process.env.MONGODB_URI}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
});
