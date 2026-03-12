import { screen } from '@testing-library/react-native';
import React, { use } from 'react';
import { Text, View } from 'react-native';

import { Slot, SuspenseFallbackProps } from '../exports';
import { renderRouter } from '../testing-library';

const renderFallback = (route: string, testID = 'custom-fallback') => (
  <View testID={testID}>
    <Text>Loading {route}...</Text>
  </View>
);

it('renders custom `<SuspenseFallback>` when one is available', () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const CustomFallback = ({ route }: SuspenseFallbackProps) => renderFallback(route);

  renderRouter({
    index: {
      default: SuspendingRoute,
      SuspenseFallback: CustomFallback,
    },
  });

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('custom-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./index.js...')).toBeOnTheScreen();
});

it('passes the full nested route path to custom `<SuspenseFallback>`', () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const CustomFallback = ({ route }: SuspenseFallbackProps) => renderFallback(route);

  renderRouter(
    {
      '(app)/_layout': () => <Slot />,
      '(app)/profile/[id]': {
        default: SuspendingRoute,
        SuspenseFallback: CustomFallback,
      },
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('custom-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./(app)/profile/[id].js...')).toBeOnTheScreen();
});

it('inherits `<SuspenseFallback>` from the nearest layout in sync mode', () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const LayoutFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'layout-fallback');

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
});

it('prefers route `<SuspenseFallback>` over inherited layout fallback in sync mode', () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const LayoutFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'layout-fallback');
  const RouteFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'route-fallback');

  renderRouter(
    {
      '(app)/_layout': {
        default: () => <Slot />,
        SuspenseFallback: LayoutFallback,
      },
      '(app)/profile/[id]': {
        default: SuspendingRoute,
        SuspenseFallback: RouteFallback,
      },
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.getByTestId('route-fallback')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-fallback')).toBeNull();
  expect(screen.getByText('Loading ./(app)/profile/[id].js...')).toBeOnTheScreen();
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

it('renders default `<SuspenseFallback>` when one is not available', () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  renderRouter({
    index: SuspendingRoute,
  });

  expect(screen.queryByTestId('route-content')).toBeNull();
  expect(screen.queryByTestId('custom-fallback')).toBeNull();
});
