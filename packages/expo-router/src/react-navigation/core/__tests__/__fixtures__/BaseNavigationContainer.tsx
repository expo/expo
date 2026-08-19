import * as React from 'react';
import { nanoid } from 'nanoid/non-secure';

import { RouterRegistryProvider } from '../../../../global-state/routerRegistry';
import { ImperativeApiEmitter } from '../../../../imperative-api';
import type { NavigationState, ParamListBase, PartialState } from '../../../routers';
import type { NavigationContainerRef } from '../../types';
import { BaseNavigationContainer as BaseNavigationContainerImpl } from '../../BaseNavigationContainer';
import { MockRouterKey } from './MockRouter';

type TestInitialState = NavigationState | PartialState<NavigationState>;
type Props = Omit<React.ComponentProps<typeof BaseNavigationContainerImpl>, 'initialState'> & {
  initialState?: TestInitialState;
};

function getInitialState(children: React.ReactNode): NavigationState {
  const navigator = React.Children.toArray(children).find((child) => React.isValidElement(child));
  if (!React.isValidElement<{ children?: React.ReactNode; initialRouteName?: string }>(navigator)) {
    return {
      stale: false,
      routeKeySeq: 0,
      key: `navigator-${nanoid()}`,
      index: -1,
      routeNames: [],
      routes: [],
    };
  }

  const screens: React.ReactElement<{
    children?: React.ReactNode | (() => React.ReactNode);
    name?: string;
  }>[] = [];

  function collectScreens(node: React.ReactNode) {
    React.Children.forEach(node, (child) => {
      if (
        !React.isValidElement<{
          children?: React.ReactNode | (() => React.ReactNode);
          name?: string;
        }>(child)
      ) {
        return;
      }
      if (typeof child.props.name === 'string') {
        screens.push(child);
      } else {
        if (typeof child.props.children !== 'function') {
          collectScreens(child.props.children);
        }
      }
    });
  }

  collectScreens(navigator.props.children);

  const routeNames = screens.map((screen) => screen.props.name!);
  const name = routeNames.includes(navigator.props.initialRouteName ?? '')
    ? navigator.props.initialRouteName
    : routeNames[0];
  const screen = screens.find((screen) => screen.props.name === name);
  nanoid();
  const routes: NavigationState['routes'] =
    name === undefined ? [] : [{ key: `${name}-${nanoid()}`, name }];
  const key = `navigator-${nanoid()}`;

  if (screen && typeof screen.props.children === 'function' && screen.props.children.length === 0) {
    const nested = screen.props.children();
    if (React.isValidElement(nested)) {
      nanoid();
      routes[0] = { ...routes[0]!, state: getInitialState(nested) };
    }
  }

  const nanoidMock = require('nanoid/non-secure');
  if (typeof nanoidMock.__key === 'number') {
    nanoidMock.__key--;
  }

  return {
    stale: false,
    routeKeySeq: 0,
    key,
    index: routes.length - 1,
    routeNames,
    routes,
  };
}

function completeState(
  state: TestInitialState | null | undefined,
  children: React.ReactNode
): NavigationState {
  if (state == null) {
    return getInitialState(children);
  }
  if (
    'stale' in state &&
    state.stale === false &&
    state.routes.every(
      (route) => route.state === undefined || ('stale' in route.state && route.state.stale === false)
    )
  ) {
    return state;
  }

  const routes: NavigationState['routes'] = state.routes.map((route) => ({
    ...route,
    key: ('key' in route && route.key) || `${route.name}-${MockRouterKey.current++}`,
  }));
  const key = ('key' in state && state.key) || String(MockRouterKey.current++);

  return {
    ...state,
    stale: false,
    routeKeySeq: 0,
    type: state.type ?? 'test',
    key,
    index: state.index ?? 0,
    routeNames: state.routeNames ?? [...new Set(state.routes.map((route) => route.name))],
    routes: routes.map((route) =>
      route.state === undefined ? route : { ...route, state: completeState(route.state, undefined) }
    ),
  };
}

export function BaseNavigationContainer(props: Props) {
  const { ref, ...rest } = props;
  const navigationRef = React.useRef<NavigationContainerRef<ParamListBase> | null>(null);

  const setRef = React.useCallback(
    (navigation: NavigationContainerRef<ParamListBase> | null) => {
      navigationRef.current = navigation;
      if (typeof ref === 'function') {
        ref(navigation);
      } else if (ref) {
        ref.current = navigation;
      }
    },
    [ref]
  );

  return (
    <RouterRegistryProvider>
      <BaseNavigationContainerImpl
        {...rest}
        ref={setRef}
        initialState={completeState(rest.initialState, rest.children)}
      />
      <ImperativeApiEmitter navigationRef={navigationRef} />
    </RouterRegistryProvider>
  );
}
