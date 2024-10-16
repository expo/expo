import { NavigationContainerRef, ParamListBase } from '@react-navigation/core';
import type { LinkingOptions } from '@react-navigation/native';
import * as React from 'react';
type Options = LinkingOptions<ParamListBase>;
export default function useLinking(ref: React.RefObject<NavigationContainerRef<ParamListBase>>, { filter, config, getInitialURL, subscribe, getStateFromPath, getActionFromState, }: Options): {
    getInitialState: () => PromiseLike<(Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/core").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "routes" | "stale">> & Readonly<{
        stale?: true | undefined;
        routes: import("@react-navigation/core").PartialRoute<import("@react-navigation/core").Route<string, object | undefined>>[];
    }> & {
        state?: (Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[] | undefined;
            routes: import("@react-navigation/core").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "routes" | "stale">> & Readonly<{
            stale?: true | undefined;
            routes: import("@react-navigation/core").PartialRoute<import("@react-navigation/core").Route<string, object | undefined>>[];
        }> & any) | undefined;
    }) | undefined>;
};
export {};
//# sourceMappingURL=useLinking.native.d.ts.map