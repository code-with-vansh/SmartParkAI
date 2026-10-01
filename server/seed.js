// ─── seed.js ──────────────────────────────────────────────────────────────────
// Run this once to populate the DB with sample members and settings.
// Usage: node seed.js

const mongoose = require('mongoose');
require('dotenv').config();

const Member   = require('./models/Member');
const Settings = require('./models/Settings');

const SAMPLE_MEMBERS = [
  { name: 'Arjun Sharma',    flatNumber: 'A-101', mobile: '9876543210', plateNumber: 'MH12AB1234', vehicleType: 'Car',  zone: 'A' },
  { name: 'Priya Nair',      flatNumber: 'A-102', mobile: '9876543211', plateNumber: 'MH01CD5678', vehicleType: 'SUV',  zone: 'A' },
  { name: 'Rahul Mehta',     flatNumber: 'B-201', mobile: '9876543212', plateNumber: 'MH04EF9012', vehicleType: 'Bike', zone: 'A' },
  { name: 'Sunita Joshi',    flatNumber: 'B-202', mobile: '9876543213', plateNumber: 'KA05GH3456', vehicleType: 'Car',  zone: 'A' },
  { name: 'Vikram Patel',    flatNumber: 'C-301', mobile: '9876543214', plateNumber: 'DL07IJ7890', vehicleType: 'Car',  zone: 'A' },
  { name: 'Meena Krishnan',  flatNumber: 'C-302', mobile: '9876543215', plateNumber: 'TN09KL2345', vehicleType: 'Car',  zone: 'A' },
  { name: 'Amit Verma',      flatNumber: 'D-401', mobile: '9876543216', plateNumber: 'PB22WX5791', vehicleType: 'Car',  zone: 'A' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Member.deleteMany({});
    console.log('🗑  Cleared members collection');

    // Insert sample members
    const members = await Member.insertMany(SAMPLE_MEMBERS);
    console.log(`✅ Inserted ${members.length} sample members`);
    members.forEach(m => console.log(`   ${m.plateNumber}  →  ${m.name} (${m.flatNumber})`));

    // Create default settings
    await Settings.deleteMany({});
    await Settings.create({
      zoneACapacity:     50,
      zoneBCapacity:     30,
      cameraSource:      'webcam',
      detectionInterval: 2,
      duplicateWindow:   10,
      theme:             'light',
    });
    console.log('✅ Default settings created');

    console.log('\n🎉 Seeding complete! You can now run the simulator.');
    console.log('   cd ai && python simulator.py\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
