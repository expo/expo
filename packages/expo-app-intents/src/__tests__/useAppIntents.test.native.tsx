import { renderHook, waitFor } from '@testing-library/react-native';

import type { AppIntentInvocation } from '../ExpoAppIntents.types';
import ExpoAppIntents from '../ExpoAppIntentsModule';
import { useAppIntents } from '../index';

jest.mock('../ExpoAppIntentsModule', () => {
  const listeners = new Set();
  return {
    __esModule: true,
    default: {
      addListener: jest.fn((eventName, listener) => {
        listeners.add(listener);
        return {
          remove: () => {
            listeners.delete(listener);
          },
        };
      }),
      getPendingInvocationsAsync: jest.fn(async () => []),
    },
  };
});

function makeInvocation(id: string, name: string): AppIntentInvocation {
  return { id, name, params: {}, createdAt: 0 };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

/**
 * Lets every task that is not blocked on a still-pending promise run to completion, so a
 * deferred promise resolved afterwards cannot win a race by accident of queueing order.
 */
async function flushMicrotasks() {
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
}

const getPendingMock = ExpoAppIntents!.getPendingInvocationsAsync as jest.Mock;
const addListenerMock = ExpoAppIntents!.addListener as jest.Mock;

function emitIntent(invocation: AppIntentInvocation) {
  for (const call of addListenerMock.mock.calls) {
    call[1](invocation);
  }
}

describe(useAppIntents, () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    getPendingMock.mockImplementation(async () => []);
  });

  it('continues delivery after the handler throws synchronously', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const cold = makeInvocation('cold', 'coldIntent');
    getPendingMock.mockResolvedValue([cold]);

    const handler = jest.fn().mockImplementationOnce(() => {
      throw new Error('handler failed');
    });
    renderHook(() => useAppIntents(handler));

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    expect(handler).toHaveBeenCalledWith([cold], null);
    emitIntent(makeInvocation('live', 'liveIntent'));
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
  });

  it('delivers the initial snapshot before a live invocation that arrives during mount', async () => {
    const cold = makeInvocation('cold', 'coldIntent');
    const live = makeInvocation('live', 'liveIntent');

    // The initial pending read stays in flight until after the live invocation arrives, so a
    // handler call for the live invocation could otherwise resolve first.
    const initialRead = deferred<AppIntentInvocation[]>();
    getPendingMock
      .mockImplementationOnce(() => initialRead.promise)
      .mockImplementation(async () => [cold, live]);

    const handler = jest.fn();
    renderHook(() => useAppIntents(handler));

    emitIntent(live);
    // Let the live invocation's delivery run as far as it can before the initial read resolves.
    await flushMicrotasks();
    // The live invocation was persisted natively before its event fired, so it is part of the
    // snapshot the initial read returns.
    initialRead.resolve([cold, live]);

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
    expect(handler).toHaveBeenNthCalledWith(1, [cold], null);
    expect(handler).toHaveBeenNthCalledWith(2, [cold, live], live);
  });

  it('delivers live invocations in arrival order', async () => {
    const first = makeInvocation('first', 'firstIntent');
    const second = makeInvocation('second', 'secondIntent');

    // The first live invocation's pending read resolves after the second one's, so delivery
    // order must come from the hook, not from promise resolution order.
    const firstRead = deferred<AppIntentInvocation[]>();
    const firstDelivery = deferred<void>();
    getPendingMock
      .mockImplementationOnce(async () => [])
      .mockImplementationOnce(() => firstRead.promise)
      .mockImplementation(async () => [first, second]);

    const handler = jest.fn((_pending, newIntent) =>
      newIntent?.id === first.id ? firstDelivery.promise : undefined
    );
    renderHook(() => useAppIntents(handler));
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    emitIntent(first);
    emitIntent(second);
    // Let the second invocation's delivery run as far as it can while the first one's pending
    // read is still in flight.
    await flushMicrotasks();
    firstRead.resolve([first]);

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
    await flushMicrotasks();
    expect(handler).toHaveBeenCalledTimes(2);
    firstDelivery.resolve();
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(3));
    expect(handler).toHaveBeenNthCalledWith(2, [first], first);
    expect(handler).toHaveBeenNthCalledWith(3, [first, second], second);
  });

  it('does not redeliver an initial pending invocation as live', async () => {
    const live = makeInvocation('live', 'liveIntent');
    getPendingMock.mockImplementation(async () => [live]);

    const handler = jest.fn();
    renderHook(() => useAppIntents(handler));
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    emitIntent(live);
    emitIntent(live);

    await flushMicrotasks();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
