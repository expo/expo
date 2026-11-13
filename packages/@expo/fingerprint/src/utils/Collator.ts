/**
 * Collator for sorting strings in a locale-independent order.
 *
 * `String.prototype.localeCompare()` without an explicit locale uses the process default locale
 * (e.g. `LANG`/`LC_ALL`), so the same sources would sort differently on a Croatian, Czech, Swedish,
 * or Turkish machine than on EAS Build servers, producing a different fingerprint and runtime version.
 * Pinning the collator to `en` keeps the order stable across machines and matches the order that
 * English-locale machines have always produced, so existing fingerprints are unchanged.
 */
export const collator = new Intl.Collator('en');
