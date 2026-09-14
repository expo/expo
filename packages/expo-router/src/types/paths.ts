/**
 * The shapes of the path-like strings that flow through the router.
 *
 * TypeScript can require a prefix but cannot forbid one, so only the two kinds
 * defined by a required prefix are typed here. Route names, React Navigation
 * patterns and single segments are defined by what they must *not* contain, so
 * they stay `string`.
 */

/** A `require.context` key as Metro produces it: relative, with the file extension. */
export type FileContextKey = `./${string}`;

/** The context key of a route the router generates itself, which has no file behind it. */
export type SystemContextKey = `expo-router/build/${string}`;

export type ContextKey = FileContextKey | SystemContextKey;

/**
 * A URL pathname. Always starts with `/`.
 *
 * Producers also keep it free of `?query` and `#hash`, but that part is a
 * convention this type cannot enforce.
 */
export type AbsolutePath = `/${string}`;

/** An {@link AbsolutePath} that may carry `?query`/`#hash`, or `''` before the first navigation. */
export type AbsoluteHref = AbsolutePath | '';
