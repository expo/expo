import { useFocusEffect } from 'expo-router';
import * as React from 'react';

import { subscribeToAppIntentState } from './AppIntentsStore';

export function useAppIntentState<T>(loader: () => Promise<T>, initialValue: T): T {
  const [state, setState] = React.useState<T>(initialValue);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const refresh = () => {
        loader()
          .then((value) => {
            // The screen can lose focus, or unmount, while the read is in flight.
            if (isActive) {
              setState(value);
            }
          })
          .catch((error: unknown) => {
            console.warn(
              'Could not read the stored App Intents example state. The screen keeps showing the value it read last.',
              error
            );
          });
      };

      refresh();
      const subscription = subscribeToAppIntentState(refresh);

      return () => {
        isActive = false;
        subscription.remove();
      };
    }, [loader])
  );

  return state;
}
