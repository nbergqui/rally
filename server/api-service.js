const express = require("express");
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

module.exports = router;
