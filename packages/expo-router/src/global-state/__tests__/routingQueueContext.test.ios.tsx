import { act, render, renderHook } from '@testing-library/react-native';
import { use, type ContextType, type PropsWithChildren } from 'react';

import { router } from '../router';
import type { RoutingIntent } from '../routingQueue';
import {
  ImperativeRoutingQueueBridge,
  NavigationPendingContext,
  PendingIntentsContext,
  RoutingQueueApiContext,
  RoutingQueueProvider,
  useEnqueueRoutingIntent,
} from '../routingQueueContext';
import { useRouterActions } from '../useRouterActions';

function actionIntent(type: string): RoutingIntent {
  return { type: 'ACTION', payload: { action: { type } } };
}

afterEach(() => router.setTransitionMode('preload-only'));

function RouterBridge() {
  const api = use(RoutingQueueApiContext)!;
  return (
    <ImperativeRoutingQueueBridge enqueue={api.enqueue} setTransitionMode={api.setTransitionMode} />
  );
}

it('does not install the module-level router from the provider', async () => {
  await render(<RoutingQueueProvider />);

  expect(() => router.push('/test')).toThrow('first render');
});

it('installs the module-level router after the bridge commits', async () => {
  let pending: RoutingIntent[] = [];

  function Consumer() {
    pending = use(PendingIntentsContext);
    return null;
  }

  expect(() => router.push('/test')).toThrow('first render');

  await render(
    <RoutingQueueProvider>
      <Consumer />
      <RouterBridge />
    </RoutingQueueProvider>
  );
  await act(() => router.push('/test'));

  expect(pending).toEqual([
    {
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/test', options: { event: 'PUSH' } },
    },
  ]);
});

it('updates the global transition mode from useRouterActions', async () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <RoutingQueueProvider>{children}</RoutingQueueProvider>
  );
  const { result } = await renderHook(
    () => ({ api: use(RoutingQueueApiContext)!, router: useRouterActions() }),
    { wrapper }
  );
  expect(result.current.api.transitionMode).toBe('preload-only');

  await act(() => result.current.router.setTransitionMode('never'));

  expect(result.current.api.transitionMode).toBe('never');
});

it('uses a transition mode set before the router binds', async () => {
  router.setTransitionMode('never');

  const { result } = await renderHook(() => use(RoutingQueueApiContext)!, {
    wrapper: RoutingQueueProvider,
  });

  expect(result.current.transitionMode).toBe('never');
});

it('restores the throwing router after the provider unmounts', async () => {
  const { unmount } = await render(
    <RoutingQueueProvider>
      <RouterBridge />
    </RoutingQueueProvider>
  );

  await act(() => router.push('/test'));
  await unmount();

  expect(() => router.push('/test')).toThrow('first render');
});

it('warns when a second root binds the imperative router', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});

  const firstRoot = await render(
    <RoutingQueueProvider>
      <RouterBridge />
    </RoutingQueueProvider>
  );
  const secondRoot = await render(
    <RoutingQueueProvider>
      <RouterBridge />
    </RoutingQueueProvider>
  );

  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(expect.stringContaining('multiple'));

  await secondRoot.unmount();
  await firstRoot.unmount();
  error.mockRestore();
});

it('preserves enqueue order and drains on the following render', async () => {
  const snapshots: RoutingIntent[][] = [];
  const pendingSnapshots: boolean[] = [];
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Consumer() {
    enqueue = useEnqueueRoutingIntent();
    snapshots.push(use(PendingIntentsContext));
    pendingSnapshots.push(use(NavigationPendingContext));
    return null;
  }

  await render(
    <RoutingQueueProvider>
      <Consumer />
    </RoutingQueueProvider>
  );

  await act(() => {
    enqueue(actionIntent('FIRST'));
    enqueue(actionIntent('SECOND'));
  });

  expect(snapshots).toEqual([[], [actionIntent('FIRST'), actionIntent('SECOND')]]);
  expect(pendingSnapshots).toEqual([false, true]);
});

it('keeps intents added while a batch is being dequeued', async () => {
  let api: NonNullable<ContextType<typeof RoutingQueueApiContext>>;
  let pending: RoutingIntent[] = [];

  function Consumer() {
    api = use(RoutingQueueApiContext)!;
    pending = use(PendingIntentsContext);
    return null;
  }

  await render(
    <RoutingQueueProvider>
      <Consumer />
    </RoutingQueueProvider>
  );
  await act(() => api.enqueue(actionIntent('FIRST')));
  const processed = pending;

  await act(() => {
    api.enqueue(actionIntent('SECOND'));
    api.dequeue(processed);
  });

  expect(pending).toEqual([actionIntent('SECOND')]);
});

it('keeps providers isolated', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const queues: RoutingIntent[][] = [[], []];
  const enqueues: ((intent: RoutingIntent) => void)[] = [];

  function Consumer({ index }: { index: number }) {
    enqueues[index] = useEnqueueRoutingIntent();
    queues[index] = use(PendingIntentsContext);
    return null;
  }

  await render(
    <>
      <RoutingQueueProvider>
        <Consumer index={0} />
      </RoutingQueueProvider>
      <RoutingQueueProvider>
        <Consumer index={1} />
      </RoutingQueueProvider>
    </>
  );
  await act(() => enqueues[0]!(actionIntent('FIRST')));

  expect(queues).toEqual([[actionIntent('FIRST')], []]);
  error.mockRestore();
});

it('does not re-render producers when the queue changes', async () => {
  const producerRender = jest.fn();
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Producer() {
    producerRender();
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  await render(
    <RoutingQueueProvider>
      <Producer />
    </RoutingQueueProvider>
  );
  await act(() => enqueue(actionIntent('TEST')));

  expect(producerRender).toHaveBeenCalledTimes(1);
});

it('throws when enqueue is called without a provider', async () => {
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Consumer() {
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  await expect(render(<Consumer />)).resolves.not.toThrow();
  expect(() => enqueue(actionIntent('TEST'))).toThrow('ExpoRoot');
});
