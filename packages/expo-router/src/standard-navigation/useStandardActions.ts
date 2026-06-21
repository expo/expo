import { useMemo } from 'react';
import { type NavigatorArgs } from 'standard-navigation';

import type { StandardNavigationAction, StandardNavigatorEventMapBase } from './types';

type StandardActionHelpers = NavigatorArgs<
  Record<string, never>,
  StandardNavigatorEventMapBase
>['actions'];

export function useStandardActions(
  navigation: {
    dispatch: (action: StandardNavigationAction) => void;
  },
  target: string
): StandardActionHelpers {
  return useMemo<StandardActionHelpers>(
    () => ({
      back: () => {
        navigation.dispatch({ type: 'GO_BACK', target } satisfies StandardNavigationAction);
      },
      navigate: (name, params) => {
        navigation.dispatch({
          type: 'NAVIGATE',
          payload: { name, params },
          target,
        } satisfies StandardNavigationAction);
      },
    }),
    [navigation, target]
  );
}
