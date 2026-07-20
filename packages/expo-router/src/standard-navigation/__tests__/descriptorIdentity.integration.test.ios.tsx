import { Fragment, useEffect } from 'react';
import { View } from 'react-native';

import { router } from '../../imperative-api';
import type { ParamListBase } from '../../react-navigation/core';
import {
  StackRouter,
  type StackActionHelpers,
  type StackNavigationState,
  type StackRouterOptions,
} from '../../react-navigation/native';
import { act, renderRouter } from '../../testing-library';
import { unstable_createStandardRouterNavigator } from '../index';
import type { NavigatorContentProps } from '../types';

type EventMap = Record<string, { data: object | undefined; canPreventDefault: boolean }>;
type CreateProps = { getRouteNavigation: (key: string) => object };

let contentArgs: NavigatorContentProps<object, EventMap, object, CreateProps> | undefined;

function Content(args: NavigatorContentProps<object, EventMap, object, CreateProps>) {
  contentArgs = args;
  return args.state.routes.map((route) => (
    <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
  ));
}

const Stack = unstable_createStandardRouterNavigator<
  object,
  StackNavigationState<ParamListBase>,
  EventMap,
  object,
  StackRouterOptions,
  CreateProps,
  StackActionHelpers<ParamListBase>
>(Content, StackRouter, {
  createProps: ({ descriptors }) => ({
    getRouteNavigation: (key) => descriptors[key]!.navigation,
  }),
});

it('preserves the preloaded route and rendered element through promotion', () => {
  let mounts = 0;
  const Second = () => {
    useEffect(() => {
      mounts++;
    }, []);
    return <View />;
  };

  renderRouter({
    _layout: () => <Stack />,
    index: () => <View />,
    second: Second,
  });

  act(() => router.prefetch('/second'));

  const preloadedRoute = contentArgs!.state.routes.find((route) => route.name === 'second')!;
  const navigation = contentArgs!.getRouteNavigation(preloadedRoute.key);
  expect(mounts).toBe(1);

  act(() => router.push('/second'));

  const focusedRoute = contentArgs!.state.routes[contentArgs!.state.index]!;
  expect(focusedRoute.key).toBe(preloadedRoute.key);
  expect(contentArgs!.getRouteNavigation(focusedRoute.key)).toBe(navigation);
  expect(mounts).toBe(1);
});
