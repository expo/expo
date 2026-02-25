import { CommonNavigationAction, ParamListBase, Router, TabActionType as RNTabActionType, TabNavigationState, TabRouterOptions as RNTabRouterOptions, type StackActionType } from '@react-navigation/native';
import { TriggerMap } from './common';
export type ExpoTabRouterOptions = RNTabRouterOptions & {
    triggerMap: TriggerMap;
};
type ReplaceAction = Extract<StackActionType, {
    type: 'REPLACE';
}>;
export type ExpoTabActionType = RNTabActionType | CommonNavigationAction | ReplaceAction | {
    type: 'JUMP_TO';
    source?: string;
    target?: string;
    payload: {
        name: string;
        resetOnFocus?: boolean;
        params?: object;
    };
};
export declare function ExpoTabRouter(options: ExpoTabRouterOptions): Router<TabNavigationState<ParamListBase>, {
    type: "GO_BACK";
    source?: string;
    target?: string;
} | {
    type: "NAVIGATE";
    payload: {
        name: string;
        params?: object;
        path?: string;
        merge?: boolean;
        pop?: boolean;
    };
    source?: string;
    target?: string;
} | {
    type: "NAVIGATE_DEPRECATED";
    payload: {
        name: string;
        params?: object;
        merge?: boolean;
    };
    source?: string;
    target?: string;
} | {
    type: "RESET";
    payload: (Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }> | import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>> | (Omit<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>, "routes"> & {
        routes: Omit<import("@react-navigation/native").Route<string>, "key">[];
    })) | undefined;
    source?: string;
    target?: string;
} | {
    type: "SET_PARAMS";
    payload: {
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: "REPLACE_PARAMS";
    payload: {
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: "PRELOAD";
    payload: {
        name: string;
        params?: object;
    };
    source?: string;
    target?: string;
} | {
    type: "REPLACE";
    payload: {
        name: string;
        params?: object;
    };
    source?: string;
    target?: string;
} | RNTabActionType | {
    type: "JUMP_TO";
    source?: string;
    target?: string;
    payload: {
        name: string;
        resetOnFocus?: boolean;
        params?: object;
    };
}>;
export {};
//# sourceMappingURL=TabRouter.d.ts.map