'use client';
import * as React from 'react';

import type { NativeStackViewState } from '../types';

export function useDismissedRouteError(state: NativeStackViewState) {
  const [nextDismissedKey, setNextDismissedKey] = React.useState<string | null>(null);
  const activeRoutes = state.routes.slice(0, state.index + 1);

  const dismissedRouteName = nextDismissedKey
    ? activeRoutes.find((route) => route.key === nextDismissedKey)?.name
    : null;

  React.useEffect(() => {
    if (dismissedRouteName) {
      const message =
        `The screen '${dismissedRouteName}' was removed natively but didn't get removed from JS state. ` +
        `This can happen if the action was prevented in a 'beforeRemove' listener, which is not fully supported in native-stack.\n\n` +
        `Consider using a 'usePreventRemove' hook with 'headerBackButtonMenuEnabled: false' to prevent users from natively going back multiple screens.`;

      console.error(message);
    }
  }, [dismissedRouteName]);

  return { setNextDismissedKey };
}
