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

// Get budget by ID
router.get("/budget/:id", async (req, res) => {
  try {
    const budget = await dbService.getBudgetById(parseInt(req.params.id));
    if (budget) {
      res.json(budget);
    } else {
      res.status(404).json({ error: "Budget not found" });
    }
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
