# 🚗 Smart Park AI — Parking Management System

A production-grade AI-based parking management system with real-time ANPR (Automatic Number Plate Recognition), live video detection, zone management, and a modern SaaS dashboard.

---

## 📁 Project Structure

```
smartpark/
├── client/           ← React + Vite + Tailwind CSS (Frontend)
├── server/           ← Node.js + Express + MongoDB (Backend API)
├── ai/               ← Python + OpenCV + EasyOCR (AI Module)
│   ├── detector/
│   │   ├── main.py       ← Main ANPR loop + Flask frame server
│   │   └── anpr.py       ← Plate detection + OCR logic
│   ├── simulator.py      ← Test without camera
│   ├── detected_plates/  ← Saved plate images
│   └── requirements.txt
└── README.md
```

---

## ⚙️ Prerequisites

| Tool    | Version | Install                                    |
| ------- | ------- | ------------------------------------------ |
| Node.js | 18+     | https://nodejs.org                         |
| MongoDB | 6+      | https://mongodb.com/try/download/community |
| Python  | 3.9+    | https://python.org                         |
| pip     | latest  | bundled with Python                        |

---

## 🚀 Quick Start (Step by Step)

### Step 1 — Clone / Open Project

```bash
cd smartpark
```

### Step 2 — Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### Step 3 — Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### Step 4 — Install Python AI Dependencies

```bash
cd ai
pip install -r requirements.txt
cd ..
```

> **Note:** EasyOCR downloads ~300MB of model files on first run. This is normal.

### Step 5 — Start MongoDB

Make sure MongoDB is running locally on the default port (27017).

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu / Linux
sudo systemctl start mongod

# Windows — MongoDB runs as a service after installation
```

### Step 6 — Seed the Database (sample members + settings)

```bash
cd server
node seed.js
cd ..
```

You should see 7 sample members added with their plate numbers.

### Step 7 — Start the Backend Server

```bash
cd server
npm run dev
```

Server runs at: **http://localhost:5000**

### Step 8 — Start the Frontend

Open a **new terminal**:

```bash
cd client
npm run dev
```

Dashboard runs at: **http://localhost:3000**

### Step 9 — Start the AI Module (or Simulator)

Open a **third terminal**:

**Option A — Real camera / video:**

```bash
cd ai
python detector/main.py                          # Webcam (default)
python detector/main.py --source video --path sample.mp4
python detector/main.py --source ip --url http://192.168.1.100:8080/video
```

**Option B — Simulator (no camera needed):**

```bash
cd ai
python simulator.py                   # Sends sample plates every 3s
python simulator.py --interval 5      # Every 5 seconds
python simulator.py --count 20        # Send exactly 20 plates
python simulator.py --plate MH12AB1234,KA05GH3456   # Specific plates
python simulator.py --random          # Fully random plates

python simulator.py --random --interval 6 --count 5
```

---

## 🎯 How It Works

### Detection Flow

```
Camera / Video
      ↓
OpenCV reads frames
      ↓
Contour detection OR YOLO finds plate regions
      ↓
EasyOCR reads plate text
      ↓
POST /api/detect  →  Backend
      ↓
  ┌─ Known plate? → ENTRY / EXIT logged
  └─ Unknown?    → Frontend popup appears
                   User fills form → ENTRY logged
