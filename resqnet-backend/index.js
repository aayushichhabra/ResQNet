require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 2. DATABASE CONNECTION ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection
pool
  .connect()
  .then(() => console.log("✅ Connected to Supabase PostgreSQL"))
  .catch((err) => console.error("❌ Database Connection Error:", err));

// --- 🤖 ADVANCED AI LOGIC: MULTI-RESOURCE PREDICTION ---
const calculateResources = (reports) => {
  // 1. Filter: Only look at Active or Pending reports
  const activeReports = reports.filter((r) => r.status !== "Resolved");
  const totalVolume = activeReports.length;

  // Base case: No active incidents
  if (totalVolume === 0) return { ambulances: 0, fire_vans: 0, volunteers: 0 };

  // 2. Cluster Analysis (Spatial Spread)
  // We treat locations that are identical (to 3 decimal places) as one "site"
  const distinctLocations = new Set(
    activeReports.map(
      (r) =>
        `${Number(r.latitude).toFixed(3)},${Number(r.longitude).toFixed(3)}`,
    ),
  );
  const spread = distinctLocations.size;

  // 3. Fire Specific Analysis
  // Count reports that specifically mention "Fire", "Smoke", or "Blast"
  const fireReports = activeReports.filter(
    (r) =>
      (r.type && r.type.toLowerCase().includes("fire")) ||
      (r.details && r.details.toLowerCase().includes("fire")) ||
      (r.type && r.type.toLowerCase().includes("smoke")) ||
      (r.type && r.type.toLowerCase().includes("blast")),
  ).length;

  // --- PREDICTION FORMULAS ---

  // A. Ambulances: Needed for almost everything
  // Formula: (Volume * 0.3) + (Spread * 0.5) + 1 Base
  let ambulances = totalVolume * 0.3 + spread * 0.5 + 1;

  // B. Fire Vans: Only needed if Fire detected
  // Formula: High weight on fire reports (0.4) + Spread (0.6) + 1 Base if fire exists
  let fireVans = 0;
  if (fireReports > 0) {
    fireVans = fireReports * 0.4 + spread * 0.6 + 1;
  }

  // C. Volunteer Groups: General Support
  // Formula: 1 Support Team for every 4 incidents
  let volunteers = Math.ceil(totalVolume / 4);

  return {
    ambulances: Math.round(ambulances),
    fire_vans: Math.round(fireVans),
    volunteers: volunteers,
  };
};

// --- 3. API ROUTES ---

// A. GET REPORTS (Fetching data for the map)
app.get("/api/reports", async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        type, 
        status, 
        created_at,
        details as description,  
        latitude as lat,         
        longitude as lng         
      FROM reports 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// B. CREATE REPORT (Saving new simulation or real report)
app.post("/api/reports", async (req, res) => {
  const { type, status, description, lat, lng } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO reports (type, status, details, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [type, status, description, lat, lng],
    );

    const savedReport = result.rows[0];
    res.json({
      ...savedReport,
      description: savedReport.details,
      lat: savedReport.latitude,
      lng: savedReport.longitude,
    });
    console.log(`✅ New Report Created: ${type}`);
  } catch (err) {
    console.error("Create Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// C. UPDATE STATUS (Marking Resolved)
app.put("/api/reports/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      "UPDATE reports SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    console.log(`✅ Report #${id} updated to: ${status}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Error:", err.message);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// D. AUTOMATED AI PREDICTION ROUTE (GET)
app.get("/api/ai-predict", async (req, res) => {
  try {
    // 1. Fetch ALL data from DB to analyze it
    const result = await pool.query("SELECT * FROM reports");

    // 2. Run the Multi-Resource AI Calculation
    const predictions = calculateResources(result.rows);

    // 3. Send result object to frontend
    res.json({
      active_incidents: result.rows.filter((r) => r.status !== "Resolved")
        .length,
      predictions: predictions, // Returns { ambulances, fire_vans, volunteers }
    });

    console.log(`🤖 AI Prediction:`, predictions);
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI Calculation Failed" });
  }
});

// --- 4. START SERVER ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
