export type GtmEvent = {
  event: string;
  [key: string]: string | number | boolean | undefined;
};

function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem("deva-cookie-choice") === "accepted";
  } catch {
    return false;
  }
}

export function pushGtmEvent(event: GtmEvent) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return false;
  const dataLayer = (window as Window & { dataLayer?: GtmEvent[] }).dataLayer ?? [];
  dataLayer.push({ ...event, event_source: "deva-portfolio" });
  (window as Window & { dataLayer?: GtmEvent[] }).dataLayer = dataLayer;
  return true;
}
