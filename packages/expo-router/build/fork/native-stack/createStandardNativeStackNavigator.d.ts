import * as React from 'react';
import type { NativeStackNavigationEventMap, NativeStackNavigationOptions } from '../../react-navigation/native-stack';
/**
 * We extend NativeStackNavigationOptions with our custom props
 * to allow for several extra props to be used on web, like modalWidth
 */
export type ExtendedStackNavigationOptions = NativeStackNavigationOptions & {
    webModalStyle?: {
        /**
         * Override the width of the modal (px or percentage). Only applies on web platform.
         * @platform web
         */
        width?: number | string;
        /**
         * Override the height of the modal (px or percentage). Applies on web desktop.
         * @platform web
         */
        height?: number | string;
        /**
         * Minimum height of the desktop modal (px or percentage). Overrides the default 640px clamp.
         * @platform web
         */
        minHeight?: number | string;
        /**
         * Minimum width of the desktop modal (px or percentage). Overrides the default 580px.
         * @platform web
         */
        minWidth?: number | string;
        /**
         * Override the border of the desktop modal (any valid CSS border value, e.g. '1px solid #ccc' or 'none').
         * @platform web
         */
        border?: string;
        /**
         * Override the overlay background color (any valid CSS color or rgba/hsla value).
         * @platform web
         */
        overlayBackground?: string;
        /**
         * Override the modal shadow filter (any valid CSS filter value, e.g. 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' or 'none').
         * @platform web
         */
        shadow?: string;
    };
};
/**
 * Props injected into the native stack's `NavigatorContent` on top of the standard-navigation
 * `NavigatorArgs`, derived from the raw navigator state/dispatch/navigation in `StackClient`'s
 * `createProps`.
 *
 * All of these are optional on the public navigator component (the user never passes them);
 * `createProps` supplies them at runtime, so the content component asserts their presence when
 * forwarding to `NativeStackView`.
 */
export interface NativeStackContentProps {
    /** Pops `count` screens starting from the screen identified by `sourceRouteKey`. */
    pop?: (count: number, sourceRouteKey: string) => void;
    /**
     * Subscribes the pop-to-top-on-tab-press behavior to the parent tab navigator, returning the
     * unsubscribe function (or `undefined` when there is no parent tab navigator).
     */
    subscribeTabPressPopToTop?: () => (() => void) | undefined;
}
export declare const createStandardNativeStackNavigator: {
    readonly type: "standard";
    readonly version: 1;
    readonly NavigatorContent: React.ComponentType<import("standard-navigation").NavigatorArgs<ExtendedStackNavigationOptions, NativeStackNavigationEventMap> & Omit<NativeStackContentProps, keyof import("standard-navigation").NavigatorArgs<NavigatorOptions, NavigatorEventMap>>>;
};
//# sourceMappingURL=createStandardNativeStackNavigator.d.ts.map