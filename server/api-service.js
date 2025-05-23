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

// GET /api/bonuses endpoint - Returns all bonus location data
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

// PATCH /api/bonuses/ordinal endpoint - Updates Ordinal for multiple bonuses
router.patch("/bonuses/ordinal", async (req, res) => {
  try {
    console.log(
      `PATCH /api/bonuses/ordinal called with body:`,
      JSON.stringify(req.body, null, 2)
    );
    const updates = req.body;
    if (
      !Array.isArray(updates) ||
      updates.some((u) => !u.BonusCode || typeof u.Ordinal !== "number")
    ) {
      return res.status(400).json({
        error:
          "Updates must be an array of { BonusCode: string, Ordinal: number }",
      });
    }
    const bonusesJson = await dbService.updateBonusOrdinal(updates);
    const bonuses = JSON.parse(bonusesJson); // Parse the JSON string to an array
    res.json(bonuses); // Send the updated bonuses
  } catch (error) {
    console.error("Error updating bonus ordinals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/bonuses/:bonusCode endpoint - Updates the Include flag
router.patch("/bonuses/:bonusCode", async (req, res) => {
  try {
    console.log(
      `PATCH /api/bonuses/${req.params.bonusCode} called with body:`,
      JSON.stringify(req.body, null, 2)
    );
    const { Include } = req.body;
    if (typeof Include !== "boolean") {
      return res.status(400).json({ error: "Include must be a boolean" });
    }
    const bonusJson = await dbService.updateBonusInclude(
      req.params.bonusCode,
      Include
    );
    const bonus = JSON.parse(bonusJson); // Parse the JSON string to an object
    res.json(bonus); // Send the updated bonus object
  } catch (error) {
    console.error("Error updating bonus:", error);
    if (error.message === "Bonus not found") {
      return res.status(404).json({ error: "Bonus not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
