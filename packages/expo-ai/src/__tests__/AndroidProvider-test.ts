import NativeModule from '../ExpoAI';
import type { ModelCapabilities } from '../LanguageModels.types';
import type { NativePreparationEvent } from '../NativeLanguageModels.types';
import {
  createSessionAsync,
  generateAsync,
  getAvailabilityAsync,
  prepareAsync,
  schema,
} from '../index';
import { FakeSession, nativeResult } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: {
    getAvailabilityAsync: jest.fn(),
    createSessionAsync: jest.fn(),
    prepareAsync: jest.fn(),
    cancelPreparation: jest.fn(),
    addListener: jest.fn(),
  },
}));

const nativeModule = jest.mocked(NativeModule!);
const capabilities: ModelCapabilities = {
  provider: 'google-mlkit',
  model: null,
  execution: 'on-device',
  constrainedOutput: 'unsupported',
  runtimeToolDeclarations: 'unsupported',
  images: 'unsupported',
  contextTokens: null,
};
const availability = (status = 'available', extra = {}) =>
  JSON.stringify({ status, capabilities, ...extra });
const listeners = new Set<(event: NativePreparationEvent) => void>();
const removals: jest.Mock[] = [];
const emit = (requestId: string, progress: number | null) =>
  listeners.forEach((listener) => listener({ requestId, progress }));
const flush = async () => {
  for (let index = 0; index < 60; index++) await Promise.resolve();
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
let owner: FakeSession;

beforeEach(() => {
  owner = new FakeSession();
  listeners.clear();
  removals.length = 0;
  nativeModule.getAvailabilityAsync.mockReset().mockResolvedValue(availability());
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(owner);
  nativeModule.prepareAsync!.mockReset().mockResolvedValue(availability());
  nativeModule.cancelPreparation!.mockReset();
  nativeModule.addListener!.mockReset().mockImplementation((_event, listener) => {
    listeners.add(listener);
    const remove = jest.fn(() => {
      listeners.delete(listener);
    });
    removals.push(remove);
    return { remove };
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it.each(['downloadable', 'downloading', 'not-ready'])(
  'preserves Android %s readiness without implicitly preparing or opening a session',
  async (status) => {
    nativeModule.getAvailabilityAsync.mockResolvedValue(availability(status, { progress: 0.4 }));
    await expect(getAvailabilityAsync()).resolves.toEqual({
      status,
      progress: 0.4,
    });
    await expect(prepareAsync()).resolves.toEqual({ status, progress: 0.4 });
    await expect(generateAsync('task')).rejects.toMatchObject({
      code: 'ERR_MODEL_NOT_READY',
    });
    expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
    expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
  }
);

it('preserves indeterminate progress and unavailable language support without a download', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  await expect(getAvailabilityAsync()).resolves.toEqual({
    status: 'downloadable',
    progress: null,
  });
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availability('unavailable', { reason: 'language-support-unknown' })
  );
  await expect(prepareAsync({ allowDownload: true, inputLanguages: ['en'] })).resolves.toEqual({
    status: 'unavailable',
    reason: 'language-support-unknown',
  });
  expect(nativeModule.getAvailabilityAsync).toHaveBeenLastCalledWith(['en'], null);
  expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
});

it('reports immutable Android capabilities and provider identity on text generation', async () => {
  const ready = await getAvailabilityAsync();
  expect(ready).toEqual({ status: 'available', capabilities });
  if (ready.status === 'available') expect(Object.isFrozen(ready.capabilities)).toBe(true);
  owner.generateAsync.mockImplementation(async (requestId) => {
    owner.emit('onText', { requestId, text: 'local' });
    return nativeResult('local answer');
  });
  const onUpdate = jest.fn();
  await expect(generateAsync('task', { onUpdate })).resolves.toMatchObject({
    value: 'local answer',
    provider: 'google-mlkit',
    model: null,
    format: 'text',
  });
  expect(onUpdate).toHaveBeenCalledWith({ text: 'local' });
  expect(owner.release).toHaveBeenCalledTimes(1);
});

it.each(['constrainedOutput', 'runtimeToolDeclarations', 'images'] as const)(
  'rejects the %s requirement before downloading',
  async (feature) => {
    nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
    await expect(prepareAsync({ allowDownload: true, requires: [feature] })).resolves.toEqual({
      status: 'unavailable',
      reason: 'unsupported-feature',
    });
    expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
  }
);

it.each([
  { execution: 'cloud' },
  { provider: '' },
  { model: 1 },
  { contextTokens: -1 },
  { constrainedOutput: 'sometimes' },
  { runtimeToolDeclarations: null },
])('rejects malformed provider capabilities: %p', async (change) => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availability('available', { capabilities: { ...capabilities, ...change } })
  );
  await expect(getAvailabilityAsync()).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it.each([-0.1, 1.1, '50%'])('rejects malformed availability progress %p', async (progress) => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloading', { progress }));
  await expect(getAvailabilityAsync()).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
});

it('prepares only after explicit consent, forwards progress by request identity, and removes listeners', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  const completion = deferred<string>();
  nativeModule.prepareAsync!.mockReturnValue(completion.promise);
  const onProgress = jest.fn();
  const task = prepareAsync({ allowDownload: true, onProgress });
  await flush();
  expect(listeners.size).toBe(1);
  const [requestId] = nativeModule.prepareAsync!.mock.calls[0]!;
  expect(nativeModule.prepareAsync).toHaveBeenCalledWith(requestId, true, [], null);
  emit('another-request', 0.8);
  emit(requestId, null);
  emit(requestId, 0.25);
  emit(requestId, 1);
  completion.resolve(availability());
  await expect(task).resolves.toEqual({ status: 'available', capabilities });
  expect(onProgress.mock.calls).toEqual([[null], [0.25], [1]]);
  expect(listeners.size).toBe(0);
  expect(removals[0]).toHaveBeenCalledTimes(1);
  expect(nativeModule.cancelPreparation).not.toHaveBeenCalled();
});

it.each([undefined, false])('does not prepare when allowDownload is %p', async (allowDownload) => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  await prepareAsync({ allowDownload });
  expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
  expect(nativeModule.addListener).not.toHaveBeenCalled();
});

