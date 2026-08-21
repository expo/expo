import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { ErrorBoundaryProps } from '../exports';
import { Stack } from '../layouts/Stack';
import { renderRouterAsync } from '../testing-library';

function ThrowingRoute(): never {
  throw new Error('Expected route error');
}

function boundary(testID: string) {
  return function Boundary({ error }: ErrorBoundaryProps) {
    return <Text testID={testID}>{error.message}</Text>;
  };
}

it('uses a layout screen error boundary for a child route', async () => {
  const LayoutBoundary = boundary('layout-boundary');

  await renderRouterAsync({
    _layout: {
      default: () => <Stack />,
      unstable_settings: { screenErrorBoundary: LayoutBoundary },
    },
    index: ThrowingRoute,
  });

  expect(screen.getByTestId('layout-boundary')).toBeOnTheScreen();
});

it('uses a route screen error boundary configured with unstable settings', async () => {
  const RouteBoundary = boundary('route-boundary');

  await renderRouterAsync({
    _layout: () => <Stack />,
    index: {
      default: ThrowingRoute,
      unstable_settings: { screenErrorBoundary: RouteBoundary },
    },
  });

  expect(screen.getByTestId('route-boundary')).toBeOnTheScreen();
});

it('uses the navigator boundary before the layout boundary', async () => {
  const LayoutBoundary = boundary('layout-boundary');
  const NavigatorBoundary = boundary('navigator-boundary');

  await renderRouterAsync({
    _layout: {
      default: () => <Stack screenErrorBoundary={NavigatorBoundary} />,
      unstable_settings: { screenErrorBoundary: LayoutBoundary },
    },
    index: ThrowingRoute,
  });

  expect(screen.getByTestId('navigator-boundary')).toBeOnTheScreen();
  expect(screen.queryByTestId('layout-boundary')).toBeNull();
});

it('uses a screen boundary before navigator and layout boundaries', async () => {
  const LayoutBoundary = boundary('layout-boundary');
  const NavigatorBoundary = boundary('navigator-boundary');
  const ScreenBoundary = boundary('screen-boundary');

  await renderRouterAsync({
    _layout: {
      default: () => (
        <Stack screenErrorBoundary={NavigatorBoundary}>
          <Stack.Screen name="index" errorBoundary={ScreenBoundary} />
        </Stack>
      ),
      unstable_settings: { screenErrorBoundary: LayoutBoundary },
    },
    index: ThrowingRoute,
  });

  expect(screen.getByTestId('screen-boundary')).toBeOnTheScreen();
  expect(screen.queryByTestId('navigator-boundary')).toBeNull();
  expect(screen.queryByTestId('layout-boundary')).toBeNull();
});
