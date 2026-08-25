import { act, render } from '@testing-library/react-native';
import { use, type ContextType } from 'react';

import { routingQueue, type RoutingIntent } from '../routingQueue';
import {
  PendingIntentsContext,
  RoutingQueueApiContext,
  RoutingQueueProvider,
  useEnqueueRoutingIntent,
} from '../routingQueueContext';

function actionIntent(type: string): RoutingIntent {
  return { type: 'ACTION', payload: { action: { type } } };
}

beforeEach(() => {
  routingQueue.queue = [];
  routingQueue.subscribers.clear();
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

it('throws without a provider', () => {
  function Consumer() {
    useEnqueueRoutingIntent();
    return null;
  }

  expect(() => render(<Consumer />)).toThrow('Routing queue is unavailable');
});

it('forwards module queue intents into the context queue', () => {
  let pending: RoutingIntent[] = [];

  function Consumer() {
    pending = use(PendingIntentsContext);
    return null;
  }

  render(
    <RoutingQueueProvider>
      <Consumer />
    </RoutingQueueProvider>
  );
  act(() => routingQueue.add(actionIntent('TEST')));

  expect(pending).toEqual([actionIntent('TEST')]);
  expect(routingQueue.snapshot()).toEqual([]);
});

it('warns for multiple bridges and forwards through only one', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const queues: RoutingIntent[][] = [[], []];

  function Consumer({ index }: { index: number }) {
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
  act(() => routingQueue.add(actionIntent('TEST')));

  expect(error).toHaveBeenCalledTimes(1);
  expect(queues).toEqual([[actionIntent('TEST')], []]);
  error.mockRestore();
});
