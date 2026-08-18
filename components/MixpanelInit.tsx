"use client";

// Side-effect import only — lib/mixpanel.ts initializes at module evaluation
// time, which happens before any component's effects run. Mounting this in the
// root layout guarantees Mixpanel starts on every route, regardless of which
// page components happen to import it.
import "@/lib/mixpanel";

export function MixpanelInit() {
  return null;
}
