import NativeModule from '../ExpoAI';
import type { NativeModuleEvents } from '../NativeLanguageModels.types';
import {
  createSessionAsync,
  generateAsync,
  getAvailabilityAsync,
  prepareAsync,
  schema,
  type ToolCall,
} from '../index';
import { availableModel, FakeSession } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: {
    supportsBackgroundEvents: true,
    getAvailabilityAsync: jest.fn(),
    createSessionAsync: jest.fn(),
    prepareAsync: jest.fn(),
    cancelPreparation: jest.fn(),
    addListener: jest.fn(),
  },
}));
const nativeModule = jest.mocked(NativeModule!);
const listeners = new Map<string, Set<(value: never) => void>>();
const emit = <E extends keyof NativeModuleEvents>(event: E, value: NativeModuleEvents[E]) => {
  listeners.get(event)?.forEach((listener) => listener(value as never));
};
const flush = async () => {
  for (let index = 0; index < 100; index++) await Promise.resolve();
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
let owner: FakeSession;
const available = () =>
  availableModel({
    provider: 'google-mlkit',
    constrainedOutput: 'unsupported',
    runtimeToolDeclarations: 'unsupported',
  });
const completion = (response: string) => {
  const native = new FakeSession();
  native.generateAsync.mockResolvedValue(response);
  return native;
};

beforeEach(() => {
  owner = new FakeSession();
  listeners.clear();
  nativeModule.getAvailabilityAsync.mockReset().mockResolvedValue(available());
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(owner);
  nativeModule.prepareAsync!.mockReset();
  nativeModule.cancelPreparation!.mockReset();
  nativeModule.addListener!.mockReset().mockImplementation((event, listener) => {
    const callbacks = listeners.get(event) ?? new Set();
    callbacks.add(listener as (value: never) => void);
    listeners.set(event, callbacks);
    return {
      remove: () => callbacks.delete(listener as (value: never) => void),
    };
  });
});
afterEach(() => {
  for (const callbacks of listeners.values()) expect(callbacks.size).toBe(0);
});

it('preserves the background error from availability and one-shot setup', async () => {
  const cause = Object.assign(new Error('App is backgrounded.'), {
    code: 'ERR_APP_BACKGROUND',
  });
  nativeModule.getAvailabilityAsync.mockRejectedValue(cause);
  await expect(getAvailabilityAsync()).rejects.toMatchObject({
    code: 'ERR_APP_BACKGROUND',
    cause,
  });
  await expect(generateAsync('task')).rejects.toMatchObject({
    code: 'ERR_APP_BACKGROUND',
    cause,
  });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('interrupts one-shot setup before availability returns without opening a later session', async () => {
  const ready = deferred<string>();
  nativeModule.getAvailabilityAsync.mockReturnValue(ready.promise);
  const request = generateAsync('task');
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_APP_BACKGROUND',
  });
  await flush();
  emit('onBackground', {});
  await rejected;
  ready.resolve(available());
  await flush();
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('interrupts native text work and leaves session disposal to its owner', async () => {
  owner.generateAsync.mockImplementation(() => new Promise(() => {}));
  const session = await createSessionAsync();
  const request = session.generateAsync('task');
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_APP_BACKGROUND',
  });
  await flush();
  emit('onBackground', {});
  await rejected;
  expect(owner.cancel).toHaveBeenCalledTimes(1);
  expect(owner.dispose).not.toHaveBeenCalled();
  owner.generateAsync.mockResolvedValue('next');
  await expect(session.generateAsync('retry chosen by app')).resolves.toMatchObject({
    value: 'next',
  });
  session.dispose();
});

it.each(['approval', 'handler'] as const)(
  'interrupts pending compatibility %s and excludes the incomplete turn from later shared history',
  async (phase) => {
    const pending = deferred<boolean>();
    const execute = jest.fn(() => (phase === 'handler' ? pending.promise : Promise.resolve(true)));
    const beforeTool = jest.fn((_call: ToolCall) =>
      phase === 'approval' ? pending.promise : Promise.resolve(true)
    );
    const definition = {
      name: 'save',
      description: 'Save a local note.',
      inputSchema: schema.object({ text: schema.string() }),
      execute,
    };
    const first = completion('{"type":"result","value":"first"}');
    const action = completion(
      '{"type":"tool","id":"one","name":"save","arguments":{"text":"note"}}'
    );
    const next = completion('{"type":"result","value":"next"}');
    nativeModule.createSessionAsync
      .mockReset()
      .mockResolvedValueOnce(owner)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(action)
      .mockResolvedValueOnce(next);
    const session = await createSessionAsync({ tools: [definition] });
    await session.generateAsync('first task');
    const request = session.generateAsync('interrupted task', { beforeTool });
    const rejected = expect(request).rejects.toMatchObject({
      code: 'ERR_APP_BACKGROUND',
    });
    await flush();
    expect(beforeTool).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(phase === 'handler' ? 1 : 0);
    emit('onBackground', {});
    await rejected;
    expect(beforeTool.mock.calls[0]![0].signal.aborted).toBe(true);
    pending.resolve(true);
    await flush();
    expect(execute).toHaveBeenCalledTimes(phase === 'handler' ? 1 : 0);
    expect(nativeModule.createSessionAsync).toHaveBeenCalledTimes(3);
    await expect(session.generateAsync('next task')).resolves.toMatchObject({
      value: 'next',
    });
    expect(JSON.parse(JSON.parse(next.generateAsync.mock.calls[0]![1]).task).previousTurns).toEqual(
      [{ prompt: 'first task', value: 'first' }]
    );
    session.dispose();
  }
);

it('interrupts preparation while an asynchronous progress callback is pending', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue('{"status":"downloadable"}');
  const ready = deferred<string>();
  const progress = deferred<void>();
  nativeModule.prepareAsync!.mockReturnValue(ready.promise);
  const request = prepareAsync({
    allowDownload: true,
    onProgress: () => progress.promise,
  });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_APP_BACKGROUND',
  });
  await flush();
  const id = nativeModule.prepareAsync!.mock.calls[0]![0];
  emit('onPreparationProgress', { requestId: id, progress: 0.5 });
  await flush();
  emit('onBackground', {});
  await rejected;
  expect(nativeModule.cancelPreparation).toHaveBeenCalledWith(id);
  ready.resolve(available());
  progress.resolve();
  await flush();
});
