import type { JsTransformerConfig } from '@expo/metro/metro-transform-worker';
import type { TransformResponse } from './transform-worker';
/** Synthesizes the `metro-transform-worker` output for a hand-crafted JS shims
 *
 * Typically used to skip Babel for JS output that embeds CSS. The CSS files'
 * processing isn't cached in development, making invoking Babel on them very
 * expensive and unnecessary.
 *
 * Note that `body` must not contain requires/imports, and parse without
 * additional Babel syntax features enabled. It must also only reference
 * the default Metro module arguments or globals.
 */
export declare function transformShim(config: JsTransformerConfig, filename: string, body: string): TransformResponse;
