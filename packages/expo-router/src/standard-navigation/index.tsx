'use client';

import { type ComponentType, useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';
import type { NavigatorArgs } from 'standard-navigation';

import { withLayoutContext } from '../layouts/withLayoutContext';
import {
  useNavigationBuilder,
  type DefaultRouterOptions,
  type EventMapBase,
  type NavigationAction,
  type NavigationState,
  type RouterFactory,
} from '../react-navigation/native';
import type {
  IntegrateWithRouterOptions,
  NavigatorContentProps,
  StandardNavigator,
  StandardNavigatorEventMapBase,
  StandardRouterNavigatorProps,
  StandardUseNavigationBuilderOptions,
} from './types';
import { useProjectedDescriptors } from './useProjectedDescriptors';
import { useStandardActions } from './useStandardActions';
import { useStandardEmitter } from './useStandardEmitter';
import { useStandardState } from './useStandardState';

export type {
  IntegrateWithRouterOptions,
  NavigatorContentProps,
  StandardNavigatorEventMapBase,
  StandardUseNavigationBuilderOptions,
} from './types';

const SUPPORTED_VERSION = 1;
const STANDARD_NAVIGATOR_TYPE = 'standard';

// A rest tuple is the only way to make the whole argument optional for empty `CreateProps` and
// required otherwise; a normal optional parameter would accept `undefined` in both cases.
type IntegrateWithRouterOptionsTuple<State extends NavigationState, CreateProps extends object> = [
  keyof CreateProps,
] extends [never]
  ? [options?: IntegrateWithRouterOptions<State, CreateProps>]
  : [options: IntegrateWithRouterOptions<State, CreateProps>];

type StandardRouterNavigatorComponent<
  NavigatorOptions extends object,
  State extends NavigationState,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
> = ReturnType<
  typeof withLayoutContext<
    NavigatorOptions,
    ComponentType<
      StandardRouterNavigatorProps<State, NavigatorOptions, EventMap, NavigatorProps, RouterOptions>
    >,
    State,
    EventMap & EventMapBase
  >
>;

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
export function unstable_createStandardRouterNavigator<
  NavigatorOptions extends object,
  State extends NavigationState,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
  CreateProps extends object = object,
>(
  NavigatorContent: ComponentType<
    NavigatorContentProps<NavigatorOptions, EventMap, NavigatorProps, CreateProps>
  >,
  router: RouterFactory<State, NavigationAction, RouterOptions>,
  ...options: IntegrateWithRouterOptionsTuple<State, NoInfer<CreateProps>>
): StandardRouterNavigatorComponent<
  NavigatorOptions,
  State,
  EventMap,
  NavigatorProps,
  RouterOptions
> {
  const navigator = createStandardNavigator<
    NavigatorOptions,
    EventMap,
    NavigatorProps & CreateProps
  >(NavigatorContent);
  return unstable_integrateWithRouter<
    NavigatorOptions,
    State,
    EventMap,
    NavigatorProps,
    RouterOptions,
    CreateProps
  >(navigator, router, ...options);
}

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
export function unstable_integrateWithRouter<
  NavigatorOptions extends object,
  State extends NavigationState,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
  CreateProps extends object = object,
>(
  navigator: StandardNavigator<NavigatorOptions, EventMap, NavigatorProps & CreateProps>,
  router: RouterFactory<State, NavigationAction, RouterOptions>,
  ...[options]: IntegrateWithRouterOptionsTuple<State, NoInfer<CreateProps>>
) {
  assertStandardNavigator(navigator);
  const { NavigatorContent } = navigator;

  type NavPropsType = StandardRouterNavigatorProps<
    State,
    NavigatorOptions,
    EventMap,
    NavigatorProps,
    RouterOptions
  >;

  function StandardRouterNavigator(props: NavPropsType) {
    const { extraProps, useNavigationBuilderProps } = partitionNavigatorProps<
      NavigatorOptions,
      State,
      EventMap,
      NavigatorProps,
      RouterOptions
    >(props);
    const { state, navigation, descriptors, describe, NavigationContent } = useNavigationBuilder<
      State,
      RouterOptions,
      Record<string, (...args: unknown[]) => void>,
      NavigatorOptions,
      EventMap
    >(router, useNavigationBuilderProps);

    const { dispatch } = navigation;

    const derivedProps = useMemo<Partial<CreateProps>>(
      () => options?.createProps?.({ state, dispatch, navigation }) ?? {},
      [state, dispatch, navigation, options]
    );

    const standardArgs: NavigatorArgs<NavigatorOptions, EventMap> = {
      state: useStandardState(state),
      descriptors: useProjectedDescriptors(state, descriptors, describe),
      actions: useStandardActions(navigation, state.key),
      emitter: useStandardEmitter(navigation),
    };

    return (
      <NavigationContent>
        <NavigatorContent
          // `extraProps` is everything that is not a `useNavigationBuilder` option, which is the
          // navigator props *and* the router options merged together — at runtime there is no way
          // to tell the two apart, so the router options are intentionally forwarded here as well.
          // This is benign: `StandardNavigatorContentProps` only surfaces the navigator props in
          // its type, so the TS contract keeps users from reading router options off `NavigatorContent`
          // in the common case, even though they are physically present on the object.
          {...(extraProps as unknown as NavigatorProps)}
          // `derivedProps` is partial only when `CreateProps` is empty; otherwise `createProps` is
          // required and returns the complete shape.
          {...(derivedProps as CreateProps)}
          {...standardArgs}
        />
      </NavigationContent>
    );
  }

  return withLayoutContext<
    NavigatorOptions,
    typeof StandardRouterNavigator,
    State,
    EventMap & EventMapBase
  >(StandardRouterNavigator, undefined, options?.useOnlyUserDefinedScreens);
}

/**
 * Partitions a navigator's props into the subset consumed by `useNavigationBuilder`
 * (`useNavigationBuilderProps`) and everything else (`extraProps`, forwarded to `NavigatorContent`).
 */
function partitionNavigatorProps<
  NavigatorOptions extends object,
  State extends NavigationState,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
>(
  props: StandardRouterNavigatorProps<
    State,
    NavigatorOptions,
    EventMap,
    NavigatorProps,
    RouterOptions
  > & {
    ref?: unknown;
  }
) {
  const {
    id,
    children,
    initialRouteName,
    layout,
    // `ref` is supplied by `withLayoutContext` and consumed by React; it must not be forwarded
    // to `NavigatorContent`, so it is pulled out of the props here and intentionally dropped.
    ref,
    screenLayout,
    screenListeners,
    screenOptions,
    UNSTABLE_routeNamesChangeBehavior,
    UNSTABLE_router,
    ...extraProps
  } = props;
  // The builder-specific keys are explicitly destructured so they cannot leak into `extraProps`.
  // Re-listing them as a pure object literal typed as `StandardUseNavigationBuilderOptions` also makes
  // the partition type-checked: a key that is not a valid builder option is rejected by excess-property
  // checking, and a missing required builder option is rejected too — both surface as a compile error
  // here instead of silently passing through to the wrong consumer.
  const useNavigationBuilderProps: StandardUseNavigationBuilderOptions<
    State,
    NavigatorOptions,
    EventMap
  > = {
    id,
    children,
    initialRouteName,
    layout,
    screenLayout,
    screenListeners,
    screenOptions,
    UNSTABLE_routeNamesChangeBehavior,
    UNSTABLE_router,
  };
  return {
    extraProps,
    // Spread `extraProps` first so router-specific options (e.g. `backBehavior`) reach the
    // router, then the framework keys above. `NavigatorContent` still receives `extraProps`.
    useNavigationBuilderProps: {
      ...extraProps,
      ...useNavigationBuilderProps,
    },
  };
}

function assertStandardNavigator(navigator: unknown): asserts navigator is {
  type: typeof STANDARD_NAVIGATOR_TYPE;
} {
  if (navigator == null) {
    throw new Error(
      'Could not integrate a standard navigator because no navigator was provided. ' +
        'Pass the object returned by `createStandardNavigator(...)` from the `standard-navigation` package, ' +
        'or use `unstable_createStandardRouterNavigator(NavigatorContent, router)` which creates it for you.'
    );
  }

  const { type, version } = navigator as { type?: unknown; version?: unknown };

  if (type !== STANDARD_NAVIGATOR_TYPE) {
    throw new Error(
      `Could not integrate a standard navigator because its \`type\` is ${JSON.stringify(type)}, not "standard". ` +
        'This value is likely not a standard-navigation navigator. ' +
        'Create it with `createStandardNavigator(...)` from the `standard-navigation` package, ' +
        'or use `unstable_createStandardRouterNavigator(NavigatorContent, router)`.'
    );
  }

  if (version !== SUPPORTED_VERSION) {
    // This is a warning rather than a hard error on purpose: the standard-navigation contract is
    // versioned by the `standard-navigation` package, not by expo-router, and integration is likely
    // to keep working across adjacent versions. Blocking here would needlessly break those cases.
    // If a mismatch does cause problems, this points at the version skew as the likely cause.
    console.warn(
      `This standard navigator targets the standard-navigation v${version} contract, ` +
        `but this version of expo-router was built against v${SUPPORTED_VERSION}. ` +
        'Integration may still work, but if you hit unexpected navigation behavior, ' +
        'align the installed `standard-navigation` version with your expo-router version, ' +
        'or check the standard-navigation release notes for migration steps.'
    );
  }
}
