'use client';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import { use } from 'react';

import { isRoutePreloadedInStack } from '../../utils/stack';
import useLatestCallback from '../../utils/useLatestCallback';
import type { NavigationState } from '../routers';
import { NavigationRouteContext } from './NavigationProvider';
import { type PreventedRoutes, PreventRemoveContext } from './PreventRemoveContext';

type Props = {
  getState: () => NavigationState;
  state: NavigationState;
};

export type IsRoutePrevented = (routeKey: string) => boolean;

type PreventedRouteEntry = {
  routeKey: string;
  preventRemove: boolean;
};

const transformPreventedRoutes = (entries: PreventedRouteEntry[]): PreventedRoutes => {
  return entries.reduce<PreventedRoutes>((result, { routeKey, preventRemove }) => {
    result[routeKey] = {
      preventRemove: result[routeKey]?.preventRemove || preventRemove,
    };
    return result;
  }, {});
};

/**
 * Hook used for exposing removal prevention state to navigator views.
 */
export function usePreventRemoveState({ getState, state }: Props) {
  'use no memo';
  const [parentId] = React.useState(() => nanoid());
  const entriesRef = React.useRef(new Map<string, PreventedRouteEntry>());
  const [entries, setEntries] = React.useState(entriesRef.current);

  const route = use(NavigationRouteContext);
  const parentContext = use(PreventRemoveContext);
  const setParentPrevented = parentContext?.setPreventRemove;

  const setPreventRemove = useLatestCallback(
    (id: string, routeKey: string, preventRemove: boolean): void => {
      if (preventRemove && getState().routes.every((route) => route.key !== routeKey)) {
        throw new Error(
          `Couldn't find a route with the key ${routeKey}. Is your component inside NavigationContent?`
        );
      }

      const previous = entriesRef.current;
      const existing = previous.get(id);
      if (
        (!preventRemove && existing === undefined) ||
        (existing?.routeKey === routeKey && existing.preventRemove === preventRemove)
      ) {
        return;
      }

      const next = new Map(previous);
      if (preventRemove) {
        next.set(id, { routeKey, preventRemove: true });
      } else {
        next.delete(id);
      }
      entriesRef.current = next;
      setEntries(next);

      if (route?.key !== undefined && setParentPrevented !== undefined) {
        const state = getState();
        const hasActiveEntry = [...next.values()].some(
          (entry) => entry.preventRemove && !isRoutePreloadedInStack(state, { key: entry.routeKey })
        );
        setParentPrevented(parentId, route.key, hasActiveEntry);
      }
    }
  );

  const activeEntries = React.useMemo(
    () =>
      [...entries.values()].filter(
        ({ routeKey }) => !isRoutePreloadedInStack(state, { key: routeKey })
      ),
    [entries, state]
  );
  const isPrevented = activeEntries.some(({ preventRemove }) => preventRemove);

  const isRoutePrevented = useLatestCallback((routeKey: string) =>
    [...entriesRef.current.values()].some(
      (entry) =>
        entry.routeKey === routeKey &&
        entry.preventRemove &&
        !isRoutePreloadedInStack(getState(), { key: routeKey })
    )
  );

  React.useEffect(() => {
    if (route?.key !== undefined && setParentPrevented !== undefined) {
      setParentPrevented(parentId, route.key, isPrevented);
      return () => setParentPrevented(parentId, route.key, false);
    }

    return undefined;
  }, [parentId, isPrevented, route?.key, setParentPrevented]);

  const preventRemoveContextValue = React.useMemo(
    () => ({
      setPreventRemove,
      preventedRoutes: transformPreventedRoutes(activeEntries),
    }),
    [activeEntries, setPreventRemove]
  );

  return { isRoutePrevented, preventRemoveContextValue };
}
