import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';

import { SingleNavigatorContext } from './EnsureSingleNavigator';

/**
 * Register a navigator in the parent context (either a navigation container or a screen).
 * This is used to prevent multiple navigators under a single container or screen.
 */
export function useRegisterNavigator() {
  const [key] = React.useState(() => nanoid());
  const container = React.useContext(SingleNavigatorContext);

  if (container === undefined) {
    throw new Error(
      "Couldn't register the navigator. Have you wrapped your app with 'NavigationContainer'?\n\nThis can also happen if there are multiple copies of '@react-navigation' packages installed."
    );
  }

  React.useEffect(() => {
    const { register, unregister } = container;

    register(key);

    return () => unregister(key);
  }, [container, key]);

  return key;
}
