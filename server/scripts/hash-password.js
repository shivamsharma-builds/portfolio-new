import crypto from "node:crypto";
const password = process.argv.slice(2).join(" ");
if (!password) {
  console.error('Usage: node server/scripts/hash-password.js "your-password"');
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
console.log(`scrypt$${salt}$${hash}`);
