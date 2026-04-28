import { type RefObject } from 'react';
import { type LinkingOptions, type NavigationContainerRef, type ParamListBase } from '../react-navigation/native';
type Options = LinkingOptions<ParamListBase>;
export declare function useLinking(ref: RefObject<NavigationContainerRef<ParamListBase>>, { enabled, prefixes, filter, config, getInitialURL, subscribe, getStateFromPath, getActionFromState, }: Options, onUnhandledLinking: (lastUnhandledLining: string | undefined) => void): {
    getInitialState: () => PromiseLike<(Partial<Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("../react-navigation/core").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "stale" | "routes">> & Readonly<{
        stale?: true;
        routes: import("../react-navigation/core").PartialRoute<import("../react-navigation/core").Route<string, object | undefined>>[];
    }> & {
        state?: Partial<Omit<Readonly<{
            key: string;
            index: number;
            routeNames: string[];
            history?: unknown[];
            routes: import("../react-navigation/core").NavigationRoute<ParamListBase, string>[];
            type: string;
            stale: false;
        }>, "stale" | "routes">> & Readonly<{
            stale?: true;
            routes: import("../react-navigation/core").PartialRoute<import("../react-navigation/core").Route<string, object | undefined>>[];
        }> & /*elided*/ any;
    }) | undefined>;
};
export declare function getInitialURLWithTimeout(): string | null | Promise<string | null>;
export {};
//# sourceMappingURL=useLinking.native.d.ts.map