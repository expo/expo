import { screen } from '@testing-library/react-native';
import { use } from 'react';
import { Text, View } from 'react-native';

import type { SuspenseFallbackProps } from '../exports';
import { Slot } from '../exports';
import { renderRouter } from '../testing-library';

const renderFallback = (route: string, testID = 'custom-fallback') => (
  <View testID={testID}>
    <Text>Loading {route}...</Text>
  </View>
);

it('inherits `<SuspenseFallback>` from the nearest layout in sync mode', () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const LayoutFallback = jest.fn(({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'layout-fallback')
  );

  renderRouter(
    {
      '(app)/_layout': {
        default: () => <Slot />,
        SuspenseFallback: LayoutFallback,
      },
      '(app)/profile/[id]': SuspendingRoute,
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('layout-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./(app)/profile/[id].js...')).toBeOnTheScreen();
  expect(LayoutFallback).toHaveBeenCalledTimes(1);
});

it('uses the nearest layout `<SuspenseFallback>` in sync mode', () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const RootFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'root-layout-fallback');
  const NestedFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'nested-layout-fallback');

  renderRouter(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: RootFallback,
      },
      '(app)/_layout': {
        default: () => <Slot />,
        SuspenseFallback: NestedFallback,
      },
      '(app)/profile/[id]': SuspendingRoute,
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('nested-layout-fallback')).toBeOnTheScreen();
  expect(screen.queryByTestId('root-layout-fallback')).toBeNull();
  expect(screen.getByText('Loading ./(app)/profile/[id].js...')).toBeOnTheScreen();
});

it('passes route params to layout-level `<SuspenseFallback>`', () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const LayoutFallback = jest.fn(({ route, params }: SuspenseFallbackProps) => (
    <View testID="layout-fallback">
      <Text>
        Loading {route} with id={params.id}...
      </Text>
    </View>
  ));

  renderRouter(
    {
      '(app)/_layout': {
        default: () => <Slot />,
        SuspenseFallback: LayoutFallback,
      },
      '(app)/profile/[id]': SuspendingRoute,
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('layout-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./(app)/profile/[id].js with id=123...')).toBeOnTheScreen();
  expect(LayoutFallback).toHaveBeenCalledWith(
    {
      route: './(app)/profile/[id].js',
      params: {
        id: '123',
      },
    },
    undefined
  );
});

it('renders default `<SuspenseFallback>` when one is not available', () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  renderRouter({
    index: SuspendingRoute,
  });

  expect(screen.getByText('Bundling...')).toBeOnTheScreen();
  expect(screen.queryByTestId('route-content')).toBeNull();
});
