import * as React from 'react';

type Props = {
  children: React.ReactNode;
};

const MULTIPLE_NAVIGATOR_ERROR = `Another navigator is already registered for this container. You likely have multiple navigators under a single "NavigationContainer" or "Screen". Make sure each navigator is under a separate "Screen" container. See https://reactnavigation.org/docs/nesting-navigators for a guide on nesting.`;

export const SingleNavigatorContext = React.createContext<
  | {
      register(key: string): void;
      unregister(key: string): void;
    }
  | undefined
>(undefined);

/**
 * Component which ensures that there's only one navigator nested under it.
 */
export function EnsureSingleNavigator({ children }: Props) {
  const navigatorKeyRef = React.useRef<string | undefined>(undefined);

  const value = React.useMemo(
    () => ({
      register(key: string) {
        const currentKey = navigatorKeyRef.current;

        if (currentKey !== undefined && key !== currentKey) {
          throw new Error(MULTIPLE_NAVIGATOR_ERROR);
        }

        navigatorKeyRef.current = key;
      },
      unregister(key: string) {
        const currentKey = navigatorKeyRef.current;

        if (key !== currentKey) {
          return;
        }

        navigatorKeyRef.current = undefined;
      },
    }),
    []
  );

  return (
    <SingleNavigatorContext.Provider value={value}>
      {children}
    </SingleNavigatorContext.Provider>
  );
}
