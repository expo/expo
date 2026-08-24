import { type ComponentType } from 'react';
import type { IntegrateWithRouterOptions, NavigatorContentProps, StandardNavigator, StandardNavigatorEventMapBase, StandardRouterNavigatorProps } from './types';
import { withLayoutContext } from '../layouts/withLayoutContext';
import { type DefaultRouterOptions, type EventMapBase, type NavigationAction, type NavigationState, type RouterFactory } from '../react-navigation/native';
export type { IntegrateWithRouterOptions, NavigatorContentProps, StandardNavigatorEventMapBase, StandardUseNavigationBuilderOptions, } from './types';
type IntegrateWithRouterOptionsTuple<State extends NavigationState, CreateProps extends object> = [
    keyof CreateProps
] extends [never] ? [options?: IntegrateWithRouterOptions<State, CreateProps>] : [options: IntegrateWithRouterOptions<State, CreateProps>];
type StandardRouterNavigatorComponent<NavigatorOptions extends object, State extends NavigationState, EventMap extends StandardNavigatorEventMapBase, NavigatorProps extends object, RouterOptions extends DefaultRouterOptions> = ReturnType<typeof withLayoutContext<NavigatorOptions, ComponentType<StandardRouterNavigatorProps<State, NavigatorOptions, EventMap, NavigatorProps, RouterOptions>>, State, EventMap & EventMapBase>>;
/**
 * > **warning** This API is unstable and may change between minor releases.
 *
 * Creates a [`standard-navigation`](https://www.npmjs.com/package/standard-navigation) navigator and
 * wires it into Expo Router in one step. Use `unstable_integrateWithRouter` instead if you already
 * have a navigator from `createStandardNavigator`.
 * Props declared in both `NavigatorProps` and `CreateProps` are intersected, so incompatible types
 * produce `never` rather than a type error at this call.
 *
 * @param NavigatorContent Renders the navigator UI; receives the standard-navigation `state`,
 * `descriptors`, `actions`, and `emitter`.
 * @param router The router factory to use. For example, `StackRouter` or `TabRouter`.
 * @param options See `IntegrateWithRouterOptions`.
 *
 * @example
 * ```tsx
 * import { unstable_createStandardRouterNavigator, TabRouter } from 'expo-router';
 *
 * export const Tabs = unstable_createStandardRouterNavigator(MyTabsContent, TabRouter);
 * ```
 */
export declare function unstable_createStandardRouterNavigator<NavigatorOptions extends object, State extends NavigationState, EventMap extends StandardNavigatorEventMapBase, NavigatorProps extends object, RouterOptions extends DefaultRouterOptions, CreateProps extends object = object>(NavigatorContent: ComponentType<NavigatorContentProps<NavigatorOptions, EventMap, NavigatorProps, CreateProps>>, router: RouterFactory<State, NavigationAction, RouterOptions>, ...options: IntegrateWithRouterOptionsTuple<State, NoInfer<CreateProps>>): StandardRouterNavigatorComponent<NavigatorOptions, State, EventMap, NavigatorProps, RouterOptions>;
/**
 * > **warning** This API is unstable and may change between minor releases.
 *
 * Wires an existing [`standard-navigation`](https://www.npmjs.com/package/standard-navigation)
 * navigator into Expo Router, returning a navigator component (with a `.Screen` child) usable as a
 * layout. Use `unstable_createStandardRouterNavigator` to create and integrate in one step.
 *
 * @param navigator The object returned by `createStandardNavigator(...)`.
 * @param router The router factory to use. For example, `StackRouter` or `TabRouter`.
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
 */
export declare function unstable_integrateWithRouter<NavigatorOptions extends object, State extends NavigationState, EventMap extends StandardNavigatorEventMapBase, NavigatorProps extends object, RouterOptions extends DefaultRouterOptions, CreateProps extends object = object>(navigator: StandardNavigator<NavigatorOptions, EventMap, NavigatorProps & CreateProps>, router: RouterFactory<State, NavigationAction, RouterOptions>, ...[options]: IntegrateWithRouterOptionsTuple<State, NoInfer<CreateProps>>): import("react").ForwardRefExoticComponent<import("react").PropsWithoutRef<import("..").PickPartial<StandardRouterNavigatorProps<State, NavigatorOptions, EventMap, NavigatorProps, RouterOptions>, "children">> & import("react").RefAttributes<unknown> & {
    unstable_screenErrorBoundary?: ComponentType<import("..").ErrorBoundaryProps>;
}> & {
    Screen: (props: import("..").ScreenProps<NavigatorOptions, State, EventMap & EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
//# sourceMappingURL=index.d.ts.map