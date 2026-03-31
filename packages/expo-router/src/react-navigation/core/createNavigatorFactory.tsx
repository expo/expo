import type * as React from 'react';

import { Group } from './Group';
import { Screen } from './Screen';

/**
 * Higher order component to create a `Navigator` and `Screen` pair.
 * Custom navigators should wrap the navigator component in `createNavigator` before exporting.
 *
 * @param Navigator The navigator component. Should be wrapped with `withLayoutContext`.
 * @returns Factory method to create a `Navigator` and `Screen` pair.
 *
 * @deprecated This function may be replaced in the future version of expo-router.
 */
export function createNavigatorFactory(Navigator: React.ComponentType<any>) {
  function createNavigator(config?: any): any {
    if (config != null) {
      return {
        Navigator,
        Screen,
        Group,
        config,
      };
    }

    return {
      Navigator,
      Screen,
      Group,
    };
  }

  return createNavigator;
}
