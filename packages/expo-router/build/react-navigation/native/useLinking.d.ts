import * as React from 'react';
import { getStateFromPath as getStateFromPathDefault, type NavigationContainerRef, type ParamListBase } from '../core';
import type { LinkingOptions } from './types';
type ResultState = ReturnType<typeof getStateFromPathDefault>;
/**
 * Run async function in series as it's called.
 */
export declare const series: (cb: () => Promise<void>) => () => void;
type Options = LinkingOptions<ParamListBase>;
export declare function useLinking(ref: React.RefObject<NavigationContainerRef<ParamListBase> | null>, { enabled, config, getStateFromPath, getPathFromState, getActionFromState, }: Options, onUnhandledLinking: (lastUnhandledLining: string | undefined) => void): {
    getInitialState: () => PromiseLike<ResultState | undefined>;
};
export {};
//# sourceMappingURL=useLinking.d.ts.map