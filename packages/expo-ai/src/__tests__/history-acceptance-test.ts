import NativeModule from '../ExpoAI';
import { createSessionAsync, schema } from '../index';
import { availableModel, FakeSession, nativeResult } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: {
    supportsBackgroundEvents: true,
    getAvailabilityAsync: jest.fn(),
    createSessionAsync: jest.fn(),
    addListener: jest.fn(),
  },
}));

const nativeModule = jest.mocked(NativeModule!);
const flush = async () => {
  for (let index = 0; index < 40; index++) await Promise.resolve();
};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** Models a completed provider result whose delivery to JavaScript can be delayed independently. */
function retainedNative() {
  const native = new FakeSession();
  const history: string[] = [];
  const contexts: string[][] = [];
  let pending: { id: string; prompt: string } | undefined;
  const fixture = {
    native,
    history,
    contexts,
    text: 'ready',
    response: undefined as string | undefined,
    delivery: undefined as Promise<void> | undefined,
  };
  native.generateAsync.mockImplementation(async (id, prompt) => {
    if (pending) throw new Error('The previous result still awaits acceptance.');
    contexts.push([...history]);
    pending = { id, prompt };
    const text = fixture.text;
    const delivery = fixture.delivery;
    fixture.delivery = undefined;
    if (delivery) await delivery;
    return fixture.response ?? nativeResult(text);
  });
  native.acceptResult.mockImplementation((id) => {
    if (pending?.id !== id) return false;
    history.push(pending.prompt);
    pending = undefined;
    return true;
  });
  native.discardResult.mockImplementation((id) => {
    if (pending?.id === id) pending = undefined;
  });
  native.cancel.mockImplementation((id: string) => native.discardResult(id));
  native.dispose.mockImplementation(() => {
    pending = undefined;
    history.length = 0;
  });
  return fixture;
}

let fixture: ReturnType<typeof retainedNative>;
let removeBackground: jest.Mock;

