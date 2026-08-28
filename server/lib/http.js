export const clean = (value, max = 5000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

export function jsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return {};
}
