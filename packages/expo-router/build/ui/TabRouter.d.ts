import { CommonNavigationAction, ParamListBase, Router, TabActionType as RNTabActionType, TabNavigationState, TabRouterOptions as RNTabRouterOptions } from '@react-navigation/native';
import { TriggerMap } from './common';
export type ExpoTabRouterOptions = RNTabRouterOptions & {
    triggerMap: TriggerMap;
};
export type ExpoTabsResetValue = 'always' | 'onFocus' | 'never';
export type ExpoTabActionType = RNTabActionType | CommonNavigationAction | {
    type: 'JUMP_TO';
    source?: string;
    target?: string;
    payload: {
        name: string;
        reset?: ExpoTabsResetValue;
        params?: object | undefined;
    };
};
export declare function ExpoTabRouter({ triggerMap, ...options }: ExpoTabRouterOptions): Router<TabNavigationState<ParamListBase>, {
    type: "GO_BACK";
    source?: string | undefined;
    target?: string | undefined;
} | {
    type: "NAVIGATE";
    payload: {
        name: string;
        params?: object | undefined;
        path?: string | undefined;
        merge?: boolean | undefined;
    };
    source?: string | undefined;
    target?: string | undefined;
} | {
    type: "NAVIGATE_DEPRECATED";
    payload: {
        name: string;
        params?: object | undefined;
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
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }> | import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>> | (Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
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
} | {
    type: "PRELOAD";
    payload: {
        name: string;
        params?: object | undefined;
    };
    source?: string | undefined;
    target?: string | undefined;
} | RNTabActionType | {
    type: "JUMP_TO";
    source?: string | undefined;
    target?: string | undefined;
    payload: {
        name: string;
        reset?: ExpoTabsResetValue | undefined;
        params?: object | undefined;
    };
}>;
//# sourceMappingURL=TabRouter.d.ts.map