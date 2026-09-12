import NativeModule from '../ExpoAI';
import type { NativeSession } from '../NativeLanguageModels.types';
import {
  generateAsync,
  summarizeAsync,
  categorizeAsync,
  LanguageModelError,
  schema,
} from '../index';
import { availableModel, FakeSession } from './fixtures/FakeSession';
import { LegacyAbortController } from './fixtures/LegacyAbortController';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: { getAvailabilityAsync: jest.fn(), createSessionAsync: jest.fn() },
}));

const nativeModule = jest.mocked(NativeModule!);
let native: FakeSession;
const flush = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
const inputSchema = schema.object({ query: schema.string() });
const makeTool = (execute = jest.fn().mockResolvedValue({ matches: ['local note'] })) => ({
  name: 'lookup',
  description: 'Find local notes.',
  inputSchema,
  execute,
});

beforeEach(() => {
  native = new FakeSession();
  nativeModule.getAvailabilityAsync.mockReset().mockResolvedValue('{"status":"available"}');
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(native);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('generates directly without a prior availability call and disposes its independent session', async () => {
  const next = new FakeSession();
  nativeModule.createSessionAsync.mockResolvedValueOnce(native).mockResolvedValueOnce(next);
  await expect(generateAsync('first')).resolves.toMatchObject({
    value: 'ready',
    format: 'text',
  });
  await expect(generateAsync('second')).resolves.toMatchObject({
    value: 'ready',
  });
  for (const session of [native, next]) {
    expect(session.generateAsync).toHaveBeenCalledTimes(1);
    expect(session.dispose).toHaveBeenCalledTimes(1);
    expect(session.release).toHaveBeenCalledTimes(1);
    expect(session.listenerCount).toBe(0);
  }
});

it.each([
  ['not-ready', 'ERR_MODEL_NOT_READY'],
  ['unavailable', 'ERR_MODEL_UNAVAILABLE'],
])('reports %s without starting native generation or preparation', async (status, code) => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    JSON.stringify({ status, reason: 'unsupported-device' })
  );
  await expect(generateAsync('task')).rejects.toMatchObject({ code });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('keeps readiness errors from the native creation race recognizable with their cause', async () => {
  const cause = Object.assign(new Error('Assets became unavailable.'), {
    code: 'ERR_MODEL_NOT_READY',
  });
  nativeModule.createSessionAsync.mockRejectedValue(cause);
  const error = await generateAsync('task').catch((error) => error);
  expect(error).toBeInstanceOf(LanguageModelError);
  expect(error).toMatchObject({ code: 'ERR_MODEL_NOT_READY', cause });
});

it('does not start availability or native work for an already canceled task', async () => {
  await expect(generateAsync('task', { signal: AbortSignal.abort('left') })).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  expect(nativeModule.getAvailabilityAsync).not.toHaveBeenCalled();
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('preserves one-shot deadline errors with React Native reason-less cancellation signals', async () => {
  jest.useFakeTimers();
  jest.spyOn(globalThis, 'AbortController').mockImplementation(() => new LegacyAbortController());
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  const request = generateAsync('task', { timeoutMs: 100 });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_TIMEOUT',
  });
  await flush();
  jest.advanceTimersByTime(100);
  await rejected;
  expect(native.cancel).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('cancels during readiness without creating a session when readiness later completes', async () => {
  let ready!: (value: string) => void;
  nativeModule.getAvailabilityAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      })
  );
  const controller = new AbortController();
  const request = generateAsync('task', { signal: controller.signal });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  controller.abort();
  await rejected;
  ready('{"status":"available"}');
  await flush();
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('releases a session that finishes opening after task cancellation', async () => {
  let opened!: (session: NativeSession) => void;
  nativeModule.createSessionAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        opened = resolve;
      })
  );
  const controller = new AbortController();
  const request = generateAsync('task', { signal: controller.signal });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  await flush();
  controller.abort();
  await rejected;
  opened(native);
  await flush();
  expect(native.dispose).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
  expect(native.generateAsync).not.toHaveBeenCalled();
});

