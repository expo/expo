import { NavigationAction, type NavigationState, PartialRoute, type PartialState } from '@react-navigation/native';
import { ResultState } from '../fork/getStateFromPath';
import { Href } from '../types';
import { SingularOptions } from '../useScreens';
export declare const routingQueue: {
    queue: NavigationAction[];
    subscribers: Set<() => void>;
    subscribe(callback: () => void): () => void;
    snapshot(): Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>[];
    add(action: NavigationAction): void;
    run(): void;
};
export type NavigationOptions = Omit<LinkToOptions, 'event'>;
export declare function navigate(url: Href, options?: NavigationOptions): void;
export declare function reload(): void;
export declare function prefetch(href: Href, options?: NavigationOptions): void;
export declare function push(url: Href, options?: NavigationOptions): void;
export declare function dismiss(count?: number): void;
export declare function dismissTo(href: Href, options?: NavigationOptions): void;
export declare function replace(url: Href, options?: NavigationOptions): void;
export declare function dismissAll(): void;
export declare function goBack(): void;
export declare function canGoBack(): boolean;
export declare function canDismiss(): boolean;
export declare function setParams(params?: Record<string, undefined | string | number | (string | number)[]>): any;
export type LinkToOptions = {
    event?: string;
    /**
     * Relative URL references are either relative to the directory or the document. By default, relative paths are relative to the document.
     * @see: [MDN's documentation on Resolving relative references to a URL](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references).
     */
    relativeToDirectory?: boolean;
    /**
     * Include the anchor when navigating to a new navigator
     */
    withAnchor?: boolean;
    /**
     * When navigating in a Stack, remove all screen from the history that match the singular condition
     *
     * If used with `push`, the history will be filtered even if no navigation occurs.
     */
    dangerouslySingular?: SingularOptions;
    __internal__PreviewKey?: string;
};
export declare function linkTo(originalHref: Href, options?: LinkToOptions): void;
/**
 * React Navigation uses params to store information about the screens, rather then create new state for each level.
 * This function traverses the action state that will not be part of state and returns a payload that can be used in action.
 */
export declare function getPayloadFromStateRoute(_actionStateRoute: PartialRoute<any>): Record<string, any>;
export declare function findDivergentState(_actionState: ResultState, _navigationState: NavigationState): {
    actionState: PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>>;
    navigationState: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/native").NavigationRoute<import("@react-navigation/native").ParamListBase, string>[];
        type: string;
        stale: false;
    }>;
    actionStateRoute: PartialRoute<any> | undefined;
};
//# sourceMappingURL=routing.d.ts.map