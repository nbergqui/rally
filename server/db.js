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

  async getBudgetById(id) {
    try {
      const pool = await this.getPool();
      const result = await pool
        .request()
        .input("id", sql.BigInt, id)
        .query(
          "SELECT Id as id, Name as name, Amount as amount, CreateDate as createDate, ModifiedDate as modifiedDate, [Key] as [key], Type as type FROM dbo.Budgets WHERE Id = @id"
        );
      return result.recordset[0] || null;
    } catch (error) {
      console.error("Error fetching budget by ID:", error);
      throw error;
    }
  }
}

const dbService = DatabaseService.getInstance();
module.exports = dbService;
