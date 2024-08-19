import { CommonNavigationAction, ParamListBase, Router, TabActionType as RNTabActionType, TabNavigationState, TabRouterOptions as RNTabRouterOptions } from '@react-navigation/native';
import { TriggerMap } from './common';
import { Href } from '../types';
export type TabRouterOptions = RNTabRouterOptions & {
    triggerMap: TriggerMap;
};
export type TabActionType<T extends string | object> = RNTabActionType | CommonNavigationAction | {
    type: 'SWITCH_TABS';
    payload: {
        name: string;
        href?: Href<T>;
    };
    source?: string;
    target?: string;
};
export declare function TabRouter({ triggerMap, ...options }: TabRouterOptions): Router<TabNavigationState<ParamListBase>, {
    type: "GO_BACK";
    source?: string | undefined;
    target?: string | undefined;
} | {
    type: "NAVIGATE";
    payload: {
        key: string;
        name?: undefined;
        params?: object | undefined;
        path?: string | undefined;
        merge?: boolean | undefined;
    } | {
        name: string;
        key?: string | undefined;
        params?: object | undefined;
        path?: string | undefined;
        merge?: boolean | undefined;
    };
    source?: string | undefined;
    target?: string | undefined;
} | {
    type: "RESET";
    payload: (Readonly<{
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
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }> | import("@react-navigation/native").PartialState<Readonly<{
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
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>> | (Omit<Readonly<{
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
            state?: Readonly<any> | import("@react-navigation/native").PartialState<Readonly<any>> | undefined;
        })[];
        type: string;
        stale: false;
    }>, "routes"> & {
        routes: Omit<import("@react-navigation/native").Route<string>, "key">[];
    })) | undefined;
    source?: string | undefined;
    target?: string | undefined;
} | {
    type: "SET_PARAMS";
    payload: {
        params?: object | undefined;
    };
    source?: string | undefined;
    target?: string | undefined;
} | RNTabActionType | {
    type: "SWITCH_TABS";
    payload: {
        name: string;
        href?: Href<any> | undefined;
    };
    source?: string | undefined;
    target?: string | undefined;
}>;
//# sourceMappingURL=TabRouter.d.ts.map