/** Characters `encodeURIComponent` leaves alone but RFC 3986 reserves. */
const RFC3986_RESERVED = /[!'()*]/g;

/** Percent-encode per RFC 3986 (the `strict-uri-encode` semantics `query-string` used). */
function encode(value: unknown): string {
  return encodeURIComponent(value as string | number | boolean).replace(
    RFC3986_RESERVED,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Serializes route params to a query string. Byte-identical to
 * `queryString.stringify(object, { sort: false })` from `query-string@7`, which this replaces:
 *   - insertion order is preserved
 *   - `undefined` values are omitted; `null` values serialize as a bare key
 *   - arrays repeat the key (`a=1&a=2`); empty arrays are omitted
 *   - keys and values are RFC 3986 percent-encoded (`%20` for a space, `%2A` for `*`)
 *   - a `__proto__` key is dropped
 *
 * `URLSearchParams` is deliberately not used: it serializes per
 * application/x-www-form-urlencoded (`+` for a space, `*` left bare), which would change every
 * generated URL containing a space.
 */
export function stringifyQuery(object: Record<string, unknown> | null | undefined): string {
  if (!object) {
    return '';
  }

  const segments: string[] = [];

  for (const key of Object.keys(object)) {
    // `query-string` copied the input into a plain `{}` first, where assigning `__proto__` hits
    // the accessor instead of creating a key, so it never reached the output.
    if (key === '__proto__') {
      continue;
    }

    const value = object[key];

    if (value === undefined) {
      continue;
    }

    if (value === null) {
      segments.push(encode(key));
      continue;
    }

    if (Array.isArray(value)) {
      const items: string[] = [];

      // Index-based like `Array.prototype.reduce`, so holes are skipped and a custom iterator is
      // not consulted.
      for (let index = 0; index < value.length; index++) {
        if (!(index in value)) {
          continue;
        }
        const item = value[index];
        if (item === undefined) {
          continue;
        }
        items.push(item === null ? encode(key) : `${encode(key)}=${encode(item)}`);
      }

      segments.push(items.join('&'));
      continue;
    }

    segments.push(`${encode(key)}=${encode(value)}`);
  }

  // An empty key with a `null` value encodes to '' and must not leave a stray '&'.
  return segments.filter((segment) => segment.length > 0).join('&');
}
