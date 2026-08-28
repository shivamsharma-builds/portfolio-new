import crypto from "node:crypto";
import { dbQuery } from "./db.js";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret === "change-me") {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured with a secure value.",
    );
  }

  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex"),
) {
  if (!password) {
    throw new Error("Password is required.");
  }

  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, expected] = String(stored || "").split("$");

  if (scheme !== "scrypt" || !salt || !expected || !password) {
    return false;
  }

  try {
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");

    const actualBuffer = Buffer.from(actual, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Create the admin user if it does not exist.
 * If it already exists, synchronize the password hash
 * from ADMIN_PASSWORD_HASH.
 */
export async function ensureAdminUser() {
  const email = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();

  if (!email || !passwordHash) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not configured.");

    return false;
  }

  const existing = await dbQuery(
    `
      SELECT id, email, password_hash
      FROM admin_users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  if (!existing.rowCount) {
    await dbQuery(
      `
        INSERT INTO admin_users
          (email, password_hash)
        VALUES
          ($1, $2)
      `,
      [email, passwordHash],
    );

    console.log(`Admin user created: ${email}`);

    return true;
  }

  const user = existing.rows[0];

  if (user.password_hash !== passwordHash) {
    await dbQuery(
      `
        UPDATE admin_users
        SET
          password_hash = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [passwordHash, user.id],
    );

    console.log(`Admin password updated: ${email}`);
  }

  return true;
}

/**
 * Authenticate an admin user.
 */
export async function authenticate(email, password) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const result = await dbQuery(
    `
      SELECT
        id,
        email,
        password_hash
      FROM admin_users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizedEmail],
  );

  if (!result.rowCount) {
    return null;
  }

  const user = result.rows[0];

  const valid = verifyPassword(password, user.password_hash);

  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Create a signed admin session cookie.
 */
export function setSession(res, user) {
  const payload = base64url(
    JSON.stringify({
      id: user.id,
      email: user.email,
      exp: Date.now() + MAX_AGE * 1000,
    }),
  );

  const signature = sign(payload);
  const token = `${payload}.${signature}`;

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; ` +
      `Path=/; ` +
      `HttpOnly; ` +
      `SameSite=Lax; ` +
      `Max-Age=${MAX_AGE}` +
      secure,
  );
}

/**
 * Clear the admin session cookie.
 */
export function clearSession(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; ` +
      `Path=/; ` +
      `HttpOnly; ` +
      `SameSite=Lax; ` +
      `Max-Age=0` +
      secure,
  );
}

/**
 * Read a cookie from the request.
 */
function getCookie(req, name) {
  const cookies = String(req.headers.cookie || "")
    .split(";")
    .map((value) => value.trim());

  const item = cookies.find((value) => value.startsWith(`${name}=`));

  if (!item) {
    return "";
  }

  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch {
    return "";
  }
}

/**
 * Validate and decode the admin session.
 */
export function getSession(req) {
  const token = getCookie(req, COOKIE);

  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  if (!payload || !signature) {
    return null;
  }

  try {
    const expectedSignature = sign(payload);

    const providedBuffer = Buffer.from(signature, "utf8");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!data || !data.id || !data.email || !data.exp) {
      return null;
    }

    if (Number(data.exp) <= Date.now()) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated admin.
 */
export function requireAuth(req, res) {
  const session = getSession(req);

  if (!session) {
    res.status(401).json({
      error: "Authentication required.",
    });

    return null;
  }

  return session;
}
