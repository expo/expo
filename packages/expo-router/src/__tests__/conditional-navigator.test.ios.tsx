import { act, screen, userEvent } from '@testing-library/react-native';
import { type ComponentProps, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { router } from '../imperative-api';
import Drawer from '../layouts/Drawer';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter } from '../testing-library';
import { assertCompleteState } from './assertCompleteState';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');
  return {
    ...actual,
    Drawer: ({ children }: ComponentProps<typeof actual.Drawer>) => <View>{children}</View>,
  };
});

type NavigatorKind = 'stack' | 'tabs' | 'drawer';

function Navigator({ kind }: { kind: NavigatorKind }) {
  if (kind === 'stack') {
    return <Stack />;
  }
  if (kind === 'drawer') {
    return (
      <Drawer>
        <Drawer.Screen name="index" />
        <Drawer.Screen name="second" />
      </Drawer>
    );
  }
  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="second" />
    </Tabs>
  );
}

/**
 * A layout that starts on `kind` and swaps to `nextKind` when the `toggle` button is pressed,
 * plus two screens.
 */
function makeRoutes(kind: NavigatorKind, nextKind: NavigatorKind) {
  const Layout = () => {
    const [current, setCurrent] = useState(kind);
    return (
      <>
        <Pressable testID="toggle" onPress={() => setCurrent(nextKind)} />
        <Navigator kind={current} />
      </>
    );
  };

  return {
    _layout: Layout,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };
}

function getNavigatorState(result: ReturnType<typeof renderRouter>) {
  return result.getRouterState()!.routes[0]!.state!;
}

it('reconciles state when a stack layout becomes tabs after navigation', async () => {
  const result = renderRouter(makeRoutes('stack', 'tabs'), { initialUrl: '/' });
  act(() => router.push('/second'));
  expect(getNavigatorState(result).type).toBe('stack');

  await userEvent.press(screen.getByTestId('toggle'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(getNavigatorState(result)).toMatchObject({
    type: 'tab',
    index: 0,
    routes: [{ name: 'second' }],
  });
  assertCompleteState(result.getRouterState()!);
});

it('reconciles state when a tabs layout becomes a stack after navigation', async () => {
  const result = renderRouter(makeRoutes('tabs', 'stack'), { initialUrl: '/' });
  act(() => router.push('/second'));
  expect(getNavigatorState(result).type).toBe('tab');

  await userEvent.press(screen.getByTestId('toggle'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(getNavigatorState(result)).toMatchObject({
    type: 'stack',
    index: 0,
    routes: [{ name: 'second' }],
  });
  expect(getNavigatorState(result)).not.toHaveProperty('history');
  assertCompleteState(result.getRouterState()!);
});

it('reconciles state when a stack layout becomes a drawer after navigation', async () => {
  const result = renderRouter(makeRoutes('stack', 'drawer'), { initialUrl: '/' });
  act(() => router.push('/second'));
  expect(getNavigatorState(result).type).toBe('stack');

  await userEvent.press(screen.getByTestId('toggle'));

  expect(screen.getByTestId('second')).toBeVisible();
  expect(getNavigatorState(result)).toMatchObject({
    type: 'drawer',
    index: 0,
    routes: [{ name: 'second' }],
  });
  assertCompleteState(result.getRouterState()!);
});

// Control: without a navigation the seeded state carries no `type`, so any router accepts it.
it('reconciles state when a stack layout becomes tabs before any navigation', async () => {
  renderRouter(makeRoutes('stack', 'tabs'), { initialUrl: '/' });
  expect(screen.getByTestId('index')).toBeVisible();

  await userEvent.press(screen.getByTestId('toggle'));

  expect(screen.getByTestId('index')).toBeVisible();
});