it('has no default deadline or timer even during prolonged readiness and generation', async () => {
  jest.useFakeTimers();
  let ready!: (value: string) => void;
  nativeModule.getAvailabilityAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      })
  );
  const controller = new AbortController();
  const request = generateAsync('task', { signal: controller.signal });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  await flush();
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(3_600_000);
  ready('{"status":"available"}');
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  await flush();
  expect(native.generateAsync).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
  controller.abort();
  await rejected;
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('includes readiness and session creation in the explicit whole-task deadline', async () => {
  jest.useFakeTimers();
  let ready!: (value: string) => void;
  let opened!: (session: NativeSession) => void;
  nativeModule.getAvailabilityAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      })
  );
  nativeModule.createSessionAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        opened = resolve;
      })
  );
  const request = generateAsync('task', { timeoutMs: 100 });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_TIMEOUT',
  });
  jest.advanceTimersByTime(60);
  ready('{"status":"available"}');
  await flush();
  jest.advanceTimersByTime(40);
  await rejected;
  opened(native);
  await flush();
  expect(native.release).toHaveBeenCalledTimes(1);
  expect(native.generateAsync).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

it.each([
  ['ERR_REQUEST_CANCELLED', 'ERR_ABORTED'],
  ['ERR_INVALID_ARGUMENT', 'ERR_OPTIONS_INVALID'],
  ['ERR_UNSUPPORTED_OS', 'ERR_MODEL_UNAVAILABLE'],
  ['ERR_TOOL_EXECUTION', 'ERR_TOOL_FAILED'],
  ['ERR_SOMETHING_NEW', 'ERR_GENERATION_FAILED'],
])('normalizes native %s and retains the original failure', async (nativeCode, code) => {
  const cause = Object.assign(new Error('Native failure.'), {
    code: nativeCode,
  });
  native.generateAsync.mockRejectedValue(cause);
  const error = await generateAsync('task').catch((error) => error);
  expect(error).toBeInstanceOf(LanguageModelError);
  expect(error).toMatchObject({ code, cause });
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('emits cumulative previews and validates the final structured result', async () => {
  native.generateAsync.mockImplementation(async (requestId) => {
    native.emit('onText', { requestId, text: '{"title":' });
    await flush();
    native.emit('onText', { requestId, text: '{"title":"Note"}' });
    return '{"title":"Note"}';
  });
  const onUpdate = jest.fn();
  await expect(
    generateAsync('task', {
      schema: schema.object({ title: schema.string() }),
      onUpdate,
    })
  ).resolves.toMatchObject({ value: { title: 'Note' } });
  expect(onUpdate.mock.calls).toEqual([[{ text: '{"title":' }], [{ text: '{"title":"Note"}' }]]);
  expect(JSON.parse(native.generateAsync.mock.calls[0]![2]).stream).toBe(true);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('rejects an invalid final result after a provisional update and cleans up', async () => {
  native.generateAsync.mockImplementation(async (requestId) => {
    native.emit('onText', { requestId, text: 'maybe' });
    await flush();
    return 'invalid';
  });
  const onUpdate = jest.fn();
  await expect(generateAsync('task', { schema: schema.string(), onUpdate })).rejects.toMatchObject({
    code: 'ERR_RESPONSE_INVALID',
  });
  expect(onUpdate).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it.each(['throw', 'reject'])(
  'cancels generation when the update callback fails by %s',
  async (kind) => {
    const cause = new Error('Preview failed.');
    native.generateAsync.mockImplementation(async (requestId) => {
      native.emit('onText', { requestId, text: 'partial' });
      return new Promise(() => {});
    });
    const onUpdate = () => {
      if (kind === 'throw') throw cause;
      return Promise.reject(cause);
    };
    await expect(generateAsync('task', { onUpdate })).rejects.toMatchObject({
      code: 'ERR_UPDATE_FAILED',
      cause,
    });
    expect(native.cancel).toHaveBeenCalledTimes(1);
    expect(native.release).toHaveBeenCalledTimes(1);
  }
);

it('stops updates after cancellation and propagates a signal to pending approval', async () => {
  const controller = new AbortController();
  const tool = makeTool();
  let approvalSignal: AbortSignal | undefined;
  native.generateAsync.mockImplementation(async (requestId) => {
    native.emit('onToolCall', {
      requestId,
      callId: 'one',
      name: tool.name,
      argumentsJSON: '{"query":"notes"}',
    });
    return new Promise(() => {});
  });
  const onUpdate = jest.fn();
  const request = generateAsync('task', {
    tools: [tool],
    signal: controller.signal,
    onUpdate,
    beforeTool: ({ signal }) => {
      approvalSignal = signal;
      return new Promise(() => {});
    },
  });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  await flush();
  controller.abort();
  await rejected;
  const requestId = native.generateAsync.mock.calls[0]![0];
  native.emit('onText', { requestId, text: 'too late' });
  expect(approvalSignal?.aborted).toBe(true);
  expect(tool.execute).not.toHaveBeenCalled();
  expect(onUpdate).not.toHaveBeenCalled();
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('includes approval in an explicit deadline and never starts the handler afterward', async () => {
  jest.useFakeTimers();
  const tool = makeTool();
  let approve!: (allow: boolean) => void;
  native.generateAsync.mockImplementation(async (requestId) => {
    native.emit('onToolCall', {
      requestId,
      callId: 'one',
      name: tool.name,
      argumentsJSON: '{"query":"notes"}',
    });
    return new Promise(() => {});
  });
  const request = generateAsync('task', {
    tools: [tool],
    timeoutMs: 50,
    beforeTool: () =>
      new Promise((resolve) => {
        approve = resolve;
      }),
  });
  const rejected = expect(request).rejects.toMatchObject({
    code: 'ERR_TIMEOUT',
  });
  await flush();
  jest.advanceTimersByTime(50);
  await rejected;
  approve(true);
  await flush();
  expect(tool.execute).not.toHaveBeenCalled();
  expect(native.cancel).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('snapshots tools, schema, instructions and request limits before asynchronous readiness', async () => {
  let ready!: (value: string) => void;
  nativeModule.getAvailabilityAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      })
  );
  const tool = makeTool();
  const outputSchema = {
    type: 'string' as const,
    enum: ['work', 'other'] as [string, ...string[]],
  };
  const options = {
    tools: [tool],
    instructions: 'original',
    schema: outputSchema,
    maximumToolCalls: 1,
  };
  const request = generateAsync('task', options);
  tool.name = 'changed';
  options.instructions = 'changed';
  options.maximumToolCalls = 16;
  outputSchema.enum[0] = 'changed';
  native.generateAsync.mockResolvedValue('"work"');
  ready('{"status":"available"}');
  await expect(request).resolves.toMatchObject({ value: 'work' });
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0])).toMatchObject({
    instructions: 'original',
    tools: [{ name: 'lookup' }],
  });
  expect(JSON.parse(native.generateAsync.mock.calls[0]![2]).maximumToolCalls).toBe(1);
});

it('serializes ordinary tool data for the native provider and denies before execution', async () => {
  const tool = makeTool();
  native.generateAsync.mockImplementation(
    (requestId) =>
      new Promise((resolve) => {
        native.resolveTool.mockImplementation(() => {
          resolve('answer');
          return true;
        });
        native.emit('onToolCall', {
          requestId,
          callId: 'one',
          name: tool.name,
          argumentsJSON: '{"query":"notes"}',
        });
      })
  );
  await expect(generateAsync('task', { tools: [tool] })).resolves.toMatchObject({
    value: 'answer',
  });
  expect(native.resolveTool).toHaveBeenCalledWith('one', '{"matches":["local note"]}', null);
  tool.execute.mockClear();
  await expect(
    generateAsync('task', { tools: [tool], beforeTool: () => false })
  ).rejects.toMatchObject({ code: 'ERR_TOOL_DENIED' });
  expect(tool.execute).not.toHaveBeenCalled();
});

it('runs both task helpers through the shared API with validated category results', async () => {
  await expect(summarizeAsync('notes', { length: 'short' })).resolves.toMatchObject({
    value: 'ready',
    format: 'text',
  });
  expect(native.generateAsync.mock.calls[0]![1]).toContain('brief summary');
  native.generateAsync.mockResolvedValue('"work"');
  await expect(
    categorizeAsync('message', { categories: ['work', 'personal'] })
  ).resolves.toMatchObject({ value: 'work', format: 'constrained' });
  native.generateAsync.mockResolvedValue('"invented"');
  await expect(
    categorizeAsync('message', { categories: ['work', 'personal'] })
  ).rejects.toMatchObject({ code: 'ERR_RESPONSE_INVALID' });
  expect(native.release).toHaveBeenCalledTimes(3);
});

it('automatically categorizes without native constraints and emits no fabricated previews', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  const completion = new FakeSession();
  completion.generateAsync.mockResolvedValue('"personal"');
  nativeModule.createSessionAsync.mockResolvedValueOnce(native).mockResolvedValueOnce(completion);
  const onUpdate = jest.fn();
  await expect(
    categorizeAsync('message', { categories: ['work', 'personal'], onUpdate })
  ).resolves.toMatchObject({ value: 'personal', format: 'validated' });
  expect(onUpdate).not.toHaveBeenCalled();
  expect(completion.release).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('keeps model readiness errors recognizable in validated compatibility', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  const completion = new FakeSession();
  const cause = Object.assign(new Error('Assets are not ready.'), {
    code: 'ERR_MODEL_NOT_READY',
  });
  completion.generateAsync.mockRejectedValue(cause);
  nativeModule.createSessionAsync.mockResolvedValueOnce(native).mockResolvedValueOnce(completion);
  await expect(
    categorizeAsync('message', { categories: ['work', 'personal'] })
  ).rejects.toMatchObject({ code: 'ERR_MODEL_NOT_READY', cause });
  expect(completion.release).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
});

it('does not impose a deadline while tool approval is pending', async () => {
  jest.useFakeTimers();
  const tool = makeTool();
  let approve!: (allowed: boolean) => void;
  native.generateAsync.mockImplementation(
    (requestId) =>
      new Promise((resolve) => {
        native.resolveTool.mockImplementation(() => {
          resolve('approved');
          return true;
        });
        native.emit('onToolCall', {
          requestId,
          callId: 'one',
          name: tool.name,
          argumentsJSON: '{"query":"notes"}',
        });
      })
  );
  const request = generateAsync('task', {
    tools: [tool],
    beforeTool: () =>
      new Promise((resolve) => {
        approve = resolve;
      }),
  });
  await flush();
  jest.advanceTimersByTime(3_600_000);
  expect(jest.getTimerCount()).toBe(0);
  expect(tool.execute).not.toHaveBeenCalled();
  approve(true);
  await expect(request).resolves.toMatchObject({ value: 'approved' });
  expect(tool.execute).toHaveBeenCalledTimes(1);
});

it.each([{ unknown: true }, { onUpdate: true }, { timeoutMs: null }, { maximumToolCalls: -1 }])(
  'rejects invalid task options before readiness: %p',
  async (options) => {
    await expect(generateAsync('task', options as never)).rejects.toMatchObject({
      code: 'ERR_OPTIONS_INVALID',
    });
    expect(nativeModule.getAvailabilityAsync).not.toHaveBeenCalled();
  }
);

it.each(
  [[], [''], ['a', 'a'], ['a', 1], new Array(1)].map((categories) => ({
    categories,
  }))
)('rejects invalid categories before readiness: %p', async ({ categories }) => {
  await expect(categorizeAsync('task', { categories: categories as never })).rejects.toMatchObject({
    code: 'ERR_OPTIONS_INVALID',
  });
  expect(nativeModule.getAvailabilityAsync).not.toHaveBeenCalled();
});
