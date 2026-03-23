import * as React from 'react';

/**
 * A type of an object that have a route key as an object key
 * and a value whether to prevent that route.
 */
export type PreventedRoutes = Record<string, { preventRemove: boolean }>;

export const PreventRemoveContext = React.createContext<
  | {
      preventedRoutes: PreventedRoutes;
      setPreventRemove: (
        id: string,
        routeKey: string,
        preventRemove: boolean
      ) => void;
    }
  | undefined
>(undefined);
