"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintComponentId = mintComponentId;
exports.getComponentIds = getComponentIds;
/** Encode a single component ID from a path and the slot kind. */
function mintComponentId(path, kind) {
    return [...path.split('/').filter(Boolean), kind].join('/');
}
/**
 * Enumerate the component IDs expected to render for a given URL pathname:
 * one layout ID per path-prefix (root layout first, deepest last) plus the
 * terminal page ID.
 */
function getComponentIds(path) {
    const segments = path.split('/').filter(Boolean);
    const layouts = [];
    for (let i = 0; i <= segments.length; i++) {
        layouts.push(mintComponentId(segments.slice(0, i).join('/'), 'layout'));
    }
    return { layouts, page: mintComponentId(segments.join('/'), 'page') };
}
//# sourceMappingURL=idMinting.js.map