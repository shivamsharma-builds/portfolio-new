import { dbQuery, initializeDatabase } from "./lib/db.js";
import {
  authenticate,
  clearSession,
  ensureAdminUser,
  requireAuth,
  setSession,
} from "./lib/auth.js";
import { clean, isValidEmail, jsonBody } from "./lib/http.js";
import {
  sendContactEmails,
  sendSubscriberConfirmation,
  notifyOwnerOfSubscriber,
} from "./email.js";
import { seedContent } from "./seed.js";

export async function publicSite(_req, res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  await initializeDatabase();
  // Seed only empty tables. Never overwrite content after an admin edit.
  await seedContent(false);
  const settings = await dbQuery("SELECT data FROM site_settings WHERE id = 1");
  const items = await dbQuery(
    "SELECT section, id, data FROM content_items ORDER BY section, position, id",
  );
  const result = {
    settings: settings.rows[0]?.data || {},
    socials: [],
    navLinks: [],
    stats: [],
    skills: [],
    additionalSkills: [],
    education: [],
    experience: [],
    projects: [],
    certificates: [],
  };
  for (const row of items.rows)
    if (result[row.section])
      result[row.section].push(
        row.data && typeof row.data === "object" && !Array.isArray(row.data)
          ? { id: row.id, ...row.data }
          : { id: row.id, value: row.data },
      );
  return res.json(result);
}

export async function adminLogin(req, res) {
  await initializeDatabase();
  await ensureAdminUser();
  const body = jsonBody(req);
  const email = clean(body.email, 200).toLowerCase();
  const password = String(body.password || "");
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });
  const user = await authenticate(email, password);
  if (!user)
    return res.status(401).json({ error: "Invalid admin credentials." });
  setSession(res, user);
  return res.json({ user: { id: user.id, email: user.email } });
}

export async function adminLogout(_req, res) {
  clearSession(res);
  return res.json({ success: true });
}

export async function adminMe(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  return res.json({ user: { id: session.id, email: session.email } });
}

