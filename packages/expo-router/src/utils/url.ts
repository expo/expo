/**
 * Does the input string start with a valid URL scheme.
 * NOTE: Additional strictness added to ensure URLs sent in query parameters for in-app navigation are not matched.
 */
export function hasUrlProtocolPrefix(href: string): boolean {
  return /^[\w\d_+.-]+:\/\//.test(href);
}

export function isWellKnownUri(href: string): boolean {
  // This is a hack and we should change this to work like the web in the future where we have full confidence in the
  // ability to match URLs and send anything unmatched to the OS. The main difference between this and `hasUrlProtocolPrefix` is
  // that we don't require `//`, e.g. `mailto:` is valid and common, and `mailto://bacon` is invalid.
  return /^(https?|mailto|tel|sms|geo|maps|market|itmss?|itms-apps|content|file):/.test(href);
}

export function shouldLinkExternally(href: string): boolean {
  // Cheap check first to avoid regex if the href is not a path fragment.
  return !/^[./]/.test(href) && (hasUrlProtocolPrefix(href) || isWellKnownUri(href));
}
