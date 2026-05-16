/**
 * Component-ID encoding for RSC routing.
 *
 * Component IDs identify a slot in the rendered React tree (a layout or a page).
 * Both client and server mint the same IDs from the same inputs so they can agree
 * about caching, skip lists, and component resolution.
 *
 * Convention: take the URL pathname segments, then suffix with `'layout'` or
 * `'page'`. `mintComponentId('/posts/[id]', 'page') === 'posts/[id]/page'`.
 */

export type ComponentIdKind = 'page' | 'layout';

/** Encode a single component ID from a path and the slot kind. */
export function mintComponentId(path: string, kind: ComponentIdKind): string {
  return [...path.split('/').filter(Boolean), kind].join('/');
}

/**
 * Enumerate every component ID expected to render for a given URL pathname:
 * one layout ID per path-prefix (root layout first, deepest last) plus the
 * terminal page ID.
 */
export function getComponentIds(path: string): readonly string[] {
  const segments = path.split('/').filter(Boolean);
  const ids = new Set<string>();
  for (let i = 0; i <= segments.length; i++) {
    ids.add(mintComponentId(segments.slice(0, i).join('/'), 'layout'));
  }
  ids.add(mintComponentId(segments.join('/'), 'page'));
  return Array.from(ids);
}
