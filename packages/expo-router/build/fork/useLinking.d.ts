import { NavigationContainerRef, ParamListBase } from '@react-navigation/core';
import * as React from 'react';
import type { LinkingOptions } from '@react-navigation/native';
/**
 * Run async function in series as it's called.
 */
export declare const series: (cb: () => Promise<void>) => () => void;
type Options = LinkingOptions<ParamListBase> & {
    independent?: boolean;
};
export default function useLinking(ref: React.RefObject<NavigationContainerRef<ParamListBase>>, { independent, enabled, config, getStateFromPath, getPathFromState, getActionFromState, }: Options): {
    getInitialState: () => PromiseLike<(Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: (Readonly<{
            key: string;
            name: string;
            path?: string | undefined;
        }> & Readonly<{
            params?: Readonly<object | undefined>;
        }> & {
            state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true | undefined;
        routes: import("@react-navigation/core").PartialRoute<import("@react-navigation/core").Route<string, object | undefined>>[];
    }> & {
        state?: (Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: (Readonly<{
                key: string;
                name: string;
                path?: string | undefined;
            }> & Readonly<{
                params?: Readonly<object | undefined>;
            }> & {
                state?: Readonly<any> | import("@react-navigation/core").PartialState<Readonly<any>> | undefined;
            })[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true | undefined;
            routes: import("@react-navigation/core").PartialRoute<import("@react-navigation/core").Route<string, object | undefined>>[];
        }> & any) | undefined;
    }) | undefined>;
};
export {};
//# sourceMappingURL=useLinking.d.ts.map