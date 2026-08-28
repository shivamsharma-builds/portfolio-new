import { initializeDatabase } from "../server/lib/db.js";

export default async function handler(_req, res) {
  try {
    await initializeDatabase();
    return res
      .status(200)
      .json({
        status: "ok",
        service: "portfolio-api",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error("Health check failed:", error);
    return res
      .status(503)
      .json({
        status: "degraded",
        service: "portfolio-api",
        database: "disconnected",
        error: error?.message || "Database connection failed",
        timestamp: new Date().toISOString(),
      });
  }
}
