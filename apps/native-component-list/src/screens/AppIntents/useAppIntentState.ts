import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';

import { subscribeToAppIntentState } from './AppIntentsStore';

export function useAppIntentState<T>(loader: () => Promise<T>, initialValue: T): T {
  const [state, setState] = React.useState<T>(initialValue);

  const refresh = React.useCallback(async () => {
    setState(await loader());
  }, [loader]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      loader().then((value) => {
        if (isActive) {
          setState(value);
        }
      });

      const subscription = subscribeToAppIntentState(() => {
        if (isActive) {
          void refresh();
        }
      });

      return () => {
        isActive = false;
        subscription.remove();
      };
    }, [loader, refresh])
  );

  return state;
}
