import { publicSite } from "../server/handlers.js";
export default async function handler(req, res) {
  const original = res.json;
  res.json = (data) => original.call(res, data.projects || []);
  return publicSite(req, res);
}
