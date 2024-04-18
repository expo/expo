import { getStateFromPath as getStateFromPathDefault, NavigationContainerRef, ParamListBase } from '@react-navigation/core';
import * as React from 'react';
import type { LinkingOptions } from '@react-navigation/native';
type ResultState = ReturnType<typeof getStateFromPathDefault>;
/**
 * Run async function in series as it's called.
 */
export declare const series: (cb: () => Promise<void>) => () => void;
type Options = LinkingOptions<ParamListBase> & {
    independent?: boolean;
};
export default function useLinking(ref: React.RefObject<NavigationContainerRef<ParamListBase>>, { independent, enabled, config, getStateFromPath, getPathFromState, getActionFromState, }: Options): {
    getInitialState: () => PromiseLike<ResultState | undefined>;
};
export {};
//# sourceMappingURL=useLinking.d.ts.map