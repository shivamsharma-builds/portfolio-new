import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultSite } from "../data/defaultContent";

const SiteDataContext = createContext({
  data: null,
  loading: true,
  error: "",
  refresh: async () => {},
});

const arrayOr = (value, fallback) => (Array.isArray(value) ? value : fallback);
const objectOr = (value, fallback) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : fallback;

function normalizeSettings(value) {
  const settings = { ...defaultSite.settings, ...objectOr(value, {}) };
  settings.aboutParagraphs = arrayOr(
    settings.aboutParagraphs,
    defaultSite.settings.aboutParagraphs,
  )
    .filter(Boolean)
    .map(String);
  return settings;
}

function normalizeItem(section, item, index) {
  if (section === "additionalSkills")
    return typeof item === "string"
      ? item
      : String(item?.name ?? item?.value ?? "");
  const value = objectOr(item, {});
  const base = defaultSite[section]?.[0] || {};
  const normalized = {
    ...base,
    ...value,
    id: value.id ?? `local-${section}-${index}`,
  };
  if (section === "education")
    normalized.courses = arrayOr(normalized.courses, [])
      .filter(Boolean)
      .map(String);
  if (section === "experience")
    normalized.achievements = arrayOr(normalized.achievements, [])
      .filter(Boolean)
      .map(String);
  if (section === "projects")
    normalized.tags = arrayOr(normalized.tags, []).filter(Boolean).map(String);
  if (section === "skills")
    normalized.level = Math.max(
      0,
      Math.min(100, Number(normalized.level) || 0),
    );
  if (section === "stats") normalized.value = String(normalized.value ?? "");
  return normalized;
}

function mergeSiteData(remote) {
  if (!remote || typeof remote !== "object") return defaultSite;
  const result = {
    ...defaultSite,
    ...remote,
    settings: normalizeSettings(remote.settings),
  };
  for (const section of [
    "socials",
    "navLinks",
    "stats",
    "skills",
    "additionalSkills",
    "education",
    "experience",
    "projects",
    "certificates",
  ]) {
    result[section] = arrayOr(remote[section], defaultSite[section]).map(
      (item, index) => normalizeItem(section, item, index),
    );
  }
  return result;
}

export function SiteDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await fetch(
        `/api/site?refresh=${encodeURIComponent(cacheBuster)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store",
          },
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          payload?.error || `Unable to load site content (${response.status}).`,
        );
      setData(mergeSiteData(payload));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load site content.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ data, loading, error, refresh, ...data }),
    [data, loading, error, refresh],
  );
  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  );
}

export const useSiteData = () => useContext(SiteDataContext);
