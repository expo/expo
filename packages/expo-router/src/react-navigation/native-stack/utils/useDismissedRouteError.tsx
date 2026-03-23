import type {
  ParamListBase,
  StackNavigationState,
} from '@react-navigation/native';
import * as React from 'react';

export function useDismissedRouteError(
  state: StackNavigationState<ParamListBase>
) {
  const [nextDismissedKey, setNextDismissedKey] = React.useState<string | null>(
    null
  );

  const dismissedRouteName = nextDismissedKey
    ? state.routes.find((route) => route.key === nextDismissedKey)?.name
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
