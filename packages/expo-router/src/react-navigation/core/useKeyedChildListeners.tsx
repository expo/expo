import * as React from 'react';

import type { KeyedListenerMap } from './NavigationBuilderContext';

/**
 * Hook which lets child navigators add getters to be called for obtaining rehydrated state.
 */
export function useKeyedChildListeners() {
  const { current: keyedListeners } = React.useRef<{
    [K in keyof KeyedListenerMap]: Record<
      string,
      KeyedListenerMap[K] | undefined
    >;
  }>(
    Object.assign(Object.create(null), {
      getState: {},
      beforeRemove: {},
    })
  );

  const addKeyedListener = React.useCallback(
    <T extends keyof KeyedListenerMap>(
      type: T,
      key: string,
      listener: KeyedListenerMap[T]
    ) => {
      // @ts-expect-error: according to ref stated above you can use `key` to index type
      keyedListeners[type][key] = listener;

      return () => {
        // @ts-expect-error: according to ref stated above you can use `key` to index type
        keyedListeners[type][key] = undefined;
      };
    },
    [keyedListeners]
  );

  return {
    keyedListeners,
    addKeyedListener,
  };
}