it('does not prepare an already available model even with download consent', async () => {
  await expect(prepareAsync({ allowDownload: true })).resolves.toEqual({
    status: 'available',
    capabilities,
  });
  expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
});

it('cancels preparation and ignores late progress and completion with no default deadline', async () => {
  jest.useFakeTimers();
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  const completion = deferred<string>();
  nativeModule.prepareAsync!.mockReturnValue(completion.promise);
  const controller = new AbortController();
  const onProgress = jest.fn();
  const task = prepareAsync({
    allowDownload: true,
    signal: controller.signal,
    onProgress,
  });
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  const [requestId] = nativeModule.prepareAsync!.mock.calls[0]!;
  const callback = [...listeners][0]!;
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(3600000);
  controller.abort();
  await rejected;
  callback({ requestId, progress: 1 });
  completion.resolve(availability());
  await flush();
  expect(onProgress).not.toHaveBeenCalled();
  expect(nativeModule.cancelPreparation).toHaveBeenCalledTimes(1);
  expect(nativeModule.cancelPreparation).toHaveBeenCalledWith(requestId);
  expect(listeners.size).toBe(0);
});

it('does not start preparation if cancellation wins during readiness', async () => {
  const ready = deferred<string>();
  nativeModule.getAvailabilityAsync.mockReturnValue(ready.promise);
  const controller = new AbortController();
  const task = prepareAsync({ allowDownload: true, signal: controller.signal });
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  controller.abort();
  await rejected;
  ready.resolve(availability('downloadable'));
  await flush();
  expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
  expect(nativeModule.addListener).not.toHaveBeenCalled();
});

it('does not perform readiness work for an already aborted preparation', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    prepareAsync({ allowDownload: true, signal: controller.signal })
  ).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  expect(nativeModule.getAvailabilityAsync).not.toHaveBeenCalled();
  expect(nativeModule.prepareAsync).not.toHaveBeenCalled();
});

it.each(['sync', 'async'])(
  'cancels preparation when a %s progress callback fails',
  async (kind) => {
    nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
    nativeModule.prepareAsync!.mockReturnValue(new Promise(() => {}));
    const cause = new Error('Cannot update progress.');
    const onProgress =
      kind === 'sync'
        ? () => {
            throw cause;
          }
        : async () => {
            throw cause;
          };
    const task = prepareAsync({ allowDownload: true, onProgress });
    const rejected = expect(task).rejects.toMatchObject({
      code: 'ERR_PREPARATION_FAILED',
      cause,
    });
    await flush();
    const [requestId] = nativeModule.prepareAsync!.mock.calls[0]!;
    emit(requestId, 0.5);
    await rejected;
    expect(nativeModule.cancelPreparation).toHaveBeenCalledWith(requestId);
    expect(listeners.size).toBe(0);
  }
);

it('normalizes native preparation failure and still cleans up', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  const cause = Object.assign(new Error('The download failed.'), {
    code: 'ERR_PREPARATION_FAILED',
  });
  nativeModule.prepareAsync!.mockRejectedValue(cause);
  const task = prepareAsync({ allowDownload: true });
  await expect(task).rejects.toMatchObject({
    code: 'ERR_PREPARATION_FAILED',
    cause,
  });
  expect(listeners.size).toBe(0);
});

