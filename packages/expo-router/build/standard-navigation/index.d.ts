import { type ComponentType } from 'react';
import type { IntegrateWithRouterOptions, StandardNavigator, StandardNavigatorContentProps, StandardNavigatorEventMapBase, StandardRouterNavigatorProps } from './types';
import { type DefaultRouterOptions, type EventMapBase, type NavigationAction, type NavigationState, type RouterFactory } from '../react-navigation/native';
export type { IntegrateWithRouterOptions, StandardUseNavigationBuilderOptions } from './types';
/**
 * Creates a [`standard-navigation`](https://www.npmjs.com/package/standard-navigation) navigator and
 * wires it into Expo Router in one step. Use `unstable_integrateWithRouter` instead if you already
 * have a navigator from `createStandardNavigator`.
 *
 * @param NavigatorContent Renders the navigator UI; receives the standard-navigation `state`,
 * `descriptors`, `actions`, and `emitter`.
 * @param router The router factory to use, for example `StackRouter` or `TabRouter`.
 * @param options See `IntegrateWithRouterOptions`.
 *
 * @example
 * ```tsx
 * import { unstable_createStandardRouterNavigator, TabRouter } from 'expo-router';
 *
 * export const Tabs = unstable_createStandardRouterNavigator(MyTabsContent, TabRouter);
 * ```
 *
 * > **warning** This API is unstable and may change between minor releases.
 */
export declare function unstable_createStandardRouterNavigator<NavigatorOptions extends object, State extends NavigationState, EventMap extends StandardNavigatorEventMapBase, NavigatorProps extends object, RouterOptions extends DefaultRouterOptions>(NavigatorContent: ComponentType<StandardNavigatorContentProps<NavigatorOptions, EventMap, NavigatorProps>>, router: RouterFactory<State, NavigationAction, RouterOptions>, options?: IntegrateWithRouterOptions<State, NavigatorProps>): import("react").ForwardRefExoticComponent<import("react").PropsWithoutRef<import("..").PickPartial<StandardRouterNavigatorProps<State, NavigatorOptions, EventMap, NavigatorProps, RouterOptions>, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<NavigatorOptions, State, EventMap & EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
/**
 * Wires an existing [`standard-navigation`](https://www.npmjs.com/package/standard-navigation)
 * navigator into Expo Router, returning a navigator component (with a `.Screen` child) usable as a
 * layout. Use `unstable_createStandardRouterNavigator` to create and integrate in one step.
 *
 * @param navigator The object returned by `createStandardNavigator(...)`.
 * @param router The router factory to use, for example `StackRouter` or `TabRouter`.
 * @param options See `IntegrateWithRouterOptions`.
 *
 * @example
 * ```tsx
 * import { createStandardNavigator } from 'standard-navigation';
 * import { unstable_integrateWithRouter, TabRouter } from 'expo-router';
 *
 * const navigator = createStandardNavigator(MyTabsContent);
 * export const Tabs = unstable_integrateWithRouter(navigator, TabRouter);
 * ```
 *
 * > **warning** This API is unstable and may change between minor releases.
 */
export declare function unstable_integrateWithRouter<NavigatorOptions extends object, State extends NavigationState, EventMap extends StandardNavigatorEventMapBase, NavigatorProps extends object, RouterOptions extends DefaultRouterOptions>(navigator: StandardNavigator<NavigatorOptions, EventMap, NavigatorProps>, router: RouterFactory<State, NavigationAction, RouterOptions>, options?: IntegrateWithRouterOptions<State, NavigatorProps>): import("react").ForwardRefExoticComponent<import("react").PropsWithoutRef<import("..").PickPartial<StandardRouterNavigatorProps<State, NavigatorOptions, EventMap, NavigatorProps, RouterOptions>, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<NavigatorOptions, State, EventMap & EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
//# sourceMappingURL=index.d.ts.map