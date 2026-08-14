import * as React from 'react';

import { RouterRegistryProvider } from '../../../../global-state/routerRegistry';
import type { InitialState } from '../../types';
import { BaseNavigationContainer as BaseNavigationContainerImpl } from '../../BaseNavigationContainer';
import { MockRouterKey } from './MockRouter';

function completeState(
  state: InitialState | null | undefined
): InitialState | null | undefined {
  if (state == null || state.stale === false) {
    return state;
  }

  const routes = state.routes.map((route) => ({
    ...route,
    key: route.key ?? `${route.name}-${MockRouterKey.current++}`,
  }));
  const key = state.key ?? String(MockRouterKey.current++);

  return {
    ...state,
    stale: false,
    type: state.type ?? 'test',
    key,
    index: state.index ?? 0,
    routeNames: state.routeNames ?? [...new Set(state.routes.map((route) => route.name))],
    routes: routes.map((route) =>
      route.state === undefined ? route : { ...route, state: completeState(route.state) }
    ),
  };
}

export function BaseNavigationContainer(
  props: React.ComponentProps<typeof BaseNavigationContainerImpl>
) {
  return (
    <RouterRegistryProvider>
      <BaseNavigationContainerImpl {...props} initialState={completeState(props.initialState)} />
    </RouterRegistryProvider>
  );
}
