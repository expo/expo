import { act, render } from '@testing-library/react-native';
import { use, type ContextType } from 'react';

import { router } from '../router';
import type { RoutingIntent } from '../routingQueue';
import {
  PendingIntentsContext,
  RoutingQueueApiContext,
  RoutingQueueProvider,
  useEnqueueRoutingIntent,
} from '../routingQueueContext';

function actionIntent(type: string): RoutingIntent {
  return { type: 'ACTION', payload: { action: { type } } };
}

it('installs the module-level router after the provider commits', () => {
  let pending: RoutingIntent[] = [];

  function Consumer() {
    pending = use(PendingIntentsContext);
    return null;
  }

  expect(() => router.push('/test')).toThrow('first render');

  render(
    <RoutingQueueProvider>
      <Consumer />
    </RoutingQueueProvider>
  );
  act(() => router.push('/test'));

  expect(pending).toEqual([
    {
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/test', options: { event: 'PUSH' } },
    },
  ]);
});

it('restores the throwing router after the provider unmounts', () => {
  const { unmount } = render(<RoutingQueueProvider />);

  expect(() => act(() => router.push('/test'))).not.toThrow();
  unmount();

  expect(() => router.push('/test')).toThrow('first render');
});

it('warns when a second root binds the imperative router', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});

  const firstRoot = render(<RoutingQueueProvider />);
  const secondRoot = render(<RoutingQueueProvider />);

  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(expect.stringContaining('multiple'));

  secondRoot.unmount();
  firstRoot.unmount();
  error.mockRestore();
});

it('preserves enqueue order and drains on the following render', () => {
  const snapshots: RoutingIntent[][] = [];
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Consumer() {
    enqueue = useEnqueueRoutingIntent();
    snapshots.push(use(PendingIntentsContext));
    return null;
  }

  render(
    <RoutingQueueProvider>
      <Consumer />
    </RoutingQueueProvider>
  );

  act(() => {
    enqueue(actionIntent('FIRST'));
    enqueue(actionIntent('SECOND'));
  });

  expect(snapshots).toEqual([[], [actionIntent('FIRST'), actionIntent('SECOND')]]);
});

it('keeps intents added while a batch is being dequeued', () => {
  let api: NonNullable<ContextType<typeof RoutingQueueApiContext>>;
  let pending: RoutingIntent[] = [];

  function Consumer() {
    api = use(RoutingQueueApiContext)!;
    pending = use(PendingIntentsContext);
    return null;
  }

  render(
    <RoutingQueueProvider>
      <Consumer />
    </RoutingQueueProvider>
  );
  act(() => api.enqueue(actionIntent('FIRST')));
  const processed = pending;

  act(() => {
    api.enqueue(actionIntent('SECOND'));
    api.dequeue(processed);
  });

  expect(pending).toEqual([actionIntent('SECOND')]);
});

it('keeps providers isolated', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const queues: RoutingIntent[][] = [[], []];
  const enqueues: ((intent: RoutingIntent) => void)[] = [];

  function Consumer({ index }: { index: number }) {
    enqueues[index] = useEnqueueRoutingIntent();
    queues[index] = use(PendingIntentsContext);
    return null;
  }

  render(
    <>
      <RoutingQueueProvider>
        <Consumer index={0} />
      </RoutingQueueProvider>
      <RoutingQueueProvider>
        <Consumer index={1} />
      </RoutingQueueProvider>
    </>
  );
  act(() => enqueues[0]!(actionIntent('FIRST')));

  expect(queues).toEqual([[actionIntent('FIRST')], []]);
  error.mockRestore();
});

it('does not re-render producers when the queue changes', () => {
  const producerRender = jest.fn();
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Producer() {
    producerRender();
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  render(
    <RoutingQueueProvider>
      <Producer />
    </RoutingQueueProvider>
  );
  act(() => enqueue(actionIntent('TEST')));

  expect(producerRender).toHaveBeenCalledTimes(1);
});

it('throws when enqueue is called without a provider', () => {
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Consumer() {
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  expect(() => render(<Consumer />)).not.toThrow();
  expect(() => enqueue(actionIntent('TEST'))).toThrow('ExpoRoot');
});
