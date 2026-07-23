'use client';
import type { ReactElement, ReactNode } from 'react';
import { isValidElement, use } from 'react';

import { NavigatorTypeContext } from '../react-navigation/core/NavigatorTypeContext';
import { useIsFocused } from '../react-navigation/core/useIsFocused';
import { useRoute } from '../react-navigation/native';
import { useNavigation } from '../useNavigation';
import { isRoutePreloadedInStack } from '../utils/stack';
import { useSafeLayoutEffect } from './useSafeLayoutEffect';

export type ScreenProps<TOptions extends Record<string, any> = Record<string, any>> = {
  /**
   * Name is required when used inside a Layout component.
   *
   * When used in a route, this can be an absolute path like `/(root)` to the parent route or a relative path like `../../` to the parent route.
   * This should not be used inside of a Layout component.
   * @example `/(root)` maps to a layout route `/app/(root).tsx`.
   */
  name?: string;
  initialParams?: Record<string, any>;
  options?: TOptions;
};

/** Component for setting the current screen's options dynamically. */
export function Screen<TOptions extends object = object>({ name, options }: ScreenProps<TOptions>) {
  if (name) {
    throw new Error(
      `The name prop on the Screen component may only be used when it is inside a Layout route`
    );
  }
  const route = useRoute();
  const navigation = useNavigation();
  // Reactive focus (event-subscribed) rather than the one-shot `navigation.isFocused()`: post the
  // transitions flip `navigation.isFocused()`/`getState()` read the committed mirror, which lags a
  // pending navigation, so a screen preloaded then navigated-to would not re-run this effect when it
  // actually gains focus. `useIsFocused` re-renders the screen on the focus event so the override
  // applies once focused.
  const isFocused = useIsFocused();
  const navigatorType = use(NavigatorTypeContext)?.type;
  const isPreloaded = isRoutePreloadedInStack(navigation.getState(), route, navigatorType);

  useSafeLayoutEffect(() => {
    if (options && Object.keys(options).length) {
      // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
      // https://github.com/expo/router/issues/452
      if (!isPreloaded || (isPreloaded && isFocused)) {
        navigation.setOptions(options);
      }
    }
  }, [isFocused, isPreloaded, navigation, options]);

  return null;
}

export function isScreen(
  child: ReactNode,
  contextKey?: string
): child is ReactElement<ScreenProps & { name: string }> {
  if (isValidElement(child) && child && child.type === Screen) {
    if (
      typeof child.props === 'object' &&
      child.props &&
      'name' in child.props &&
      !child.props.name
    ) {
      throw new Error(
        `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      if (
        ['children', 'component', 'getComponent'].some(
          (key) => child.props && typeof child.props === 'object' && key in child.props
        )
      ) {
        throw new Error(
          `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`
        );
      }
    }

    return true;
  }

  return false;
}
