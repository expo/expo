import { screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import type { ErrorBoundaryProps } from '../exports';
import { Stack } from '../layouts/Stack';
import { renderRouter } from '../testing-library';

function ThrowingRoute(): never {
  throw new Error('Expected route error');
}

function boundary(testID: string) {
  return function Boundary({ error }: ErrorBoundaryProps) {
    return <Text testID={testID}>{error.message}</Text>;
  };
}

it('uses a layout screen error boundary for a child route', () => {
  const LayoutBoundary = boundary('layout-boundary');

  renderRouter({
    _layout: {
      default: () => <Stack />,
      unstable_settings: { screenErrorBoundary: LayoutBoundary },
    },
    index: ThrowingRoute,
  });

  expect(screen.getByTestId('layout-boundary')).toBeOnTheScreen();
});

it('uses the parent layout boundary for a nested layout without one', () => {
  const LayoutBoundary = boundary('layout-boundary');

  renderRouter(
    {
      _layout: {
        default: () => <Stack />,
        unstable_settings: { screenErrorBoundary: LayoutBoundary },
      },
      'nested/_layout': () => (
        <View testID="nested-layout">
          <Stack />
        </View>
      ),
      'nested/index': ThrowingRoute,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('layout-boundary')).toBeOnTheScreen();
  expect(screen.getByTestId('nested-layout')).toBeOnTheScreen();
});

it('uses the parent layout boundary when the nested layout clears it', () => {
  const LayoutBoundary = boundary('layout-boundary');

  renderRouter(
    {
      _layout: {
        default: () => <Stack />,
        unstable_settings: { screenErrorBoundary: LayoutBoundary },
      },
      'nested/_layout': {
        default: () => (
          <View testID="nested-layout">
            <Stack />
          </View>
        ),
        unstable_settings: { screenErrorBoundary: null },
      },
      'nested/index': () => (
        <View testID="nested-index">
          <ThrowingRoute />
        </View>
      ),
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('layout-boundary')).toBeOnTheScreen();
  expect(screen.queryByTestId('nested-layout')).toBeNull();
  expect(screen.queryByTestId('nested-index')).toBeNull();
});

it('uses the navigator boundary before the layout boundary', () => {
  const LayoutBoundary = boundary('layout-boundary');
  const NavigatorBoundary = boundary('navigator-boundary');

  renderRouter({
    _layout: {
      default: () => <Stack unstable_screenErrorBoundary={NavigatorBoundary} />,
      unstable_settings: { screenErrorBoundary: LayoutBoundary },
    },
    index: ThrowingRoute,
  });

  expect(screen.getByTestId('navigator-boundary')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-boundary')).toBeNull();
});

it('uses the route boundary before navigator and layout boundaries', () => {
  const LayoutBoundary = boundary('layout-boundary');
  const NavigatorBoundary = boundary('navigator-boundary');
  const RouteBoundary = boundary('route-boundary');

  renderRouter({
    _layout: {
      default: () => <Stack unstable_screenErrorBoundary={NavigatorBoundary} />,
      unstable_settings: { screenErrorBoundary: LayoutBoundary },
    },
    index: {
      default: ThrowingRoute,
      ErrorBoundary: RouteBoundary,
    },
  });

  expect(screen.getByTestId('route-boundary')).toBeOnTheScreen();
  expect(screen.queryByTestId('navigator-boundary')).toBeNull();
  expect(screen.queryByTestId('layout-boundary')).toBeNull();
});
