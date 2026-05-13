/**
 * Install a JS-level `Error.prepareStackTrace` that symbolicates frames using Node's
 * source map cache (`module.findSourceMap`). Idempotent — calling more than once is a no-op.
 *
 * Background: Node's automatic stack symbolication is gated on source maps being enabled.
 * `compileModule` toggles source maps on only during `_compile` (to keep the cache scoped
 * to our bundles rather than every `require()`'d package), so by the time an error from
 * the bundle is formatted, automatic symbolication is off. This shim restores it.
 *
 * Implementation closely follows
 * https://github.com/evanw/node-source-map-support/blob/master/source-map-support.js,
 * the canonical reference for this kind of `prepareStackTrace` shim:
 *
 *   - Source-mapped frames are wrapped in cloned plain-object call sites that override
 *     `getFileName`, `getLineNumber`, `getColumnNumber`, `getFunctionName`,
 *     `getScriptNameOrSourceURL`, and `toString`. V8's native
 *     `CallSite.prototype.toString` is implemented in C++ and reads internal slots
 *     directly, ignoring overridden JS getters; so we reimplement `toString` in JS
 *     (`callSiteToString`) on the clone, which consults the overridden getters.
 *
 *   - The stack is processed in reverse so we can use the source map's `name` from the
 *     *next* frame (the caller side) when overriding the *current* frame's function
 *     name. Source map V3's `name` at a position identifies the symbol being *called*
 *     at that position — i.e. the function whose body lives at the next-out frame —
 *     which is more accurate than V8's `getFunctionName()` for that frame.
 *
 *   - Non-source-mapped frames pass through unchanged; their native
 *     `CallSite.prototype.toString` is invoked via template-literal coercion in
 *     `prepareStackTrace`. This preserves V8's canonical formatting for every frame
 *     variant we don't symbolicate (top-level `at file:line:col`, `at TypeName.method`,
 *     `at new Class`, `at fn [as alias]`, native frames, eval frames, etc.).
 */
export declare function installSourceMapStackTrace(): void;
/**
 * V8's `CallSite.prototype.toString`, reimplemented in JS so it consults overridden
 * getters on a cloned call site. Mirrors the C++ implementation in V8's `messages.cc`
 * (which is also what `evanw/node-source-map-support` ports).
 *
 * Exported for tests, which need a working `toString` on mock plain-object call sites
 * (real V8 CallSites have one natively; plain objects don't).
 */
export declare function callSiteToString(this: NodeJS.CallSite): string;
