import { LinkingOptions, type NavigationContainerRef, type ParamListBase } from '@react-navigation/native';
import * as React from 'react';
/**
 * Run async function in series as it's called.
 */
export declare const series: (cb: () => Promise<void>) => () => void;
type Options = LinkingOptions<ParamListBase>;
export declare function useLinking(ref: React.RefObject<NavigationContainerRef<ParamListBase>>, { enabled, config, getStateFromPath, getPathFromState, getActionFromState, }: Options, onUnhandledLinking: (lastUnhandledLining: string | undefined) => void): {
    getInitialState: () => PromiseLike<(Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true | undefined;
        routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
    }> & {
        state?: (Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true | undefined;
            routes: import("@react-navigation/native").PartialRoute<import("@react-navigation/native").Route<string, object | undefined>>[];
        }> & any) | undefined;
    }) | undefined>;
};
export {};
//# sourceMappingURL=useLinking.d.ts.map