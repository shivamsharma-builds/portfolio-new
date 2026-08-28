import { publicSite } from "../server/handlers.js";
export default async function handler(req, res) {
  const original = res.json;
  res.json = (data) =>
    original.call(res, {
      name: data.settings?.name,
      email: data.settings?.email,
      phone: data.settings?.phone,
      location: data.settings?.location,
      availability: data.settings?.availability,
      socials: (data.socials || []).reduce(
        (a, s) => ({ ...a, [s.icon]: s.url }),
        {},
      ),
    });
  return publicSite(req, res);
}
