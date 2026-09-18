import { act, renderHook } from '@testing-library/react-native';
import * as React from 'react';

import { RoutingQueueDrainer } from '../RoutingQueueDrainer';
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

function renderDrainer(processIntent: (intent: RoutingIntent) => void) {
  return renderHook(useEnqueueRoutingIntent, {
    wrapper: ({ children }) => (
      <RoutingQueueProvider>
        {children}
        <RoutingQueueDrainer processIntent={processIntent} />
      </RoutingQueueProvider>
    ),
  });
}

it('isolates queue notifications from its parent', () => {
  const parentRender = jest.fn();
  const processIntent = jest.fn();
  const { result } = renderHook(useEnqueueRoutingIntent, {
    wrapper: ({ children }) => {
      parentRender();
      return (
        <RoutingQueueProvider>
          {children}
          <RoutingQueueDrainer processIntent={processIntent} />
        </RoutingQueueProvider>
      );
    },
  });
  expect(parentRender).toHaveBeenCalledTimes(1);
  expect(processIntent).not.toHaveBeenCalled();

  act(() => result.current(actionIntent('TEST')));
  expect(parentRender).toHaveBeenCalledTimes(1);
  expect(processIntent).toHaveBeenCalledTimes(1);
  expect(processIntent).toHaveBeenCalledWith(actionIntent('TEST'));
});

it('processes a queued batch in FIFO order', () => {
  const processIntent = jest.fn();
  const { result } = renderDrainer(processIntent);
  expect(processIntent).not.toHaveBeenCalled();

  act(() => {
    result.current(actionIntent('FIRST'));
    result.current(actionIntent('SECOND'));
    result.current(actionIntent('THIRD'));
  });
  expect(processIntent).toHaveBeenCalledTimes(3);
  expect(processIntent).toHaveBeenNthCalledWith(1, actionIntent('FIRST'));
  expect(processIntent).toHaveBeenNthCalledWith(2, actionIntent('SECOND'));
  expect(processIntent).toHaveBeenNthCalledWith(3, actionIntent('THIRD'));
});

it('does not process an intent twice in Strict Mode', () => {
  const processIntent = jest.fn();
  function MountWhenQueued() {
    const intents = React.use(PendingIntentsContext);
    // Mount with pending work so Strict Mode replays an effect that processes an intent.
    return intents.length ? <RoutingQueueDrainer processIntent={processIntent} /> : null;
  }
  const { result, rerender } = renderHook(useEnqueueRoutingIntent, {
    wrapper: ({ children }) => (
      <React.StrictMode>
        <RoutingQueueProvider>
          {children}
          <MountWhenQueued />
        </RoutingQueueProvider>
      </React.StrictMode>
    ),
  });
  expect(processIntent).not.toHaveBeenCalled();

  act(() => result.current(actionIntent('TEST')));
  expect(processIntent).toHaveBeenCalledTimes(1);
  expect(processIntent).toHaveBeenCalledWith(actionIntent('TEST'));

  rerender(undefined);
  expect(processIntent).toHaveBeenCalledTimes(1);
});

it('processes separately enqueued intents', () => {
  const processIntent = jest.fn();
  const { result } = renderDrainer(processIntent);
  expect(processIntent).not.toHaveBeenCalled();

  act(() => result.current(actionIntent('FIRST')));
  expect(processIntent).toHaveBeenCalledTimes(1);
  expect(processIntent).toHaveBeenCalledWith(actionIntent('FIRST'));

  act(() => result.current(actionIntent('SECOND')));
  expect(processIntent).toHaveBeenCalledTimes(2);
  expect(processIntent).toHaveBeenLastCalledWith(actionIntent('SECOND'));
});

it('continues after processIntent throws synchronously', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const processIntent = jest.fn().mockImplementationOnce(() => {
    throw new Error('failed');
  });
  try {
    const { result } = renderDrainer(processIntent);
    expect(processIntent).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();

    act(() => {
      result.current(actionIntent('FIRST'));
      result.current(actionIntent('SECOND'));
    });
    expect(processIntent).toHaveBeenCalledTimes(2);
    expect(processIntent).toHaveBeenLastCalledWith(actionIntent('SECOND'));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('failed'));
  } finally {
    warning.mockRestore();
  }
});