it('rejects malformed preparation responses without changing the public result shape', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  nativeModule.prepareAsync!.mockResolvedValue('not JSON');
  await expect(prepareAsync({ allowDownload: true })).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
  expect(listeners.size).toBe(0);
});

it('cancels malformed native progress before delivering it to the application', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  nativeModule.prepareAsync!.mockReturnValue(new Promise(() => {}));
  const onProgress = jest.fn();
  const task = prepareAsync({ allowDownload: true, onProgress });
  const rejected = expect(task).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
  await flush();
  const [requestId] = nativeModule.prepareAsync!.mock.calls[0]!;
  emit(requestId, 100);
  await rejected;
  expect(onProgress).not.toHaveBeenCalled();
  expect(nativeModule.cancelPreparation).toHaveBeenCalledWith(requestId);
  expect(listeners.size).toBe(0);
});

it('settles asynchronous progress callbacks before reporting prepared success', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  const progress = deferred<void>();
  nativeModule.prepareAsync!.mockImplementation(async (requestId) => {
    emit(requestId, 1);
    return availability();
  });
  const cause = new Error('The progress display failed after model readiness.');
  const task = prepareAsync({
    allowDownload: true,
    onProgress: () => progress.promise,
  });
  const rejected = expect(task).rejects.toMatchObject({
    code: 'ERR_PREPARATION_FAILED',
    cause,
  });
  await flush();
  progress.reject(cause);
  await rejected;
  expect(listeners.size).toBe(0);
  // Native preparation has already returned; no finished request needs cancellation.
  expect(nativeModule.cancelPreparation).not.toHaveBeenCalled();
});

it('preserves cancellation when native cancellation and listener cleanup throw', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  nativeModule.prepareAsync!.mockReturnValue(new Promise(() => {}));
  nativeModule.cancelPreparation!.mockImplementation(() => {
    throw new Error('Cancel failed.');
  });
  const controller = new AbortController();
  const task = prepareAsync({ allowDownload: true, signal: controller.signal });
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  removals[0]!.mockImplementation(() => {
    listeners.clear();
    throw new Error('Remove failed.');
  });
  controller.abort();
  await rejected;
  expect(removals[0]).toHaveBeenCalledTimes(1);
  expect(listeners.size).toBe(0);
});

it('reports a listener cleanup error after otherwise successful preparation', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloadable'));
  const completion = deferred<string>();
  nativeModule.prepareAsync!.mockReturnValue(completion.promise);
  const task = prepareAsync({ allowDownload: true });
  const cause = new Error('Remove failed.');
  const rejected = expect(task).rejects.toMatchObject({
    code: 'ERR_PREPARATION_FAILED',
    cause,
  });
  await flush();
  removals[0]!.mockImplementation(() => {
    listeners.clear();
    throw cause;
  });
  completion.resolve(availability());
  await rejected;
  expect(listeners.size).toBe(0);
});

it('keeps concurrent preparation cancellation and progress isolated', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(availability('downloading'));
  const first = deferred<string>();
  const second = deferred<string>();
  nativeModule.prepareAsync!.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const controller = new AbortController();
  const progress = jest.fn();
  const one = prepareAsync({ allowDownload: true, signal: controller.signal });
  const rejected = expect(one).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  const two = prepareAsync({ allowDownload: true, onProgress: progress });
  await flush();
  const [firstId] = nativeModule.prepareAsync!.mock.calls[0]!;
  const [secondId] = nativeModule.prepareAsync!.mock.calls[1]!;
  expect(firstId).not.toBe(secondId);
  controller.abort();
  await rejected;
  emit(secondId, 0.5);
  second.resolve(availability());
  await expect(two).resolves.toMatchObject({ status: 'available' });
  first.resolve(availability());
  expect(progress).toHaveBeenCalledWith(0.5);
  expect(nativeModule.cancelPreparation!.mock.calls).toEqual([[firstId]]);
  expect(listeners.size).toBe(0);
});

const inputSchema = schema.object({ query: schema.string() });
function tool(execute = jest.fn().mockResolvedValue({ count: 2, matches: ['local note'] })) {
  return {
    name: 'lookup',
    description: 'Read a local note.',
    inputSchema,
    execute,
  };
}
const action = JSON.stringify({
  type: 'tool',
  id: 'call-1',
  calls: { lookup: { query: 'note' } },
});
function completions(...responses: string[]) {
  const sessions = responses.map((response) => {
    const session = new FakeSession();
    session.generateAsync.mockResolvedValue(nativeResult(response));
    return session;
  });
  nativeModule.createSessionAsync.mockReset().mockResolvedValueOnce(owner);
  sessions.forEach((session) => nativeModule.createSessionAsync.mockResolvedValueOnce(session));
  return sessions;
}

