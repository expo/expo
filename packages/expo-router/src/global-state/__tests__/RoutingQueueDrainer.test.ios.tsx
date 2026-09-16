import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { RoutingQueueDrainer, shouldUseTransition } from '../RoutingQueueDrainer';
import type { RoutingIntent } from '../routingQueue';
import { RoutingQueueProvider, useEnqueueRoutingIntent } from '../routingQueueContext';

function actionIntent(type: string, inTransition?: boolean): RoutingIntent {
  return { type: 'ACTION', payload: { action: { type } }, inTransition };
}

function navigate(event: string, inTransition?: boolean): RoutingIntent {
  return {
    type: 'NAVIGATE_TO_HREF',
    payload: { href: '/test', options: { event } },
    inTransition,
  };
}

function actionType(intent: RoutingIntent): string {
  if (intent.type !== 'ACTION') {
    throw new Error('Expected an action intent.');
  }
  return intent.payload.action.type;
}

function renderDrainer(processIntent: (intent: RoutingIntent) => void) {
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function CaptureEnqueue() {
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  const result = render(
    <RoutingQueueProvider>
      <CaptureEnqueue />
      <RoutingQueueDrainer processIntent={processIntent} />
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
    return <RoutingQueueDrainer processIntent={processIntent} />;
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

it('processes a queued batch in FIFO order', () => {
  const calls: string[] = [];
  const processIntent = jest.fn((intent: RoutingIntent) => calls.push(actionType(intent)));
  const onDispatch = jest.fn(() => calls.push('onDispatch'));
  const result = renderDrainer(processIntent);

  act(() => {
    result.enqueue(actionIntent('FIRST'));
    result.enqueue({ ...actionIntent('SECOND'), onDispatch });
    result.enqueue(actionIntent('THIRD'));
  });

  expect(calls).toEqual(['FIRST', 'onDispatch', 'SECOND', 'THIRD']);
});

it('does not process a batch twice in Strict Mode', () => {
  const processIntent = jest.fn();
  let enqueue: ReturnType<typeof useEnqueueRoutingIntent>;

  function CaptureEnqueue() {
    enqueue = useEnqueueRoutingIntent();
    return null;
  }

  const result = render(
    <React.StrictMode>
      <RoutingQueueProvider>
        <CaptureEnqueue />
      </RoutingQueueProvider>
    </React.StrictMode>
  );
  act(() => enqueue(actionIntent('TEST')));
  result.rerender(
    <React.StrictMode>
      <RoutingQueueProvider>
        <CaptureEnqueue />
        <RoutingQueueDrainer processIntent={processIntent} />
      </RoutingQueueProvider>
    </React.StrictMode>
  );

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
  const result = renderDrainer(processIntent);
  enqueue = result.enqueue;

  act(() => enqueue(actionIntent('FIRST')));

  expect(processed).toEqual(['FIRST', 'SECOND']);
});

it('continues after processIntent throws synchronously', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const processIntent = jest.fn((intent: RoutingIntent) => {
    if (actionType(intent) === 'FIRST') {
      throw new Error('failed');
    }
  });
  const result = renderDrainer(processIntent);

  act(() => {
    result.enqueue(actionIntent('FIRST'));
    result.enqueue(actionIntent('SECOND'));
  });

  expect(processIntent).toHaveBeenCalledTimes(2);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining('failed'));
  warning.mockRestore();
});

describe(shouldUseTransition, () => {
  const operations = [
    ['push', navigate('PUSH')],
    ['navigate', navigate('NAVIGATE')],
    ['replace', navigate('REPLACE')],
    ['dismissTo', navigate('POP_TO')],
    ['back', actionIntent('GO_BACK')],
    ['dismiss', actionIntent('POP')],
    ['dismissAll', actionIntent('POP_TO_TOP')],
    ['preload', navigate('PRELOAD')],
  ] as const;

  describe('always', () => {
    it.each(operations)('uses a transition for %s by default', (_, intent) => {
      expect(shouldUseTransition([intent], 'always')).toBe(true);
    });

    it.each(operations)('does not use a transition when %s opts out', (_, intent) => {
      expect(shouldUseTransition([{ ...intent, inTransition: false }], 'always')).toBe(false);
    });
  });

  describe('preload-only', () => {
    it('uses a transition when the entire batch consists of preloads', () => {
      expect(shouldUseTransition([navigate('PRELOAD'), navigate('PRELOAD')], 'preload-only')).toBe(
        true
      );
    });

    it.each(operations.slice(0, -1))('does not use a transition for %s by default', (_, intent) => {
      expect(shouldUseTransition([intent], 'preload-only')).toBe(false);
    });

    it.each(operations)('allows %s to opt in', (_, intent) => {
      expect(shouldUseTransition([{ ...intent, inTransition: true }], 'preload-only')).toBe(true);
    });

    it.each(operations)('does not use a transition when %s opts out', (_, intent) => {
      expect(shouldUseTransition([{ ...intent, inTransition: false }], 'preload-only')).toBe(false);
    });

    it.each([
      ['preload followed by an opted-in operation', navigate('PRELOAD'), navigate('PUSH', true)],
      ['opted-in operation followed by a preload', navigate('PUSH', true), navigate('PRELOAD')],
    ])('allows %s in one transition', (_, first, second) => {
      expect(shouldUseTransition([first, second], 'preload-only')).toBe(true);
    });
  });

  describe('never', () => {
    it.each(operations)('does not use a transition for %s', (_, intent) => {
      expect(shouldUseTransition([{ ...intent, inTransition: true }], 'never')).toBe(false);
    });
  });
});
