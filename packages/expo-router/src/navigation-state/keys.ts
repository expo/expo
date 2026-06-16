// The single route-key minting authority (Decisions P-7).
//
// Every route key is minted here — at hydration and (future phases) at runtime push/preload — so
// keys share one format and are unique across the whole process. JS mints a key once; a native echo
// of the same navigation carries that same key, so the reducer dedupes by key equality and no ghost
// duplicate screen appears. The value is opaque on purpose: a stack may legitimately hold the same
// route twice, so keys cannot be content-derived.

let counter = 0;

export function createRouteKey(name: string): string {
  return `${name}#${counter++}`;
}
