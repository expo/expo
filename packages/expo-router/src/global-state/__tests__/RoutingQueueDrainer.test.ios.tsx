import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { RoutingQueueDrainer } from '../RoutingQueueDrainer';
import { routingQueue, type RoutingIntent } from '../routingQueue';
import { RoutingQueueProvider, useEnqueueRoutingIntent } from '../routingQueueContext';

beforeEach(() => {
  routingQueue.queue = [];
  routingQueue.subscribers.clear();
});

function actionIntent(type: string): RoutingIntent {
  return { type: 'ACTION', payload: { action: { type } } };
}

function actionType(intent: RoutingIntent): string {
  if (intent.type === 'NAVIGATE_TO_HREF') {
    throw new Error('Expected an action intent.');
  }
  return intent.payload.action.type;
}

function renderDrainer(ready: boolean, processIntent: (intent: RoutingIntent) => void) {
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function CaptureEnqueue() {
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  const result = render(
    <RoutingQueueProvider>
      <CaptureEnqueue />
      <RoutingQueueDrainer ready={ready} processIntent={processIntent} />
    </RoutingQueueProvider>
  );

  return { ...result, enqueue: (intent: RoutingIntent) => enqueue(intent) };
}

it('isolates queue notifications from its parent', () => {
  const parentRender = jest.fn();
  const processIntent = jest.fn();
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Consumer() {
    enqueue = useEnqueueRoutingIntent();
    return <RoutingQueueDrainer ready processIntent={processIntent} />;
  }

  function Parent() {
    parentRender();
    return (
      <RoutingQueueProvider>
        <Consumer />
      </RoutingQueueProvider>
    );
  }

  render(<Parent />);
  act(() => enqueue(actionIntent('TEST')));

  expect(parentRender).toHaveBeenCalledTimes(1);
  expect(processIntent).toHaveBeenCalledWith(actionIntent('TEST'));
});

it('keeps intents queued until ready', () => {
  const processIntent = jest.fn();
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Tree({ ready }: { ready: boolean }) {
    enqueue = useEnqueueRoutingIntent();
    return <RoutingQueueDrainer ready={ready} processIntent={processIntent} />;
  }

  const result = render(
    <RoutingQueueProvider>
      <Tree ready={false} />
    </RoutingQueueProvider>
  );
  act(() => enqueue(actionIntent('TEST')));
  expect(processIntent).not.toHaveBeenCalled();

  result.rerender(
    <RoutingQueueProvider>
      <Tree ready />
    </RoutingQueueProvider>
  );

  expect(processIntent).toHaveBeenCalledWith(actionIntent('TEST'));
});

it('processes a queued batch in FIFO order', () => {
  const calls: string[] = [];
  const processIntent = jest.fn((intent: RoutingIntent) => calls.push(actionType(intent)));
  const dispatchSync = jest.fn(() => calls.push('NAVIGATOR_ACTION'));
  const onDispatch = jest.fn(() => calls.push('onDispatch'));
  const result = renderDrainer(true, processIntent);

  act(() => {
    result.enqueue(actionIntent('FIRST'));
    result.enqueue({
      type: 'NAVIGATOR_ACTION',
      payload: { action: { type: 'SECOND' }, dispatchSync },
      onDispatch,
    });
    result.enqueue(actionIntent('THIRD'));
  });

  expect(calls).toEqual(['FIRST', 'onDispatch', 'NAVIGATOR_ACTION', 'THIRD']);
  expect(dispatchSync).toHaveBeenCalledWith({ type: 'SECOND' });
});

it('does not process a batch twice in Strict Mode', () => {
  const processIntent = jest.fn();
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function Tree() {
    enqueue = useEnqueueRoutingIntent();
    return <RoutingQueueDrainer ready processIntent={processIntent} />;
  }

  render(
    <React.StrictMode>
      <RoutingQueueProvider>
        <Tree />
      </RoutingQueueProvider>
    </React.StrictMode>
  );
  act(() => enqueue(actionIntent('TEST')));

  expect(processIntent).toHaveBeenCalledTimes(1);
});

it('processes intents added while draining in a later batch', () => {
  const processed: string[] = [];
  let enqueue: (intent: RoutingIntent) => void;
  const processIntent = jest.fn((intent: RoutingIntent) => {
    processed.push(actionType(intent));
    if (actionType(intent) === 'FIRST') {
      enqueue(actionIntent('SECOND'));
    }
  });
  const result = renderDrainer(true, processIntent);
  enqueue = result.enqueue;

  act(() => enqueue(actionIntent('FIRST')));

  expect(processed).toEqual(['FIRST', 'SECOND']);
});

it('drops pending intents when the provider unmounts', () => {
  const processIntent = jest.fn();
  const first = renderDrainer(false, processIntent);
  act(() => first.enqueue(actionIntent('TEST')));

  first.unmount();
  renderDrainer(true, processIntent);

  expect(processIntent).not.toHaveBeenCalled();
});

it('continues after processIntent throws synchronously', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const processIntent = jest.fn((intent: RoutingIntent) => {
    if (actionType(intent) === 'FIRST') {
      throw new Error('failed');
    }
  });
  const result = renderDrainer(true, processIntent);

  act(() => {
    result.enqueue(actionIntent('FIRST'));
    result.enqueue(actionIntent('SECOND'));
  });

  expect(processIntent).toHaveBeenCalledTimes(2);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining('failed'));
  warning.mockRestore();
});
