/**
 * Does the input string start with a valid URL scheme.
 * NOTE: Additional strictness added to ensure URLs sent in query parameters for in-app navigation are not matched.
 */
export function hasUrlProtocolPrefix(href: string): boolean {
  return /^[\w\d_+.-]+:\/\//.test(href);
}