beforeEach(() => {
  fixture = retainedNative();
  removeBackground = jest.fn();
  nativeModule.getAvailabilityAsync.mockReset().mockResolvedValue(availableModel());
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(fixture.native);
  nativeModule.addListener!.mockReset().mockReturnValue({ remove: removeBackground });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it('accepts a completed turn only after listeners have been removed and reuses it once', async () => {
  const { native, history, contexts } = fixture;
  const accept = native.acceptResult.getMockImplementation()!;
  native.acceptResult.mockImplementation((id) => {
    expect(native.listenerCount).toBe(0);
    expect(removeBackground).toHaveBeenCalled();
    return accept(id);
  });
  const session = await createSessionAsync();
  await expect(session.generateAsync('first')).resolves.toMatchObject({ value: 'ready' });
  expect(history).toEqual(['first']);
  await session.generateAsync('second');
  expect(contexts).toEqual([[], ['first']]);
  expect(history).toEqual(['first', 'second']);
  expect(native.acceptResult.mock.calls).toEqual(
    native.generateAsync.mock.calls.map(([id]) => [id])
  );
  expect(native.discardResult).not.toHaveBeenCalled();
  session.dispose();
});

it('discards a native integer that fails JavaScript safe-integer validation', async () => {
  const session = await createSessionAsync();
  await session.generateAsync('accepted');
  fixture.text = '9223372036854775807';
  await expect(
    session.generateAsync('rejected', { schema: schema.integer() })
  ).rejects.toMatchObject({
    code: 'ERR_RESPONSE_INVALID',
  });
  expect(fixture.history).toEqual(['accepted']);
  fixture.text = 'ready';
  await session.generateAsync('next');
  expect(fixture.contexts.at(-1)).toEqual(['accepted']);
  session.dispose();
});

it('discards invalid completion metadata from native and shared compatibility history', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  const session = await createSessionAsync();
  await session.generateAsync('accepted');
  fixture.response = JSON.stringify({
    text: 'invalid usage',
    usage: { inputTokens: -1, outputTokens: 2 },
  });
  await expect(session.generateAsync('rejected')).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
  const completion = new FakeSession();
  fixture.response = undefined;
  completion.generateAsync.mockResolvedValue(nativeResult('"answer"'));
  nativeModule.createSessionAsync.mockResolvedValueOnce(completion);
  await expect(
    session.generateAsync('compatibility', { schema: schema.string() })
  ).resolves.toMatchObject({
    value: 'answer',
  });
  const task = JSON.parse(completion.generateAsync.mock.calls[0]![1]).task;
  expect(JSON.parse(task).previousTurns).toEqual([{ prompt: 'accepted', value: 'ready' }]);
  expect(fixture.history).toEqual(['accepted']);
  expect(completion.acceptResult).not.toHaveBeenCalled();
  expect(completion.dispose).toHaveBeenCalledTimes(1);
  session.dispose();
});

it.each(['abort', 'timeout'] as const)(
  'discards completed native work when %s occurs before delivery, then preserves session reuse',
  async (interruption) => {
    if (interruption === 'timeout') jest.useFakeTimers();
    const session = await createSessionAsync();
    await session.generateAsync('accepted');
    const delivery = deferred();
    fixture.delivery = delivery.promise;
    const controller = new AbortController();
    const task = session.generateAsync('interrupted', {
      signal: controller.signal,
      ...(interruption === 'timeout' ? { timeoutMs: 10 } : {}),
    });
    const rejected = expect(task).rejects.toMatchObject({
      code: interruption === 'timeout' ? 'ERR_TIMEOUT' : 'ERR_ABORTED',
    });
    await flush();
    expect(fixture.contexts).toHaveLength(2);
    if (interruption === 'timeout') jest.advanceTimersByTime(10);
    else controller.abort();
    await rejected;
    delivery.resolve();
    await flush();
    await session.generateAsync('next');
    expect(fixture.contexts.at(-1)).toEqual(['accepted']);
    expect(fixture.history).toEqual(['accepted', 'next']);
    session.dispose();
  }
);

it('discards a completed native turn when the consumer breaks on its final text event', async () => {
  const session = await createSessionAsync();
  await session.generateAsync('accepted');
  const delivery = deferred();
  fixture.delivery = delivery.promise;
  const iterator = session.generateStream('interrupted')[Symbol.asyncIterator]();
  const snapshot = iterator.next();
  await flush();
  const requestId = fixture.native.generateAsync.mock.calls.at(-1)![0];
  fixture.native.emit('onText', { requestId, text: 'completed native text' });
  await expect(snapshot).resolves.toMatchObject({
    value: { type: 'text', text: 'completed native text' },
  });
  await iterator.return!();
  delivery.resolve();
  await flush();
  await session.generateAsync('next');
  expect(fixture.contexts.at(-1)).toEqual(['accepted']);
  expect(fixture.history).toEqual(['accepted', 'next']);
  session.dispose();
});

it.each(['text listener', 'background listener', 'operation'] as const)(
  'does not accept a turn when %s cleanup fails',
  async (phase) => {
    const cause = new Error('Cleanup failed.');
    const controller = new AbortController();
    if (phase === 'text listener') {
      const add = fixture.native.addListener.bind(fixture.native);
      jest.spyOn(fixture.native, 'addListener').mockImplementation((event, listener) => {
        const subscription = add(event, listener);
        return {
          remove: () => {
            const removed = subscription.remove();
            if (event === 'onText') throw cause;
            return removed;
          },
        };
      });
    } else if (phase === 'background listener') {
      removeBackground.mockImplementation(() => {
        throw cause;
      });
    } else {
      jest.spyOn(controller.signal, 'removeEventListener').mockImplementation(() => {
        throw cause;
      });
    }
    const session = await createSessionAsync();
    await expect(
      session.generateAsync('rejected', { signal: controller.signal })
    ).rejects.toMatchObject({
      code: 'ERR_GENERATION_FAILED',
      cause,
    });
    expect(fixture.native.acceptResult).not.toHaveBeenCalled();
    expect(fixture.history).toEqual([]);
    expect(fixture.native.discardResult).toHaveBeenCalledWith(
      fixture.native.generateAsync.mock.calls[0]![0]
    );
    session.dispose();
  }
);

it('rejects failed native acceptance without recording a successful shared turn', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  const session = await createSessionAsync();
  fixture.native.acceptResult.mockReturnValueOnce(false);
  await expect(session.generateAsync('rejected')).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
  const completion = new FakeSession();
  completion.generateAsync.mockResolvedValue(nativeResult('"answer"'));
  nativeModule.createSessionAsync.mockResolvedValueOnce(completion);
  await session.generateAsync('compatibility', { schema: schema.string() });
  expect(
    JSON.parse(JSON.parse(completion.generateAsync.mock.calls[0]![1]).task).previousTurns
  ).toEqual([]);
  session.dispose();
});

it('rejects an incomplete acceptance bridge before running the model', async () => {
  Object.assign(fixture.native, { acceptResult: undefined });
  const session = await createSessionAsync();
  await expect(session.generateAsync('task')).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
  expect(fixture.native.generateAsync).not.toHaveBeenCalled();
  session.dispose();
});
