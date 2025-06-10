const express = require("express");
const dbService = require("./db");
const mapsService = require("./maps");
const router = express.Router();

// GET /api/hello endpoint
router.get("/hello", (req, res) => {
  res.json({ message: "Hello from the API!" });
});

// POST /api/data endpoint
router.post("/data", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  res.json({ message: `Received data from ${name}` });
});

// GET /api/bonuses endpoint - Returns all bonus location data
router.get("/bonuses", async (req, res) => {
  try {
    const bonusesJson = await dbService.getBonuses();
    const bonuses = JSON.parse(bonusesJson);
    res.json(bonuses);
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/legs endpoint - Returns all leg data
router.get("/legs", async (req, res) => {
  try {
    const legsJson = await dbService.getLegs();
    const legs = JSON.parse(legsJson);
    res.json(legs);
  } catch (error) {
    console.error("Error fetching legs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/bonuses/ordinal endpoint - Updates Ordinal for multiple bonuses
router.patch("/bonuses/ordinal", async (req, res) => {
  try {
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
    const bonuses = JSON.parse(bonusesJson);
    res.json(bonuses);
  } catch (error) {
    console.error("Error updating bonus ordinals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/bonuses/:bonusCode endpoint - Updates the Include or Visited flag
router.patch("/bonuses/:bonusCode", async (req, res) => {
  try {
    const { Include, Visited } = req.body;
    if (Include === undefined && Visited === undefined) {
      return res
        .status(400)
        .json({ error: "Include or Visited must be provided" });
    }
    if (Include !== undefined && typeof Include !== "boolean") {
      return res.status(400).json({ error: "Include must be a boolean" });
    }
    if (Visited !== undefined && typeof Visited !== "boolean") {
      return res.status(400).json({ error: "Visited must be a boolean" });
    }

    const bonusJson = await dbService.updateBonus(
      req.params.bonusCode,
      Include,
      Visited
    );
    const bonus = JSON.parse(bonusJson);
    res.json(bonus);
  } catch (error) {
    console.error("Error updating bonus:", error);
    if (error.message === "Bonus not found") {
      return res.status(404).json({ error: "Bonus not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/routes endpoint - Calculates drive time and distance between included bonuses
router.post("/routes", async (req, res) => {
  try {
    const { leg } = req.body;
    if (!leg || typeof leg !== "number") {
      return res.status(400).json({ error: "Leg must be a number" });
    }

    const coordinatesJson = await dbService.getIncludedBonusCoordinates(leg);
    const coordinates = JSON.parse(coordinatesJson);
    if (coordinates.length < 2) {
      return res.json([]); // No routes possible with fewer than 2 bonuses
    }

    const routes = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];

      // Validate coordinates
      if (
        !start.Latitude ||
        !start.Longitude ||
        !end.Latitude ||
        !end.Longitude ||
        isNaN(start.Latitude) ||
        isNaN(start.Longitude) ||
        isNaN(end.Latitude) ||
        isNaN(end.Longitude)
      ) {
        console.warn(
          `Invalid coordinates for route from ${start.BonusCode} to ${end.BonusCode}`
        );
        continue; // Skip invalid coordinates
      }

      // Get drive time and check cache
      const data = await mapsService.getDriveTime(
        start.Latitude,
        start.Longitude,
        end.Latitude,
        end.Longitude
      );

      const travelTimeSeconds = data.routes[0].summary.travelTimeInSeconds;
      const distanceMiles = data.routes[0].summary.lengthInMeters / 1609.34; // Convert meters to miles

      routes.push({
        fromBonusCode: start.BonusCode,
        toBonusCode: end.BonusCode,
        distanceMiles: Number(distanceMiles.toFixed(2)),
        travelTimeMinutes: Number((travelTimeSeconds / 60).toFixed(2)),
      });
    }

    res.json(routes);
  } catch (error) {
    console.error("Error calculating routes:", error.message);
    res.status(500).json({ error: "Failed to calculate routes" });
  }
});

module.exports = router;