it('automatically validates schemas and selects compatibility tools on Android', async () => {
  const session = await createSessionAsync({ tools: [tool()] });
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0]).tools).toEqual([]);
  session.dispose();
  owner.release.mockClear();
  completions('"answer"');
  await expect(generateAsync('task', { schema: schema.string() })).resolves.toMatchObject({
    value: 'answer',
    format: 'validated',
  });
  expect(owner.generateAsync).not.toHaveBeenCalled();
  expect(owner.release).toHaveBeenCalledTimes(1);
});

it('uses bounded shared validation repairs and retains Android result metadata', async () => {
  const sessions = completions('{"category":"invented"}', '{"category":"work"}');
  await expect(
    generateAsync('categorize', {
      schema: schema.object({ category: schema.enum(['work', 'other']) }),
      maximumRetries: 1,
    })
  ).resolves.toMatchObject({
    value: { category: 'work' },
    format: 'validated',
    provider: 'google-mlkit',
  });
  expect(owner.generateAsync).not.toHaveBeenCalled();
  for (const session of [owner, ...sessions]) expect(session.release).toHaveBeenCalledTimes(1);
  for (const [options] of nativeModule.createSessionAsync.mock.calls)
    expect(JSON.parse(options).tools).toEqual([]);
  expect(JSON.parse(sessions[1]!.generateAsync.mock.calls[0]![1]).history).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'invalid-output' }),
      expect.objectContaining({ type: 'repair' }),
    ])
  );
});

it('runs ordinary-data tools through approval and repairs without replaying completed work', async () => {
  const sessions = completions(action, 'not json', '{"type":"result","value":"found"}');
  const definition = tool();
  const beforeTool = jest.fn(async () => true);
  await expect(
    generateAsync('find a note', {
      tools: [definition],
      beforeTool,
      maximumSteps: 3,
    })
  ).resolves.toMatchObject({
    value: 'found',
    format: 'validated',
    provider: 'google-mlkit',
  });
  expect(definition.execute).toHaveBeenCalledTimes(1);
  expect(beforeTool).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'lookup', arguments: { query: 'note' } })
  );
  const history = JSON.parse(sessions[2]!.generateAsync.mock.calls[0]![1]).history;
  const observation = history.find((entry: { type: string }) => entry.type === 'completed-tool');
  expect(JSON.parse(observation.output)).toEqual({
    count: 2,
    matches: ['local note'],
  });
  expect(definition.execute).toHaveBeenCalledWith(
    { query: 'note' },
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
  for (const session of [owner, ...sessions]) expect(session.release).toHaveBeenCalledTimes(1);
});

it.each([
  ['replay', [action, action], { maximumSteps: 3 }, 'ERR_TOOL_CALL_REPLAY', 1],
  ['step limit', [action], { maximumSteps: 1 }, 'ERR_STEP_LIMIT', 0],
  ['repair limit', ['bad', 'bad'], { maximumRetries: 1 }, 'ERR_VALIDATION_RETRIES_EXHAUSTED', 0],
] as const)(
  'preserves the shared %s safety bound through Android',
  async (_name, responses, options, code, calls) => {
    const sessions = completions(...responses);
    const definition = tool();
    // Tool repair limits are selected through a validated schema request.
    await expect(
      generateAsync('task', {
        tools: [definition],
        schema: schema.string(),
        ...options,
      })
    ).rejects.toMatchObject({ code });
    expect(definition.execute).toHaveBeenCalledTimes(calls);
    for (const session of [owner, ...sessions]) expect(session.release).toHaveBeenCalledTimes(1);
  }
);

it('cancels Android compatibility during pending approval and ignores the late decision', async () => {
  completions(action);
  const decision = deferred<boolean>();
  const beforeTool = jest.fn(() => decision.promise);
  const definition = tool();
  const controller = new AbortController();
  const task = generateAsync('task', {
    tools: [definition],
    beforeTool,
    signal: controller.signal,
  });
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  expect(beforeTool).toHaveBeenCalledTimes(1);
  controller.abort();
  await rejected;
  decision.resolve(true);
  await flush();
  expect(definition.execute).not.toHaveBeenCalled();
  expect(owner.release).toHaveBeenCalledTimes(1);
});

it('denies an Android compatibility tool before its handler starts', async () => {
  const sessions = completions(action);
  const definition = tool();
  await expect(
    generateAsync('task', {
      tools: [definition],
      beforeTool: async () => false,
    })
  ).rejects.toMatchObject({ code: 'ERR_TOOL_DENIED' });
  expect(definition.execute).not.toHaveBeenCalled();
  for (const session of [owner, ...sessions]) expect(session.release).toHaveBeenCalledTimes(1);
});
