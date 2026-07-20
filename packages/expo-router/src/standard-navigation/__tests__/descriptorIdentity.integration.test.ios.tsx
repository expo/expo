import { Fragment, useEffect } from 'react';
import { View } from 'react-native';
import type { NavigatorArgs } from 'standard-navigation';

import { router } from '../../imperative-api';
import type { ParamListBase } from '../../react-navigation/core';
import {
  StackRouter,
  type StackNavigationState,
  type StackRouterOptions,
} from '../../react-navigation/native';
import { act, renderRouter } from '../../testing-library';
import { unstable_createStandardRouterNavigator } from '../index';

type EventMap = Record<string, { data: object | undefined; canPreventDefault: boolean }>;
type Descriptor = { navigation: object; options: object; render: () => React.ReactNode };

let contentArgs: NavigatorArgs<object, EventMap> | undefined;

function Content(args: NavigatorArgs<object, EventMap>) {
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
  StackRouterOptions
>(Content, StackRouter);

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
  const descriptor = contentArgs!.descriptors[preloadedRoute.key] as Descriptor;
  const navigation = descriptor.navigation;
  expect(mounts).toBe(1);

  act(() => router.push('/second'));

  const focusedRoute = contentArgs!.state.routes[contentArgs!.state.index]!;
  expect(focusedRoute.key).toBe(preloadedRoute.key);
  expect((contentArgs!.descriptors[focusedRoute.key] as Descriptor).navigation).toBe(navigation);
  expect(mounts).toBe(1);
});
