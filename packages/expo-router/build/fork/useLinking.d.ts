import { LinkingOptions, getStateFromPath as getStateFromPathDefault, type NavigationContainerRef, type ParamListBase } from '@react-navigation/native';
import * as React from 'react';
type ResultState = ReturnType<typeof getStateFromPathDefault>;
/**
 * Run async function in series as it's called.
 */
export declare const series: (cb: () => Promise<void>) => () => void;
type Options = LinkingOptions<ParamListBase>;
export declare function useLinking(ref: React.RefObject<NavigationContainerRef<ParamListBase> | null>, { enabled, config, getStateFromPath, getPathFromState, getActionFromState, }: Options, onUnhandledLinking: (lastUnhandledLining: string | undefined) => void): {
    getInitialState: () => PromiseLike<ResultState | undefined>;
};
export declare function getInitialURLWithTimeout(): string | null | Promise<string | null>;
export {};
//# sourceMappingURL=useLinking.d.ts.map