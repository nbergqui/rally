const express = require("express");
const path = require("path");
const apiService = require("./api-service"); // Import the API service
const app = express();
const port = process.env.PORT || 3000;

console.log("Starting Express server...");

// Middleware to parse JSON bodies
app.use(express.json());

// Mount the API service at /api
app.use("/api", apiService);

// Serve static files from the browser folder (Angular app)
app.use(express.static(path.join(__dirname, "../browser")));

app.get("/health", (req, res) => {
  res.send("Express is running!");
});

// Send all requests to index.html
app.get("*", (req, res) => {
  console.log("Request received:", req.url);
  res.sendFile(path.join(__dirname, "../browser/index.html"), (err) => {
    if (err) {
      console.error("Error sending file:", err);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
