// @ref llp/0009-smart-followups.rfc.md §Examples per command — the real-device hint.
// The dev server the CLI just started listens on every interface, so a phone on the same network
// reaches it at this host's LAN address. Reading the interface list is a local call: no probe,
// no subprocess, no network traffic.

import os from 'os';

/**
 * The first external IPv4 address of this host, or null when it has none.
 *
 * Loopback and IPv6 are skipped: Expo Go takes an `exp://host:port` URL, and a phone can only
 * reach an address that is routable from its own network.
 */
export function resolveLanHost(): string | null {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      // `family` is the string 'IPv4' on Node 18+ and the number 4 on older runtimes.
      const isIPv4 = entry.family === 'IPv4' || (entry.family as unknown as number) === 4;
      if (isIPv4 && !entry.internal && entry.address) {
        return entry.address;
      }
    }
  }
  return null;
}

/** The URL a phone on the same network opens in Expo Go, or null without a LAN address. */
export function resolveExpoGoLanUrl(port: number): string | null {
  const host = resolveLanHost();
  return host ? `exp://${host}:${port}` : null;
}
