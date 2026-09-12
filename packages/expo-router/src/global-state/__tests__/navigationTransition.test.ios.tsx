import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';
import { use } from 'react';
import { Text } from 'react-native';

import { unstable_useIsNavigating, usePathname } from '../../exports';
import Stack from '../../layouts/StackClient';
import { unstable_navigationEvents } from '../../navigationEvents';
import { CommonActions } from '../../react-navigation/routers';
import { renderRouter } from '../../testing-library';
import { navigationRef } from '../navigationRef';
import { router } from '../router';

afterEach(cleanup);

function createDeferred() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function PendingStackLayout() {
  const isNavigating = unstable_useIsNavigating();
  return (
    <>
      <Text testID="is-navigating">{String(isNavigating)}</Text>
      <Stack />
    </>
  );
}

it('keeps the current screen visible and reports pending while a navigation suspends', async () => {
  const deferred = createDeferred();

  function SlowScreen() {
    const content = use(deferred.promise);
    return <Text testID="slow">{content}</Text>;
  }

  renderRouter({
    _layout: PendingStackLayout,
    index: () => <Text testID="index">Index</Text>,
    slow: {
      default: SlowScreen,
      SuspenseFallback: () => <Text testID="fallback">Fallback</Text>,
    },
  });

  expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
  expect(screen.getByTestId('index')).toBeVisible();

  const navigationAct = act(() => router.push('/slow'));

  expect(screen.getByTestId('is-navigating')).toHaveTextContent('true');
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('fallback')).toBeNull();

  deferred.resolve('Slow');
  await navigationAct;

  await waitFor(() => expect(screen.getByTestId('is-navigating')).toHaveTextContent('false'));
  expect(screen.getByTestId('slow')).toBeVisible();
});

it('commits two queued navigations in one transition', async () => {
  const committedPaths: string[] = [];

  function Layout() {
    committedPaths.push(usePathname());
    return <Stack />;
  }

  renderRouter({
    _layout: Layout,
    index: () => <Text>Index</Text>,
    first: () => <Text>First</Text>,
    second: () => <Text>Second</Text>,
  });

  await act(async () => {
    router.push('/first');
    router.push('/second');
  });

  expect(screen).toHavePathname('/second');
  expect(committedPaths).not.toContain('/first');
});

it('processes each intent once when one is queued during a pending transition', async () => {
  const deferred = createDeferred();
  const dispatchedActions: string[] = [];

  function SlowScreen() {
    const content = use(deferred.promise);
    return <Text testID="slow">{content}</Text>;
  }

  renderRouter({
    _layout: PendingStackLayout,
    index: () => <Text testID="index">Index</Text>,
    slow: SlowScreen,
    sync: () => <Text testID="sync">Sync</Text>,
  });
  const unsubscribe = unstable_navigationEvents.addListener('actionDispatched', (event) =>
    dispatchedActions.push(event.actionType)
  );

  try {
    const navigationAct = act(() => router.push('/slow'));
    expect(screen.getByTestId('is-navigating')).toHaveTextContent('true');
    expect(screen.getByTestId('index')).toBeVisible();

    await act(async () => {
      router.push('/sync');
    });

    deferred.resolve('Slow');
    await navigationAct;

    expect(screen.getByTestId('sync')).toBeVisible();
    expect(screen).toHavePathname('/sync');
    expect(dispatchedActions).toHaveLength(2);
  } finally {
    unsubscribe();
  }
});

it('preserves action order when a synchronous dispatch interrupts a transition', async () => {
  const deferred = createDeferred();

  function SlowScreen() {
    const content = use(deferred.promise);
    return <Text testID="slow">{content}</Text>;
  }

  renderRouter({
    _layout: PendingStackLayout,
    index: () => <Text testID="index">Index</Text>,
    sync: () => <Text testID="sync">Sync</Text>,
    slow: SlowScreen,
  });

  const navigationAct = act(() => router.push('/slow'));
  expect(screen.getByTestId('is-navigating')).toHaveTextContent('true');

  act(() => navigationRef.current?.dispatchSync(CommonActions.navigate('sync')));

  deferred.resolve('Slow');
  await navigationAct;

  expect(screen.getByTestId('sync')).toBeVisible();
  expect(screen).toHavePathname('/sync');
});

it('reports no pending navigation outside ExpoRoot', () => {
  function Consumer() {
    return <Text testID="is-navigating">{String(unstable_useIsNavigating())}</Text>;
  }

  const { getByTestId } = render(<Consumer />);

  expect(getByTestId('is-navigating')).toHaveTextContent('false');
});
