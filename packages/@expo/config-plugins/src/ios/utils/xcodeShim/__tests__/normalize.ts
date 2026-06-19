// 24-char pbxproj identifier: legacy hex, or `@bacons`'s `XX…XX` content-hash form.
const UUID_TOKEN = /\b[0-9A-FX]{24}\b/g;

/**
 * Replace each pbxproj UUID with a stable placeholder in first-appearance
 * order. Legacy `xcode` mints random UUIDs, so raw output is non-deterministic;
 * a shared UUID maps to a shared placeholder, so references stay checkable.
 */
export function normalizeUuids(text: string): string {
  const map = new Map<string, string>();
  return text.replace(UUID_TOKEN, (match) => {
    let placeholder = map.get(match);
    if (!placeholder) {
      placeholder = `UUID-${String(map.size + 1).padStart(4, '0')}`;
      map.set(match, placeholder);
    }
    return placeholder;
  });
}

export function normalizeResult(value: unknown): unknown {
  if (value === undefined) return null;
  return JSON.parse(normalizeUuids(JSON.stringify(value)));
}
