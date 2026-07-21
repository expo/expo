'use client';
import * as React from 'react';

import type { ParamListBase, StackNavigationState } from '../../native';

export function useDismissedRouteError(state: StackNavigationState<ParamListBase>) {
  const [nextDismissedKey, setNextDismissedKey] = React.useState<string | null>(null);

  const dismissedRouteName = nextDismissedKey
    ? state.routes.find((route) => route.key === nextDismissedKey)?.name
    : null;

  React.useEffect(() => {
    if (dismissedRouteName) {
      // TODO(prevent-remove): this used to also point at `beforeRemove`/`usePreventRemove` as a
      // cause; restore that guidance if navigation prevention returns.
      const message =
        `The screen '${dismissedRouteName}' was removed natively but didn't get removed from JS state. ` +
        `This usually means a native dismissal wasn't reflected back into the router's navigation state.`;

      console.error(message);
    }
  }, [dismissedRouteName]);

  return { setNextDismissedKey };
}
