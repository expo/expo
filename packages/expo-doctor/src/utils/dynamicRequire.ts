// Keep runtime project dependency loading opaque to ncc so it isn't replaced with an empty
// webpack context in the bundled CLI.
// eslint-disable-next-line no-eval -- ncc rewrites dynamic require and createRequire calls
export const dynamicRequire: NodeRequire = eval('require');
