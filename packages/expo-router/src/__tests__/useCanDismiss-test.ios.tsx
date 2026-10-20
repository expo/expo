import { act, screen, renderHook as plainRenderHook } from '@testing-library/react-native';
import { act as reactAct, use } from 'react';
import { Text } from 'react-native';

import { useCanDismiss, useRouter } from '../exports';
import { renderHook } from '../hooks/__tests__/renderHook';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

afterEach(() => jest.restoreAllMocks());

function Capability() {
  return <Text testID="can-dismiss">{String(useCanDismiss())}</Text>;
}

it('reads the current stack during render', async () => {
  const { result } = await renderHook(
    () => ({ canDismiss: useCanDismiss(), router: useRouter() }),
    ['index', 'second']
  );
  const capturedCanDismiss = result.current.router.canDismiss;
  expect(result.current.canDismiss).toBe(false);
  await act(() => router.push('/second'));
  expect(result.current.canDismiss).toBe(true);
  expect(capturedCanDismiss()).toBe(true);
  await act(() => router.dismiss());
  expect(result.current.canDismiss).toBe(false);
  expect(capturedCanDismiss()).toBe(false);
});

it('detects an anchored stack after an initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanDismiss());
    return <Stack />;
  }

  await renderRouter(
    {
      _layout: { unstable_settings: { anchor: 'index' }, default: Layout },
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canDismiss()).toBe(true);
  // The stack registers its type after its first commit.
  expect(values[0]).toBe(false);
  expect(values.at(-1)).toBe(true);
});

it('stays false in anchored tabs', async () => {
  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'index' },
        default: () => (
          <>
            <Capability />
            <Tabs>
              <Tabs.Screen name="index" />
              <Tabs.Screen name="second" />
            </Tabs>
          </>
        ),
      },
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('false');
  expect(router.canDismiss()).toBe(false);
  await act(() => router.push('/'));
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('false');
  expect(router.canDismiss()).toBe(false);
});

it('ignores inactive tab stacks and preloaded screens', async () => {
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="nested" />
        </Tabs>
      </>
    ),
    index: () => <Text>Index</Text>,
    'nested/_layout': () => <Stack />,
    'nested/index': () => <Text>Nested</Text>,
    'nested/second': () => <Text>Second</Text>,
  });
  await act(() => router.navigate('/nested'));
  await act(() => router.prefetch('/nested/second'));
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('false');
  expect(router.canDismiss()).toBe(false);
  await act(() => router.push('/nested/second'));
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('true');
  expect(router.canDismiss()).toBe(true);
  await act(() => router.navigate('/'));
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('false');
  expect(router.canDismiss()).toBe(false);
});

it('reports the parent stack while a modal contains a root-only nested stack', async () => {
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Stack>
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </>
    ),
    index: () => <Text>Index</Text>,
    'modal/_layout': () => <Stack />,
    'modal/index': () => <Text>Modal</Text>,
  });
  await act(() => router.push('/modal'));
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('true');
  expect(router.canDismiss()).toBe(true);
});

it('keeps committed capability while a transition suspends', async () => {
  let resolve!: (value: string) => void;
  const pending = new Promise<string>((done) => {
    resolve = done;
  });
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Stack />
      </>
    ),
    index: () => <Text>Index</Text>,
    slow: function Slow() {
      return <Text>{use(pending)}</Text>;
    },
  });
  const transition = reactAct(() => router.push('/slow', { inTransition: true }));
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('false');
  expect(router.canDismiss()).toBe(false);
  await act(() => resolve('Slow'));
  await transition;
  expect(screen.getByTestId('can-dismiss')).toHaveTextContent('true');
  expect(router.canDismiss()).toBe(true);
});

it('throws outside of an Expo Router application', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(plainRenderHook(() => useCanDismiss())).rejects.toThrow(
    'useCanDismiss was called from outside of Expo Router application.'
  );
});
