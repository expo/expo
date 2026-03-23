import type { ParamListBase } from '@react-navigation/routers';
import * as React from 'react';

import {
  type FocusedNavigationCallback,
  type FocusedNavigationListener,
  NavigationBuilderContext,
} from './NavigationBuilderContext';
import type { NavigationHelpers } from './types';

type Options = {
  navigation: NavigationHelpers<ParamListBase>;
  focusedListeners: FocusedNavigationListener[];
};

/**
 * Hook for passing focus callback to children
 */
export function useFocusedListenersChildrenAdapter({
  navigation,
  focusedListeners,
}: Options) {
  const { addListener } = React.useContext(NavigationBuilderContext);

  const listener = React.useCallback(
    (callback: FocusedNavigationCallback<any>) => {
      if (navigation.isFocused()) {
        for (const listener of focusedListeners) {
          const { handled, result } = listener(callback);

          if (handled) {
            return { handled, result };
          }
        }

        return { handled: true, result: callback(navigation) };
      } else {
        return { handled: false, result: null };
      }
    },
    [focusedListeners, navigation]
  );

  React.useEffect(
    () => addListener?.('focus', listener),
    [addListener, listener]
  );
}
