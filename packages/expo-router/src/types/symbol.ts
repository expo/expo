import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * System SF Symbol or custom symbol from the app's asset catalog.
 * @inline
 */
export type SymbolName = SFSymbol | (string & {});
