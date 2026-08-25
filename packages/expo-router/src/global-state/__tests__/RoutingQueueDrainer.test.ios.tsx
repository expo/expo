import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { RoutingQueueDrainer } from '../RoutingQueueDrainer';
import { routingQueue, type RoutingIntent } from '../routingQueue';

const multipleDrainersError = [
  'Looks like you have multiple navigation containers draining the shared routing queue. Only one container will receive queued actions, while the others will drop them. Make sure that:',
  "- You don't have multiple NavigationContainers in the app",
  '- Only a single instance of the root component is rendered',
].join('\n');

let error: jest.SpyInstance | undefined;

beforeEach(() => {
  routingQueue.queue = [];
  routingQueue.subscribers.clear();
});

afterEach(() => {
  error?.mockRestore();
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

it('isolates queue notifications from its parent', () => {
  const parentRender = jest.fn();
  const processIntent = jest.fn();

  function Parent() {
    parentRender();
    return <RoutingQueueDrainer ready processIntent={processIntent} />;
  }

  render(<Parent />);
  act(() => routingQueue.add(actionIntent('TEST')));

  expect(parentRender).toHaveBeenCalledTimes(1);
  expect(processIntent).toHaveBeenCalledWith(actionIntent('TEST'));
});

it('logs an error when multiple drainers are mounted', () => {
  error = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(<RoutingQueueDrainer ready processIntent={jest.fn()} />);
  render(<RoutingQueueDrainer ready processIntent={jest.fn()} />);

  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(multipleDrainersError);
});

it('cleans up the mounted drainer when it unmounts', () => {
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const first = render(<RoutingQueueDrainer ready processIntent={jest.fn()} />);

  first.unmount();
  render(<RoutingQueueDrainer ready processIntent={jest.fn()} />);

  expect(error).not.toHaveBeenCalled();
});

it('keeps intents queued until ready', () => {
  const processIntent = jest.fn();
  const result = render(<RoutingQueueDrainer ready={false} processIntent={processIntent} />);

  act(() => routingQueue.add(actionIntent('TEST')));

  expect(processIntent).not.toHaveBeenCalled();
  expect(routingQueue.snapshot()).toEqual([actionIntent('TEST')]);

  result.rerender(<RoutingQueueDrainer ready processIntent={processIntent} />);

  expect(processIntent).toHaveBeenCalledWith(actionIntent('TEST'));
  expect(routingQueue.snapshot()).toEqual([]);
});

it('processes a queued batch in FIFO order', () => {
  const calls: string[] = [];
  const processIntent = jest.fn((intent: RoutingIntent) => calls.push(actionType(intent)));
  const dispatchSync = jest.fn(() => calls.push('NAVIGATOR_ACTION'));
  const onDispatch = jest.fn(() => calls.push('onDispatch'));
  render(<RoutingQueueDrainer ready processIntent={processIntent} />);

  act(() => {
    routingQueue.add(actionIntent('FIRST'));
    routingQueue.add({
      type: 'NAVIGATOR_ACTION',
      payload: { action: { type: 'SECOND' }, dispatchSync },
      onDispatch,
    });
    routingQueue.add(actionIntent('THIRD'));
  });

  expect(calls).toEqual(['FIRST', 'onDispatch', 'NAVIGATOR_ACTION', 'THIRD']);
  expect(dispatchSync).toHaveBeenCalledWith({ type: 'SECOND' });
});

it('does not process a snapshot twice in Strict Mode', () => {
  const processIntent = jest.fn();
  routingQueue.add(actionIntent('TEST'));

  render(
    <React.StrictMode>
      <RoutingQueueDrainer ready processIntent={processIntent} />
    </React.StrictMode>
  );

  expect(processIntent).toHaveBeenCalledTimes(1);
});

it('processes intents added while draining in a later batch', () => {
  const processed: string[] = [];
  const processIntent = jest.fn((intent: RoutingIntent) => {
    processed.push(actionType(intent));
    if (actionType(intent) === 'FIRST') {
      routingQueue.add(actionIntent('SECOND'));
    }
  });
  render(<RoutingQueueDrainer ready processIntent={processIntent} />);

  act(() => routingQueue.add(actionIntent('FIRST')));

  expect(processed).toEqual(['FIRST', 'SECOND']);
});

it('unsubscribes when unmounted', () => {
  const processIntent = jest.fn();
  const result = render(<RoutingQueueDrainer ready processIntent={processIntent} />);
  expect(routingQueue.subscribers.size).toBe(1);
  result.unmount();

  act(() => routingQueue.add(actionIntent('TEST')));

  expect(routingQueue.subscribers.size).toBe(0);
  expect(processIntent).not.toHaveBeenCalled();
  expect(routingQueue.snapshot()).toEqual([actionIntent('TEST')]);
});

it('continues after processIntent throws synchronously', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const processIntent = jest.fn((intent: RoutingIntent) => {
    if (actionType(intent) === 'FIRST') {
      throw new Error('failed');
    }
  });
  render(<RoutingQueueDrainer ready processIntent={processIntent} />);

  act(() => {
    routingQueue.add(actionIntent('FIRST'));
    routingQueue.add(actionIntent('SECOND'));
  });

  expect(processIntent).toHaveBeenCalledTimes(2);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining('failed'));
  warning.mockRestore();
});
