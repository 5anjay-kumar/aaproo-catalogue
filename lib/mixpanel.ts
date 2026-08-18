"use client";

import mixpanel from "mixpanel-browser";

/**
 * Thin wrapper around Mixpanel. Analytics is optional — if no token is
 * configured, everything below is a no-op and the app behaves exactly the same.
 *
 * Initializes at module load (not from a React effect in some other component) so
 * there's no dependency on component mount order — by the time any component's own
 * effects run, this has already happened.
 *
 * There's no login in this app, so "profiles" are per-browser/device, not named
 * people — Mixpanel assigns an anonymous id automatically on init.
 */

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
// Vercel-provided; "development" for any purely local run (dev or `next start`).
// Tags every event so local testing never gets mixed into real production data.
const environment = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

let initialized = false;

if (typeof window !== "undefined" && token) {
  mixpanel.init(token, {
    autocapture: true,
    record_sessions_percent: 100,
    debug: environment !== "production",
  });
  mixpanel.register({ environment });

  // Without this, People/profile calls (set/set_once/increment) silently queue
  // forever and never actually send — Mixpanel's identity system won't flush
  // profile updates until identify() has been called at least once, even for
  // the SDK's own auto-generated anonymous device id.
  mixpanel.identify();

  // Creates the profile. $first_seen is set only once per device; Mixpanel fills
  // in $last_seen, $city/$region (from IP), etc. automatically from here on.
  mixpanel.people.set_once({ $first_seen: new Date().toISOString() });
  mixpanel.people.set({
    $browser: mixpanel.get_property("$browser"),
    $os: mixpanel.get_property("$os"),
    $device: mixpanel.get_property("$device"),
  });

  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  mixpanel.track(event, properties);
}

/** Bumps a running total on the device's profile (e.g. "Images Downloaded"). */
export function incrementProfile(properties: Record<string, number>): void {
  if (!initialized) return;
  mixpanel.people.increment(properties);
}

/** Attaches a property to every event tracked from here on (e.g. is_demo). */
export function registerSuperProperties(properties: Record<string, unknown>): void {
  if (!initialized) return;
  mixpanel.register(properties);
}
