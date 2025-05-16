const express = require("express");
const dbService = require("./db");

const router = express.Router();

// GET /api/hello endpoint
router.get("/hello", (req, res) => {
  console.log("GET /api/hello called");
  res.json({ message: "Hello from the API!" });
});

// POST /api/data endpoint
router.post("/data", (req, res) => {
  console.log("POST /api/data called with body:", req.body);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  res.json({ message: `Received data from ${name}` });
});

// GET /api/bonuses endpoint - New endpoint to return all bonus location data
router.get("/bonuses", async (req, res) => {
  try {
    console.log("GET /api/bonuses called");
    const bonusesJson = await dbService.getBonuses();
    const bonuses = JSON.parse(bonusesJson); // Parse the JSON string to an object
    res.json(bonuses); // Send the parsed array of bonus objects
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/legs endpoint - Returns all leg data
router.get("/legs", async (req, res) => {
  try {
    console.log("GET /api/legs called");
    const legsJson = await dbService.getLegs();
    const legs = JSON.parse(legsJson); // Parse the JSON string to an object
    res.json(legs); // Send the parsed array of leg objects
  } catch (error) {
    console.error("Error fetching legs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
