import React from 'react';

import { useNavigation } from '../useNavigation';

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

const useLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : function () {};

/** Component for setting the current screen's options dynamically. */
export function Screen<TOptions extends object = object>({ name, options }: ScreenProps<TOptions>) {
  const navigation = useNavigation(name);

  useLayoutEffect(() => {
    if (
      options &&
      // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
      // https://github.com/expo/router/issues/452
      Object.keys(options).length
    ) {
      navigation.setOptions(options);
    }
  }, [navigation, options]);

  return null;
}
