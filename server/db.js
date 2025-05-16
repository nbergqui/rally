// server/db.js
const sql = require("mssql");

class DatabaseService {
  static instance = null;
  pool = null;

  config = {
    user: process.env.DB_USER || "yantp_sa",
    password: process.env.DB_PASSWORD || "Cjoav&#s53E3yAw2",
    server: process.env.DB_SERVER || "yantp.database.windows.net",
    database: process.env.DB_NAME || "Budget",
    port: 1433,
    options: {
      encrypt: true, // Required for Azure
      trustServerCertificate: false,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
  };

  constructor() {
    // Singleton pattern
  }

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect() {
    try {
      if (!this.pool) {
        this.pool = await new sql.ConnectionPool(this.config).connect();
        console.log("Database connection established");
      }
    } catch (error) {
      console.error("Database connection error:", error);
      throw error;
    }
  }

  async getPool() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool;
  }

  async query(query, params = {}) {
    try {
      const pool = await this.getPool();
      const request = pool.request();
      for (const key in params) {
        request.input(key, params[key]);
      }
      return await request.query(query);
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error("Error closing connection:", error);
      throw error;
    }
  }

  async getBonuses() {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query(`
          SELECT 
            BonusCode,
            Points,
            BonusName,
            StreetAddress,
            City,
            State,
            Latitude,
            Longitude,
            AvailableHours,
            Description,
            Requirements,
            Leg,
            Ordinal,
            Include,
            Visited
          FROM dbo.RallyBonuses 
          ORDER BY Leg, Ordinal
        `);

      // Return the full recordset as JSON string
      return JSON.stringify(result.recordset);
    } catch (error) {
      console.error("Error fetching bonus location data:", error);
      throw error;
    }
  }

  async getLegs() {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query(`
        SELECT LegId, Leg, CheckpointTime
        FROM dbo.RallyLeg
        ORDER BY Leg
      `);
      return JSON.stringify(result.recordset);
    } catch (error) {
      console.error("Error fetching legs data:", error);
      throw error;
    }
  }
}

const dbService = DatabaseService.getInstance();
module.exports = dbService;
