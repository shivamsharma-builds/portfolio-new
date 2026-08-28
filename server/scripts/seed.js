import "dotenv/config";
import { seedContent } from "../seed.js";
import { ensureAdminUser } from "../lib/auth.js";
import { initializeDatabase } from "../lib/db.js";
await initializeDatabase();
await ensureAdminUser();
await seedContent();
console.log("Aiven PostgreSQL content seed complete.");
process.exit(0);
