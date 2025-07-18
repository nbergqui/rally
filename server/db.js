const sql = require("mssql");

class DatabaseService {
  static instance = null;
  pool = null;

  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
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

  constructor() {}

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
              BonusID,
              BonusCode,
              BonusName,
              Points,
              Latitude,
              Longitude,
              AvailableHours,
              Description,
              Leg,
              Ordinal,
              Include,
              Visited,
              LayoverMinutes
            FROM dbo.RallyBonuses 
            ORDER BY Leg, Ordinal
          `);
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
        SELECT LegId, Leg, CheckpointTime, StartTime
        FROM dbo.RallyLeg
        ORDER BY Leg
      `);
      return JSON.stringify(result.recordset);
    } catch (error) {
      console.error("Error fetching legs data:", error);
      throw error;
    }
  }

  async updateBonus(bonusCode, include, visited) {
    try {
      const pool = await this.getPool();
      const request = pool
        .request()
        .input("BonusCode", sql.NVarChar, bonusCode);

      let updateFields = [];
      let queryParams = { BonusCode: bonusCode };

      if (include !== undefined) {
        updateFields.push("Include = @Include");
        request.input("Include", sql.Bit, include);
        queryParams.Include = include;
      }
      if (visited !== undefined) {
        updateFields.push("Visited = @Visited");
        request.input("Visited", sql.Bit, visited);
        queryParams.Visited = visited;
      }

      if (updateFields.length === 0) {
        throw new Error("No fields to update");
      }

      const result = await request.query(`
        UPDATE dbo.RallyBonuses 
        SET ${updateFields.join(", ")}
        WHERE BonusCode = @BonusCode;
        SELECT 
              BonusID,
              BonusCode,
              BonusName,
              Points,
              Latitude,
              Longitude,
              AvailableHours,
              Description,
              Leg,
              Ordinal,
              Include,
              Visited,
              LayoverMinutes
        FROM dbo.RallyBonuses 
        WHERE BonusCode = @BonusCode
      `);

      if (result.recordset.length === 0) {
        throw new Error("Bonus not found");
      }
      return JSON.stringify(result.recordset[0]);
    } catch (error) {
      console.error("Error updating bonus:", error);
      throw error;
    }
  }

  async updateBonusLayoverMinutes(bonusCode, layoverMinutes) {
    try {
      const pool = await this.getPool();
      const request = pool
        .request()
        .input("BonusCode", sql.NVarChar, bonusCode)
        .input("LayoverMinutes", sql.Int, layoverMinutes);

      const result = await request.query(`
        UPDATE dbo.RallyBonuses 
        SET LayoverMinutes = @LayoverMinutes
        WHERE BonusCode = @BonusCode;
        SELECT 
          BonusID,
          BonusCode,
          BonusName,
          Points,
          Latitude,
          Longitude,
          AvailableHours,
          Description,
          Leg,
          Ordinal,
          Include,
          Visited,
          LayoverMinutes
        FROM dbo.RallyBonuses 
        WHERE BonusCode = @BonusCode
      `);

      if (result.recordset.length === 0) {
        throw new Error("Bonus not found");
      }

      return JSON.stringify(result.recordset[0]);
    } catch (error) {
      console.error("Error updating bonus layover minutes:", error);
      throw error;
    }
  }

  async updateBonusOrdinal(updates) {
    try {
      const pool = await this.getPool();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      const request = transaction.request();

      for (const update of updates) {
        await request
          .input(
            `BonusCode_${update.BonusCode}`,
            sql.NVarChar,
            update.BonusCode
          )
          .input(`Ordinal_${update.BonusCode}`, sql.Int, update.Ordinal).query(`
            UPDATE dbo.RallyBonuses 
            SET Ordinal = @Ordinal_${update.BonusCode}
            WHERE BonusCode = @BonusCode_${update.BonusCode}
          `);
      }

      const result = await request.query(`
            SELECT
              BonusID,
              BonusCode,
              BonusName,
              Points,
              Latitude,
              Longitude,
              AvailableHours,
              Description,
              Leg,
              Ordinal,
              Include,
              Visited,
              LayoverMinutes
            FROM dbo.RallyBonuses 
            WHERE BonusCode IN (${updates
              .map((u) => `'${u.BonusCode}'`)
              .join(",")})
            ORDER BY Ordinal
          `);
      await transaction.commit();
      return JSON.stringify(result.recordset);
    } catch (error) {
      console.error("Error updating bonus ordinals:", error);
      await transaction.rollback();
      throw error;
    }
  }

  async getIncludedBonusCoordinates(leg) {
    try {
      const pool = await this.getPool();
      const result = await pool.request().input("Leg", sql.Int, leg).query(`
          SELECT BonusCode, Latitude, Longitude
          FROM dbo.RallyBonuses
          WHERE Leg = @Leg AND Include = 1
          ORDER BY Ordinal
        `);
      return JSON.stringify(result.recordset);
    } catch (error) {
      console.error("Error fetching included bonus coordinates:", error);
      throw error;
    }
  }

  async getUnvisitedIncludedBonusCoordinates(leg) {
    try {
      const pool = await this.getPool();
      const result = await pool.request().input("Leg", sql.Int, leg).query(`
          SELECT BonusCode, Latitude, Longitude
          FROM dbo.RallyBonuses
          WHERE Leg = @Leg AND Include = 1 AND Visited = 0
          ORDER BY Ordinal
        `);
      return JSON.stringify(result.recordset);
    } catch (error) {
      console.error(
        "Error fetching unvisited included bonus coordinates:",
        error
      );
      throw error;
    }
  }

  async getCachedRoute(startLat, startLon, endLat, endLon) {
    try {
      const result = await this.query(
        `
        SELECT ResponseJson
        FROM dbo.RallyDirectionsCache
        WHERE StartLatitude = @StartLat
          AND StartLongitude = @StartLon
          AND EndLatitude = @EndLat
          AND EndLongitude = @EndLon
      `,
        {
          StartLat: Math.round(startLat * 1000000) / 1000000,
          StartLon: Math.round(startLon * 1000000) / 1000000,
          EndLat: endLat,
          EndLon: endLon,
        }
      );
      return result.recordset.length > 0
        ? result.recordset[0].ResponseJson
        : null;
    } catch (error) {
      console.error("Error fetching cached route:", error);
      throw error;
    }
  }

  async cacheRoute(startLat, startLon, endLat, endLon, responseJson) {
    startLat = Math.round(startLat * 1000000) / 1000000; // Round to 4 decimal places
    startLon = Math.round(startLon * 1000000) / 1000000; // Round to 4 decimal places

    try {
      await this.query(
        `
        IF NOT EXISTS (
          SELECT 1 FROM dbo.RallyDirectionsCache
          WHERE StartLatitude = @StartLat
            AND StartLongitude = @StartLon
            AND EndLatitude = @EndLat
            AND EndLongitude = @EndLon
        )
        INSERT INTO dbo.RallyDirectionsCache (
          StartLatitude,
          StartLongitude,
          EndLatitude,
          EndLongitude,
          ResponseJson
        )
        VALUES (
          @StartLat,
          @StartLon,
          @EndLat,
          @EndLon,
          @ResponseJson
        )
      `,
        {
          StartLat: startLat,
          StartLon: startLon,
          EndLat: endLat,
          EndLon: endLon,
          ResponseJson: responseJson,
        }
      );
    } catch (error) {
      if (error.message.includes("Violation of PRIMARY KEY constraint")) {
        console.log(
          `Cache insert skipped for ${startLat},${startLon} to ${endLat},${endLon}: already exists`
        );
        return; // Ignore duplicate key errors
      }
      console.error("Error caching route:", error);
      throw error;
    }
  }
}

const dbService = DatabaseService.getInstance();
module.exports = dbService;
