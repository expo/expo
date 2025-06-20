'use client';
import { useRoute } from '@react-navigation/native';
import { isValidElement, ReactElement, ReactNode } from 'react';

import { useNavigation } from '../useNavigation';
import { useSafeLayoutEffect } from './useSafeLayoutEffect';
import { isRoutePreloadedInStack } from '../utils/stack';

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
  const route = useRoute();
  const navigation = useNavigation(name);
  const isFocused = navigation.isFocused();
  const isPreloaded = isRoutePreloadedInStack(navigation.getState(), route);

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
