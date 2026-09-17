import { act, screen } from '@testing-library/react-native';
import { use } from 'react';
import { Text, View } from 'react-native';

import type { SuspenseFallbackProps } from '../exports';
import { Slot } from '../exports';
import { Stack } from '../layouts/Stack';
import { renderRouterAsync } from '../testing-library';
import type { FileStub } from '../testing-library/context-stubs';

// Load route modules through `React.lazy`, like async routes do on web.
jest.mock('../import-mode', () => ({ __esModule: true, default: 'lazy' }));

/** A route module that resolves when the test decides the "chunk" has loaded. */
function deferredModule() {
  let resolve!: (module: FileStub) => void;
  const promise = new Promise<FileStub>((res) => {
    resolve = res;
  });
  return {
    promise,
    async load(module: FileStub) {
      await act(async () => {
        resolve(module);
      });
    },
  };
}

const fallback = (testID: string) =>
  function Fallback({ route }: SuspenseFallbackProps) {
    return (
      <View testID={testID}>
        <Text>Loading {route}...</Text>
      </View>
    );
  };

function RouteContent() {
  return <Text testID="route-content">Loaded</Text>;
}

function createSuspendingRoute() {
  const pending = new Promise<string>(() => {});
  return function SuspendingRoute() {
    const value = use(pending);
    return <Text testID="route-content">{value}</Text>;
  };
}

it('uses the layout export while a child route module loads', async () => {
  const route = deferredModule();

  await renderRouterAsync({
    _layout: {
      default: () => <Slot />,
      SuspenseFallback: fallback('layout-fallback'),
    },
    index: route.promise,
  });

  expect(screen.getByTestId('layout-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./index.js...')).toBeOnTheScreen();
  expect(screen.queryByTestId('route-content')).toBeNull();

  await route.load({ default: RouteContent });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-fallback')).toBeNull();
});

it('uses the built-in fallback while the root layout loads, then its export for children', async () => {
  const layout = deferredModule();
  const route = deferredModule();

  await renderRouterAsync({
    _layout: layout.promise,
    index: route.promise,
  });

  // The layout module has not loaded, so it cannot supply a fallback yet.
  expect(screen.getByText('Bundling...')).toBeOnTheScreen();

  await layout.load({
    default: () => <Slot />,
    SuspenseFallback: fallback('layout-fallback'),
  });

  expect(screen.getByTestId('layout-fallback')).toBeOnTheScreen();
  expect(screen.queryByText('Bundling...')).toBeNull();

  await route.load({ default: RouteContent });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-fallback')).toBeNull();
});

it('uses the ancestor fallback while a nested layout loads, then the nested export', async () => {
  const nestedLayout = deferredModule();
  const route = deferredModule();

  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: fallback('root-fallback'),
      },
      'nested/_layout': nestedLayout.promise,
      'nested/index': route.promise,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('root-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./nested/_layout.js...')).toBeOnTheScreen();

  await nestedLayout.load({
    default: () => <Slot />,
    SuspenseFallback: fallback('nested-fallback'),
  });

  expect(screen.getByTestId('nested-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./nested/index.js...')).toBeOnTheScreen();
  expect(screen.queryByTestId('root-fallback')).toBeNull();

  await route.load({ default: RouteContent });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
  expect(screen.queryByTestId('nested-fallback')).toBeNull();
});

it('uses the inherited fallback while a layout module loads, then its own export when it suspends on data', async () => {
  const nestedLayout = deferredModule();
  let resolveData!: (value: string) => void;
  const data = new Promise<string>((resolve) => {
    resolveData = resolve;
  });
  function SuspendingLayout() {
    use(data);
    return <Slot />;
  }

  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: fallback('root-fallback'),
      },
      'nested/_layout': nestedLayout.promise,
      'nested/index': () => <Text testID="route-content">Nested</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('root-fallback')).toBeOnTheScreen();

  await nestedLayout.load({
    default: SuspendingLayout,
    SuspenseFallback: fallback('nested-fallback'),
  });

  // The module has loaded, so the layout's own data suspension uses its own export.
  expect(screen.getByTestId('nested-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./nested/_layout.js...')).toBeOnTheScreen();
  expect(screen.queryByTestId('root-fallback')).toBeNull();

  await act(async () => {
    resolveData('ready');
  });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
  expect(screen.queryByTestId('nested-fallback')).toBeNull();
});

it('uses the navigator `suspenseFallback` prop before the layout export', async () => {
  const route = deferredModule();

  await renderRouterAsync({
    _layout: {
      default: () => <Stack suspenseFallback={fallback('navigator-fallback')} />,
      SuspenseFallback: fallback('layout-fallback'),
    },
    index: route.promise,
  });

  expect(screen.getByTestId('navigator-fallback')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-fallback')).toBeNull();

  await route.load({ default: RouteContent });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
});

it('uses the built-in fallback when a nested navigator sets `suspenseFallback` to `null`', async () => {
  const route = deferredModule();

  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: fallback('root-fallback'),
      },
      'nested/_layout': () => <Slot suspenseFallback={null} />,
      'nested/index': route.promise,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByText('Bundling...')).toBeOnTheScreen();
  expect(screen.queryByTestId('root-fallback')).toBeNull();

  await route.load({ default: RouteContent });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
});

it('uses the inherited fallback when a loaded route suspends on data', async () => {
  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: fallback('layout-fallback'),
      },
      '(app)/_layout': () => <Slot />,
      '(app)/profile/[id]': createSuspendingRoute(),
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.getByTestId('layout-fallback')).toBeOnTheScreen();
  expect(screen.getByText('Loading ./(app)/profile/[id].js...')).toBeOnTheScreen();
  expect(screen.queryByTestId('route-content')).toBeNull();
});

it('passes route params to the fallback while a route module loads', async () => {
  const route = deferredModule();
  const LayoutFallback = jest.fn(({ route, params }: SuspenseFallbackProps) => (
    <Text testID="layout-fallback">
      Loading {route} with id={params.id}...
    </Text>
  ));

  await renderRouterAsync(
    {
      _layout: {
        default: () => <Slot />,
        SuspenseFallback: LayoutFallback,
      },
      'profile/[id]': route.promise,
    },
    { initialUrl: '/profile/123' }
  );

  expect(screen.getByText('Loading ./profile/[id].js with id=123...')).toBeOnTheScreen();
  expect(LayoutFallback).toHaveBeenCalledWith(
    { route: './profile/[id].js', params: { id: '123' } },
    undefined
  );

  await route.load({ default: RouteContent });

  expect(screen.getByTestId('route-content')).toBeOnTheScreen();
});