export async function adminContent(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  await initializeDatabase();
  const body = jsonBody(req);
  const section = clean(body.section, 80);
  const allowed = new Set([
    "socials",
    "navLinks",
    "stats",
    "skills",
    "additionalSkills",
    "education",
    "experience",
    "projects",
    "certificates",
  ]);
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    const settings = await dbQuery(
      "SELECT data FROM site_settings WHERE id = 1",
    );
    const items = await dbQuery(
      "SELECT id, section, position, data, created_at, updated_at FROM content_items ORDER BY section, position, id",
    );
    return res.json({
      settings: settings.rows[0]?.data || {},
      items: items.rows,
    });
  }
  if (req.method === "PUT" && section === "settings") {
    const data = body.data && typeof body.data === "object" ? body.data : {};
    await dbQuery(
      `INSERT INTO site_settings (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(data)],
    );
    return res.json({ success: true });
  }
  if (!allowed.has(section))
    return res.status(400).json({ error: "Invalid content section." });

  if (req.method === "POST") {
    const data =
      body.data && typeof body.data === "object" ? body.data : body.data;
    const position = Number.isFinite(Number(body.position))
      ? Number(body.position)
      : 999999;
    const result = await dbQuery(
      "INSERT INTO content_items (section, position, data) VALUES ($1, $2, $3::jsonb) RETURNING id, section, position, data",
      [section, position, JSON.stringify(data)],
    );
    return res.status(201).json(result.rows[0]);
  }
  if (req.method === "PATCH") {
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: "Item id is required." });
    if (!Object.prototype.hasOwnProperty.call(body, "data"))
      return res.status(400).json({ error: "Item data is required." });
    const position = body.position == null ? null : Number(body.position);
    if (position !== null && !Number.isInteger(position))
      return res.status(400).json({ error: "Position must be an integer." });
    const result = await dbQuery(
      "UPDATE content_items SET data = $1::jsonb, position = COALESCE($2, position), updated_at = NOW() WHERE id = $3 AND section = $4 RETURNING id, section, position, data",
      [JSON.stringify(body.data), position, id, section],
    );
    if (!result.rowCount)
      return res.status(404).json({ error: "Item not found." });
    return res.json(result.rows[0]);
  }
  if (req.method === "DELETE") {
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: "Item id is required." });
    const result = await dbQuery(
      "DELETE FROM content_items WHERE id = $1 AND section = $2 RETURNING id",
      [id, section],
    );
    if (!result.rowCount)
      return res.status(404).json({ error: "Item not found." });
    await dbQuery(
      "WITH ordered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) - 1 AS new_position FROM content_items WHERE section = $1) UPDATE content_items c SET position = ordered.new_position, updated_at = NOW() FROM ordered WHERE c.id = ordered.id",
      [section],
    );
    return res.json({ success: true });
  }
  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}

export async function adminMessages(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  await initializeDatabase();
  if (req.method === "GET")
    return res.json(
      (
        await dbQuery(
          "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500",
        )
      ).rows,
    );
  if (req.method === "DELETE") {
    const id = Number(jsonBody(req).id);
    await dbQuery("DELETE FROM contact_messages WHERE id = $1", [id]);
    return res.json({ success: true });
  }
  return res.status(405).json({ error: "Method not allowed." });
}

export async function adminSubscribers(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  await initializeDatabase();
  if (req.method === "GET")
    return res.json(
      (
        await dbQuery(
          "SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 500",
        )
      ).rows,
    );
  if (req.method === "DELETE") {
    const id = Number(jsonBody(req).id);
    await dbQuery("DELETE FROM subscribers WHERE id = $1", [id]);
    return res.json({ success: true });
  }
  return res.status(405).json({ error: "Method not allowed." });
}

export async function contact(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });
  const body = jsonBody(req);
  if (clean(body.website, 200))
    return res
      .status(200)
      .json({
        success: true,
        message: "Thanks! Your message has been received.",
        confirmationEmailSent: false,
      });
  const name = clean(body.name, 100),
    email = clean(body.email, 200).toLowerCase(),
    subject = clean(body.subject, 200),
    message = clean(body.message, 5000);
  if (!name || !email || !message)
    return res
      .status(400)
      .json({ error: "Name, email and message are required." });
  if (!isValidEmail(email))
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  await initializeDatabase();
  let emailSent = false;
  let emailStatus = { visitor: false, owner: false };
  try {
    const result = await sendContactEmails({ name, email, subject, message });
    emailStatus = result.status;
    emailSent = emailStatus.visitor && emailStatus.owner;
  } catch (error) {
    console.error("Resend contact email failed:", error.message);
  }
  const saved = await dbQuery(
    "INSERT INTO contact_messages (name, email, subject, message, email_sent) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [name, email, subject, message, emailSent],
  );
  return res
    .status(201)
    .json({
      success: true,
      id: saved.rows[0].id,
      confirmationEmailSent: emailStatus.visitor,
      ownerNotificationSent: emailStatus.owner,
      emailStatus,
      message: emailSent
        ? "Thanks! Your message has been received and confirmation emails have been sent."
        : emailStatus.visitor
          ? "Thanks! Your message has been received. Your confirmation was sent; the owner notification could not be delivered."
          : "Thanks! Your message has been received. Email delivery is not configured yet.",
    });
}

export async function subscribe(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed." });
  const body = jsonBody(req);
  const name = clean(body.name, 100);
  const email = clean(body.email, 200).toLowerCase();
  if (!isValidEmail(email))
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  await initializeDatabase();
  const existing = await dbQuery(
    "SELECT id FROM subscribers WHERE email = $1",
    [email],
  );
  if (existing.rowCount)
    return res
      .status(200)
      .json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed.",
      });
  let confirmationSent = false;
  let ownerNotificationSent = false;
  try {
    await sendSubscriberConfirmation({ name, email });
    confirmationSent = true;
  } catch (error) {
    console.error("Resend subscriber confirmation failed:", error.message);
  }
  try {
    await notifyOwnerOfSubscriber({ name, email });
    ownerNotificationSent = true;
  } catch (error) {
    console.error(
      "Resend subscriber owner notification failed:",
      error.message,
    );
  }
  await dbQuery(
    "INSERT INTO subscribers (email, name, confirmation_sent) VALUES ($1,$2,$3)",
    [email, name, confirmationSent],
  );
  return res
    .status(201)
    .json({
      success: true,
      confirmationSent,
      ownerNotificationSent,
      message:
        confirmationSent && ownerNotificationSent
          ? "Subscription confirmed. A confirmation was sent to you and the owner was notified."
          : confirmationSent
            ? "Subscription confirmed. Check your email."
            : ownerNotificationSent
              ? "Subscription saved and the owner was notified. Visitor confirmation could not be delivered."
              : "Subscription saved. Email delivery is not configured yet.",
    });
}