```

### Entry / Exit Logic

- **First detection** of a plate → `ENTRY` event
- **Same plate after leaving** → `EXIT` event
- **Duplicate within window** → Ignored (configurable, default 10s)

### Zone Assignment

| Zone   | Who                      | Auto-assigned |
| ------ | ------------------------ | ------------- |
| Zone A | Members                  | ✅ Yes        |
| Zone B | Guests, Delivery, Others | ✅ Yes        |

---

## 🗄️ Database Collections

| Collection | Auto-delete            |
| ---------- | ---------------------- |
| Members    | Never                  |
| Guests     | 7 days after last seen |
| Delivery   | 7 days after last seen |
| Logs       | 10 days (TTL index)    |
| Settings   | Never (single doc)     |

---

## 🔗 API Reference

| Method              | Route                  | Description                           |
| ------------------- | ---------------------- | ------------------------------------- |
| POST                | `/api/detect`          | AI posts plate detection              |
| POST                | `/api/detect/register` | Register unknown vehicle              |
| GET/POST/PUT/DELETE | `/api/members`         | Member CRUD                           |
| GET/POST/PUT/DELETE | `/api/guests`          | Guest CRUD                            |
| GET/POST/PUT/DELETE | `/api/delivery`        | Delivery CRUD                         |
| GET                 | `/api/logs`            | All logs (query: ?action=ENTRY\|EXIT) |
| GET                 | `/api/logs/latest`     | Last 20 events                        |
| GET                 | `/api/zones`           | Zone A + B occupancy                  |
| GET                 | `/api/stats`           | Dashboard stats                       |
| GET/PUT             | `/api/settings`        | System settings                       |
| GET                 | `/api/health`          | Health check                          |

---

## 🎨 Dashboard Pages

| Page           | Path                   | Description                             |
| -------------- | ---------------------- | --------------------------------------- |
| Dashboard      | `/dashboard`           | Stats + live feed                       |
| Live Detection | `/live`                | Camera preview + detections             |
| Zone Overview  | `/zones`               | A/B occupancy with progress bars        |
| Entry Logs     | `/logs/entry`          | All entries, searchable                 |
| Exit Logs      | `/logs/exit`           | All exits, searchable                   |
| Members        | `/management/members`  | Add/edit/delete members                 |
| Guests         | `/management/guests`   | Guest records                           |
| Delivery       | `/management/delivery` | Delivery vehicles                       |
| Other          | `/management/other`    | Plumbers, electricians etc.             |
| Settings       | `/settings`            | Zone capacity, camera, intervals, theme |

---

## 🧠 ANPR Module Details

### Detection Methods

**Contour-based (default, no GPU required):**

- Bilateral filter + Canny edge detection
- Contour approximation to 4-point polygon
- Aspect ratio filtering (1.5:1 to 6:1)

**YOLO (optional, faster + more accurate):**

- Set `USE_YOLO = True` in `ai/detector/anpr.py`
- Install: `pip install ultralytics`
- Works best with a dedicated licence plate detection model

### OCR

- EasyOCR with English language model
- Pre-processing: 2x upscale + Otsu threshold
- Minimum confidence: 20% (configurable)

### Frame Server

The AI module starts a Flask server on port **5001** that serves the latest annotated frame as a JPEG image at `/frame`. The frontend polls this every 1 second to display the live feed.

---

## ⚙️ Settings (configurable from UI)

| Setting            | Default | Description                        |
| ------------------ | ------- | ---------------------------------- |
| Zone A Capacity    | 50      | Total slots for members            |
| Zone B Capacity    | 30      | Total slots for guests/others      |
| Camera Source      | webcam  | webcam / ip / video                |
| IP Camera URL      | —       | http://... or rtsp://...           |
| Detection Interval | 2s      | How often AI processes a frame     |
| Duplicate Window   | 10s     | Ignore same plate within N seconds |
| Theme              | light   | light / dark                       |

---

## 🐛 Troubleshooting

**MongoDB connection error:**

- Ensure MongoDB is running: `mongod --version`
- Check URI in `server/.env`

**EasyOCR first run is slow:**

- Normal — it downloads ~300MB of CRAFT + recognition models once

**Camera feed not showing:**

- Ensure `python detector/main.py` is running
- Check port 5001 is not blocked
- Use the simulator for testing without camera

**Unknown vehicle popup not appearing:**

- Use the simulator with a plate NOT in your Members DB
- Or manually POST to `/api/detect` with an unknown plate

**YOLO not loading:**

- Comment out YOLO lines in `anpr.py` or set `USE_YOLO = False`
- The contour fallback always works

---

## 📦 Sample Plate Numbers (seeded members)

These plates are pre-registered in the database after running `node seed.js`:

```
MH12AB1234  →  Arjun Sharma    (A-101)
MH01CD5678  →  Priya Nair      (A-102)
MH04EF9012  →  Rahul Mehta     (B-201)
KA05GH3456  →  Sunita Joshi    (B-202)
DL07IJ7890  →  Vikram Patel    (C-301)
TN09KL2345  →  Meena Krishnan  (C-302)
PB22WX5791  →  Amit Verma      (D-401)
```

Any other plate triggers the **Unknown Vehicle popup**.

---

## 🔒 License

MIT — Free to use and modify.

<!-- ! DELETE ALL ENTRY/EXIT LOGS -->

CMD
-mongosh
-use smartpark
-db.logs.deleteMany({})
-exit
