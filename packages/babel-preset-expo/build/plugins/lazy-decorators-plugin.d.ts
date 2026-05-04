import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
interface LazyDecoratorsState extends PluginPass {
    decoratorsDetected: boolean;
}
/**
 * Wraps `@babel/plugin-proposal-decorators` so that its transform visitors
 * only run when the source contains a potential decorator pattern (`@word`).
 *
 * The decorator syntax plugin is always inherited so that files parse
 * correctly regardless of the heuristic result.
 */
export declare function lazyDecoratorsPlugin(api: ConfigAPI & typeof import('@babel/core'), options: Record<string, unknown>): PluginObj<LazyDecoratorsState>;
export {};
