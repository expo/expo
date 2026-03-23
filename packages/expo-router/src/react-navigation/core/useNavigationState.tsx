import type { NavigationState, ParamListBase } from '@react-navigation/routers';
import * as React from 'react';
import useLatestCallback from 'use-latest-callback';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

type Selector<ParamList extends ParamListBase, T> = (
  state: NavigationState<ParamList>
) => T;

/**
 * Hook to get a value from the current navigation state using a selector.
 *
 * @param selector Selector function to get a value from the state.
 */
export function useNavigationState<ParamList extends ParamListBase, T>(
  selector: Selector<ParamList, T>
): T {
  const stateListener = React.useContext(NavigationStateListenerContext);

  if (stateListener == null) {
    throw new Error(
      "Couldn't get the navigation state. Is your component inside a navigator?"
    );
  }

  const value = useSyncExternalStoreWithSelector(
    stateListener.subscribe,
    // @ts-expect-error: this is unsafe, but needed to make the generic work
    stateListener.getState,
    stateListener.getState,
    selector
  );

  return value;
}

export function NavigationStateListenerProvider({
  state,
  children,
}: {
  state: NavigationState<ParamListBase>;
  children: React.ReactNode;
}) {
  const listeners = React.useRef<(() => void)[]>([]);
  const stateRef = React.useRef(state);

  const getState = useLatestCallback(() => stateRef.current);

  const subscribe = useLatestCallback((callback: () => void) => {
    listeners.current.push(callback);

    return () => {
      listeners.current = listeners.current.filter((cb) => cb !== callback);
    };
  });

  React.useLayoutEffect(() => {
    stateRef.current = state;
    listeners.current.forEach((callback) => callback());
  }, [state]);

  const context = React.useMemo(
    () => ({
      getState,
      subscribe,
    }),
    [getState, subscribe]
  );

  return (
    <NavigationStateListenerContext.Provider value={context}>
      {children}
    </NavigationStateListenerContext.Provider>
  );
}

const NavigationStateListenerContext = React.createContext<
  | {
      getState: () => NavigationState<ParamListBase>;
      subscribe: (callback: () => void) => () => void;
    }
  | undefined
>(undefined);