it('processes the whole batch before committing destination updates', () => {
  const onProcess = jest.fn();
  function Drainer() {
    const [destination, setDestination] = React.useState(0);
    const registered = React.useRef(0);
    React.useLayoutEffect(() => {
      registered.current = destination;
    }, [destination]);
    const processIntent = React.useCallback(() => {
      onProcess(registered.current);
      setDestination((value) => value + 1);
    }, []);
    return <RoutingQueueDrainer processIntent={processIntent} />;
  }
  const { result } = renderHook(useEnqueueRoutingIntent, {
    wrapper: ({ children }) => (
      <RoutingQueueProvider>
        {children}
        <Drainer />
      </RoutingQueueProvider>
    ),
  });
  expect(onProcess).not.toHaveBeenCalled();

  act(() => {
    result.current(actionIntent('FIRST'));
    result.current(actionIntent('SECOND'));
  });
  expect(onProcess).toHaveBeenCalledTimes(2);
  expect(onProcess).toHaveBeenNthCalledWith(1, 0);
  expect(onProcess).toHaveBeenNthCalledWith(2, 0);
});

it.each(['GO_BACK', 'BROWSER_HISTORY_CHANGED', 'PUSH'] as const)(
  'allows %s to interrupt a suspended destination',
  (type) => {
    const onProcess = jest.fn();
    const suspended = new Promise<void>(() => {});
    function Destination({ value }: { value: number }) {
      if (value === 1) throw suspended;
      return null;
    }
    function Drainer() {
      const [destination, setDestination] = React.useState(0);
      const processIntent = React.useCallback((intent: RoutingIntent) => {
        onProcess(intent);
        setDestination(intent.type === 'ACTION' && intent.payload.action.type === 'FIRST' ? 1 : 0);
      }, []);
      return (
        <>
          <RoutingQueueDrainer processIntent={processIntent} />
          <React.Suspense fallback={null}>
            <Destination value={destination} />
          </React.Suspense>
        </>
      );
    }
    const { result } = renderHook(useEnqueueRoutingIntent, {
      wrapper: ({ children }) => (
        <RoutingQueueProvider>
          {children}
          <Drainer />
        </RoutingQueueProvider>
      ),
    });
    expect(onProcess).not.toHaveBeenCalled();

    const first = { ...actionIntent('FIRST'), inTransition: true };
    act(() => result.current(first));
    expect(onProcess).toHaveBeenCalledTimes(1);
    expect(onProcess).toHaveBeenCalledWith(first);

    const interrupt: RoutingIntent =
      type === 'BROWSER_HISTORY_CHANGED'
        ? { type, payload: { id: 'first', path: '/' } }
        : { ...actionIntent(type), inTransition: false };
    act(() => result.current(interrupt));
    expect(onProcess).toHaveBeenCalledTimes(2);
    expect(onProcess).toHaveBeenLastCalledWith(interrupt);
  }
);

it('processes each occurrence of a reused intent object', () => {
  const processIntent = jest.fn();
  const { result } = renderDrainer(processIntent);
  expect(processIntent).not.toHaveBeenCalled();

  const intent = actionIntent('TEST');
  act(() => {
    result.current(intent);
    result.current(intent);
  });
  expect(processIntent).toHaveBeenCalledTimes(2);
});

it.each([0, 1])('opts the entire queued batch out when intent %i opts out', (urgentIndex) => {
  const startTransition = jest.fn(React.startTransition);
  const processIntent = jest.fn();
  function Drainer() {
    const api = React.use(RoutingQueueApiContext)!;
    return (
      <RoutingQueueApiContext value={{ ...api, transitionMode: 'always', startTransition }}>
        <RoutingQueueDrainer processIntent={processIntent} />
      </RoutingQueueApiContext>
    );
  }
  const { result } = renderHook(useEnqueueRoutingIntent, {
    wrapper: ({ children }) => (
      <RoutingQueueProvider>
        {children}
        <Drainer />
      </RoutingQueueProvider>
    ),
  });
  expect(processIntent).not.toHaveBeenCalled();
  expect(startTransition).not.toHaveBeenCalled();

  act(() => {
    for (let index = 0; index < 2; index++) {
      result.current({
        ...actionIntent('PUSH'),
        inTransition: index === urgentIndex ? false : undefined,
      });
    }
  });
  expect(processIntent).toHaveBeenCalledTimes(2);
  expect(startTransition).not.toHaveBeenCalled();
});
