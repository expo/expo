import { Fragment } from 'react';
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
type Descriptor = { options: object; render: () => React.ReactNode };

const mockProjection: {
  raw?: Record<string, Descriptor>;
  projected?: Record<string, Descriptor>;
  described: Map<string, Descriptor>;
} = { described: new Map() };

jest.mock('../useProjectedDescriptors', () => {
  const actual = jest.requireActual(
    '../useProjectedDescriptors'
  ) as typeof import('../useProjectedDescriptors');
  return {
    useProjectedDescriptors: (
      state: StackNavigationState<ParamListBase>,
      descriptors: Record<string, Descriptor>,
      describe: (route: StackNavigationState<ParamListBase>['routes'][number], placeholder: boolean) => Descriptor
    ) => {
      mockProjection.raw = descriptors;
      const projected = actual.useProjectedDescriptors(state, descriptors, (route, placeholder) => {
        const descriptor = describe(route, placeholder);
        mockProjection.described.set(route.key, descriptor);
        return descriptor;
      });
      mockProjection.projected = projected;
      return projected;
    },
  };
});

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

it('passes builder and described descriptor objects through unchanged', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <View />,
    second: () => <View />,
  });

  const activeKey = contentArgs!.state.routes[0]!.key;
  expect(contentArgs!.descriptors[activeKey]).toBe(mockProjection.raw![activeKey]);

  act(() => router.prefetch('/second'));

  const preloadedKey = contentArgs!.state.routes.find((route) => route.name === 'second')!.key;
  expect(contentArgs!.descriptors[preloadedKey]).toBe(mockProjection.described.get(preloadedKey));
  expect(contentArgs!.descriptors).toBe(mockProjection.projected);
});
