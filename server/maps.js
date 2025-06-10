const axios = require("axios");
const dbService = require("./db");

class MapsService {
  static instance = null;
  baseUrl = "https://atlas.microsoft.com/route/directions/json";

  constructor() {
    // Singleton pattern
    this.subscriptionKey = process.env.AZURE_MAPS_KEY;
    if (!this.subscriptionKey) {
      throw new Error("Azure Maps subscription key not configured");
    }
  }

  static getInstance() {
    if (!MapsService.instance) {
      MapsService.instance = new MapsService();
    }
    return MapsService.instance;
  }

  async getDriveTime(startLat, startLon, endLat, endLon) {
    try {
      // Validate coordinates
      if (
        !startLat ||
        !startLon ||
        !endLat ||
        !endLon ||
        isNaN(startLat) ||
        isNaN(startLon) ||
        isNaN(endLat) ||
        isNaN(endLon)
      ) {
        throw new Error("Invalid coordinates provided");
      }

      // Check cache
      const cachedResponse = await dbService.getCachedRoute(
        startLat,
        startLon,
        endLat,
        endLon
      );
      if (cachedResponse) {
        const data = JSON.parse(cachedResponse);
        return data;
      }

      // Call Azure Maps API
      const response = await axios.get(this.baseUrl, {
        params: {
          "api-version": "1.0",
          "subscription-key": this.subscriptionKey,
          query: `${startLat},${startLon}:${endLat},${endLon}`,
          travelMode: "car",
          traffic: true,
          computeTravelTimeFor: "all",
        },
      });

      if (response.status !== 200) {
        throw new Error(
          `Azure Maps API returned status ${response.status}: ${JSON.stringify(
            response.data
          )}`
        );
      }

      // Cache the response
      response.data.routes.forEach((route) => {
        delete route.legs;
        delete route.sections;
      });
      const responseJson = JSON.stringify(response.data);
      await dbService.cacheRoute(
        startLat,
        startLon,
        endLat,
        endLon,
        responseJson
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching drive time:", error.message);
      throw new Error(`Failed to fetch drive time: ${error.message}`);
    }
  }
}

const mapsService = MapsService.getInstance();
module.exports = mapsService;
