import { useEffect } from 'react';
import { View } from 'react-native';

import { router } from '../../../imperative-api';
import type { ParamListBase } from '../../../react-navigation/core';
import {
  StackRouter,
  type StackNavigationState,
  type StackRouterOptions,
} from '../../../react-navigation/native';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
import { unstable_integrateWithRouter } from '../../../standard-navigation';
import { act, renderRouter } from '../../../testing-library';
import {
  createStandardNativeStackNavigator,
  type NativeStackNavigatorCreateProps,
  type StandardNativeStackEventMap,
} from '../createNativeStackNavigator';

it('declares a standard-navigation navigator', () => {
  expect(createStandardNativeStackNavigator).toMatchObject({
    type: 'standard',
    version: 1,
    NavigatorContent: expect.any(Function),
  });
});

it('receives only the standard args and narrow create props without losing preload identity', () => {
  const OriginalContent = createStandardNativeStackNavigator.NavigatorContent;
  type ContentProps = React.ComponentProps<typeof OriginalContent>;
  let contentProps: ContentProps | undefined;

  const instrumentedNavigator: typeof createStandardNativeStackNavigator = {
    ...createStandardNativeStackNavigator,
    NavigatorContent: (props) => {
      contentProps = props;
      return <OriginalContent {...props} />;
    },
  };
  const Stack = unstable_integrateWithRouter<
    NativeStackNavigationOptions,
    StackNavigationState<ParamListBase>,
    StandardNativeStackEventMap,
    object,
    StackRouterOptions,
    NativeStackNavigatorCreateProps
  >(instrumentedNavigator, StackRouter, {
    createProps: () => ({
      pop: jest.fn(),
      removeRoutes: jest.fn(),
      subscribePopToTopOnParentTabPress: jest.fn(),
    }),
  });
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

  expect(Object.keys(contentProps!).sort()).toEqual([
    'actions',
    'descriptors',
    'emitter',
    'pop',
    'removeRoutes',
    'state',
    'subscribePopToTopOnParentTabPress',
  ]);
  expect(contentProps).not.toHaveProperty('navigation');

  act(() => router.prefetch('/second'));
  const preloadedRoute = contentProps!.state.routes.find((route) => route.name === 'second')!;
  const navigation = (
    contentProps!.descriptors[preloadedRoute.key] as unknown as { navigation: object }
  ).navigation;
  expect(mounts).toBe(1);

  act(() => router.push('/second'));
  const focusedRoute = contentProps!.state.routes[contentProps!.state.index]!;
  expect(focusedRoute.key).toBe(preloadedRoute.key);
  expect(
    (contentProps!.descriptors[focusedRoute.key] as unknown as { navigation: object }).navigation
  ).toBe(navigation);
  expect(mounts).toBe(1);
});
