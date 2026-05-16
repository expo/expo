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

/**
 * Component IDs expected to render for a given URL pathname. The terminal
 * `page` is separated from `layouts` so consumers don't have to rely on a
 * positional convention (last element is the page) to tell them apart.
 */
export type ComponentIds = {
  /** Layout IDs from root to deepest, in render order. */
  readonly layouts: readonly string[];
  /** The terminal page ID for this pathname. */
  readonly page: string;
};

/** Encode a single component ID from a path and the slot kind. */
export function mintComponentId(path: string, kind: ComponentIdKind): string {
  return [...path.split('/').filter(Boolean), kind].join('/');
}

/**
 * Enumerate the component IDs expected to render for a given URL pathname:
 * one layout ID per path-prefix (root layout first, deepest last) plus the
 * terminal page ID.
 */
export function getComponentIds(path: string): ComponentIds {
  const segments = path.split('/').filter(Boolean);
  const layouts: string[] = [];
  for (let i = 0; i <= segments.length; i++) {
    layouts.push(mintComponentId(segments.slice(0, i).join('/'), 'layout'));
  }
  return { layouts, page: mintComponentId(segments.join('/'), 'page') };
}
