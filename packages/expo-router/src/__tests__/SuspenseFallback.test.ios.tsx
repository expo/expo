import { screen } from '@testing-library/react-native';
import { use } from 'react';
import { Text, View } from 'react-native';

import type { SuspenseFallbackProps } from '../exports';
import { Slot } from '../exports';
import { Stack } from '../layouts/Stack';
import { renderRouterAsync } from '../testing-library';
import { Navigator } from '../views/Navigator';

const renderFallback = (route: string, testID = 'custom-fallback') => (
  <View testID={testID}>
    <Text>Loading {route}...</Text>
  </View>
);

it('inherits `<SuspenseFallback>` from the nearest layout in sync mode', async () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const LayoutFallback = jest.fn(({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'layout-fallback')
  );

  await renderRouterAsync(
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

it('uses the nearest layout `<SuspenseFallback>` in sync mode', async () => {
  const pending = new Promise<string>(() => {});

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  const RootFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'root-layout-fallback');
  const NestedFallback = ({ route }: SuspenseFallbackProps) =>
    renderFallback(route, 'nested-layout-fallback');

  await renderRouterAsync(
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

it('passes route params to layout-level `<SuspenseFallback>`', async () => {
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

  await renderRouterAsync(
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

it('renders default `<SuspenseFallback>` when one is not available', async () => {
  const pending = new Promise<string>(() => {}); // Promise that never resolves

  function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  }

  await renderRouterAsync({
    index: SuspendingRoute,
  });

  expect(screen.getByText('Bundling...')).toBeOnTheScreen();
  expect(screen.queryByTestId('route-content')).toBeNull();
});

function createSuspendingRoute() {
  const pending = new Promise<string>(() => {});
  return function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  };
}

const fallback = (testID: string) =>
  function Fallback({ route }: SuspenseFallbackProps) {
    return renderFallback(route, testID);
  };

it('uses the navigator `suspenseFallback` prop before the layout export', async () => {
  const LayoutFallback = fallback('layout-fallback');
  const NavigatorFallback = fallback('navigator-fallback');

  await renderRouterAsync({
    _layout: {
      default: () => <Stack suspenseFallback={NavigatorFallback} />,
      SuspenseFallback: LayoutFallback,
    },
    index: createSuspendingRoute(),
  });

  expect(screen.getByTestId('navigator-fallback')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-fallback')).toBeNull();
  expect(screen.queryByTestId('route-content')).toBeNull();
});

it('inherits the navigator `suspenseFallback` prop in nested layouts', async () => {
  const NavigatorFallback = fallback('navigator-fallback');

  await renderRouterAsync(
    {
      _layout: () => <Stack suspenseFallback={NavigatorFallback} />,
      'nested/_layout': () => <Stack />,
      'nested/index': createSuspendingRoute(),
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('navigator-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./nested/index.js...')).toBeOnTheScreen();
});

it('uses a nested layout export before an inherited navigator `suspenseFallback` prop', async () => {
  const NavigatorFallback = fallback('navigator-fallback');
  const NestedFallback = fallback('nested-layout-fallback');

  await renderRouterAsync(
    {
      _layout: () => <Stack suspenseFallback={NavigatorFallback} />,
      'nested/_layout': {
        default: () => <Stack />,
        SuspenseFallback: NestedFallback,
      },
      'nested/index': createSuspendingRoute(),
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('nested-layout-fallback')).toBeOnTheScreen();
  expect(screen.queryByTestId('navigator-fallback')).toBeNull();
});

it('uses the built-in fallback when `suspenseFallback` is `null`', async () => {
  const RootFallback = fallback('root-layout-fallback');

  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: RootFallback,
      },
      'nested/_layout': () => <Slot suspenseFallback={null} />,
      'nested/index': createSuspendingRoute(),
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByText('Bundling...')).toBeOnTheScreen();
  expect(screen.queryByTestId('root-layout-fallback')).toBeNull();
});

it('uses the layout export when the layout itself suspends on data', async () => {
  const pending = new Promise<string>(() => {});
  function SuspendingLayout() {
    use(pending);
    return <Slot />;
  }

  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: fallback('root-layout-fallback'),
      },
      'nested/_layout': {
        default: SuspendingLayout,
        SuspenseFallback: fallback('nested-layout-fallback'),
      },
      'nested/index': () => <Text testID="route-content">Nested</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('nested-layout-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./nested/_layout.js...')).toBeOnTheScreen();
  expect(screen.queryByTestId('root-layout-fallback')).toBeNull();
  expect(screen.queryByTestId('route-content')).toBeNull();
});

it('supports `suspenseFallback` on a custom navigator', async () => {
  const NavigatorFallback = fallback('navigator-fallback');

  await renderRouterAsync({
    _layout: () => (
      <Navigator suspenseFallback={NavigatorFallback}>
        <Navigator.Slot />
      </Navigator>
    ),
    index: createSuspendingRoute(),
  });

  expect(screen.getByTestId('navigator-fallback')).toBeOnTheScreen();
});

it('ignores a `SuspenseFallback` exported from a route and warns', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const LayoutFallback = fallback('layout-fallback');
  const RouteFallback = fallback('route-fallback');

  try {
    await renderRouterAsync({
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: LayoutFallback,
      },
      index: {
        default: createSuspendingRoute(),
        SuspenseFallback: RouteFallback,
      },
    });

    expect(screen.getByTestId('layout-fallback')).toBeOnTheScreen();
    expect(screen.queryByTestId('route-fallback')).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Route "./index.js" exports SuspenseFallback')
    );
  } finally {
    warn.mockRestore();
  }
});
