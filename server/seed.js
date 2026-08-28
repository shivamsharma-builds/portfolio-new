import { defaultSite } from "../src/data/defaultContent.js";
import { dbQuery, initializeDatabase } from "./lib/db.js";

export async function seedContent(force = false) {
  await initializeDatabase();
  const existingSettings = await dbQuery(
    "SELECT id FROM site_settings WHERE id = 1",
  );
  if (!existingSettings.rowCount || force) {
    await dbQuery(
      `INSERT INTO site_settings (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(defaultSite.settings)],
    );
  }

  const sections = [
    "socials",
    "navLinks",
    "stats",
    "skills",
    "additionalSkills",
    "education",
    "experience",
    "projects",
    "certificates",
  ];
  for (const section of sections) {
    const count = await dbQuery(
      "SELECT COUNT(*)::int AS count FROM content_items WHERE section = $1",
      [section],
    );
    if (count.rows[0].count === 0 || force) {
      if (force)
        await dbQuery("DELETE FROM content_items WHERE section = $1", [
          section,
        ]);
      const items = defaultSite[section] || [];
      for (let i = 0; i < items.length; i += 1) {
        await dbQuery(
          "INSERT INTO content_items (section, position, data) VALUES ($1, $2, $3::jsonb)",
          [section, i, JSON.stringify(items[i])],
        );
      }
    }
  }
}
