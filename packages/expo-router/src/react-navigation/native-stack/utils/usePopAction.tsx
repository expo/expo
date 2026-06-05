'use client';
import * as React from 'react';

import type { NavigationAction } from '../../native';
import { StackActions } from '../../native';

export function usePopAction(
  navigation: { dispatch: (action: NavigationAction) => void },
  stateKey: string
) {
  return React.useCallback(
    (count: number, sourceRouteKey: string) => {
      navigation.dispatch({
        ...StackActions.pop(count),
        source: sourceRouteKey,
        target: stateKey,
      });
    },
    [navigation, stateKey]
  );
}
