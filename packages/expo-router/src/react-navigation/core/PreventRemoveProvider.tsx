import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import useLatestCallback from 'use-latest-callback';

import { NavigationHelpersContext } from './NavigationHelpersContext';
import { NavigationRouteContext } from './NavigationProvider';
import {
  type PreventedRoutes,
  PreventRemoveContext,
} from './PreventRemoveContext';

type Props = {
  children: React.ReactNode;
};

type PreventedRoutesMap = Map<
  string,
  {
    routeKey: string;
    preventRemove: boolean;
  }
>;

/**
 * Util function to transform map of prevented routes to a simpler object.
 */
const transformPreventedRoutes = (
  preventedRoutesMap: PreventedRoutesMap
): PreventedRoutes => {
  const preventedRoutesToTransform = [...preventedRoutesMap.values()];

  const preventedRoutes = preventedRoutesToTransform.reduce<PreventedRoutes>(
    (acc, { routeKey, preventRemove }) => {
      acc[routeKey] = {
        preventRemove: acc[routeKey]?.preventRemove || preventRemove,
      };
      return acc;
    },
    {}
  );

  return preventedRoutes;
};

/**
 * Component used for managing which routes have to be prevented from removal in native-stack.
 */
export function PreventRemoveProvider({ children }: Props) {
  const [parentId] = React.useState(() => nanoid());
  const [preventedRoutesMap, setPreventedRoutesMap] =
    React.useState<PreventedRoutesMap>(() => new Map());

  const navigation = React.useContext(NavigationHelpersContext);
  const route = React.useContext(NavigationRouteContext);

  const preventRemoveContextValue = React.useContext(PreventRemoveContext);
  // take `setPreventRemove` from parent context - if exist it means we're in a nested context
  const setParentPrevented = preventRemoveContextValue?.setPreventRemove;

  const setPreventRemove = useLatestCallback(
    (id: string, routeKey: string, preventRemove: boolean): void => {
      if (
        preventRemove &&
        (navigation == null ||
          navigation
            ?.getState()
            .routes.every((route) => route.key !== routeKey))
      ) {
        throw new Error(
          `Couldn't find a route with the key ${routeKey}. Is your component inside NavigationContent?`
        );
      }

      setPreventedRoutesMap((prevPrevented) => {
        // values haven't changed - do nothing
        if (
          routeKey === prevPrevented.get(id)?.routeKey &&
          preventRemove === prevPrevented.get(id)?.preventRemove
        ) {
          return prevPrevented;
        }

        const nextPrevented = new Map(prevPrevented);

        if (preventRemove) {
          nextPrevented.set(id, {
            routeKey,
            preventRemove,
          });
        } else {
          nextPrevented.delete(id);
        }

        return nextPrevented;
      });
    }
  );

  const isPrevented = [...preventedRoutesMap.values()].some(
    ({ preventRemove }) => preventRemove
  );

  React.useEffect(() => {
    if (route?.key !== undefined && setParentPrevented !== undefined) {
      // when route is defined (and setParentPrevented) it means we're in a nested stack
      // route.key then will be the route key of parent
      setParentPrevented(parentId, route.key, isPrevented);
      return () => {
        setParentPrevented(parentId, route.key, false);
      };
    }

    return;
  }, [parentId, isPrevented, route?.key, setParentPrevented]);

  const value = React.useMemo(
    () => ({
      setPreventRemove,
      preventedRoutes: transformPreventedRoutes(preventedRoutesMap),
    }),
    [setPreventRemove, preventedRoutesMap]
  );

  return (
    <PreventRemoveContext.Provider value={value}>
      {children}
    </PreventRemoveContext.Provider>
  );
}
