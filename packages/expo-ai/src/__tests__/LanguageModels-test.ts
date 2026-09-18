import NativeModule from '../ExpoAI';
import { createSessionAsync, getAvailabilityAsync, prepareAsync } from '../LanguageModels';
import type { SessionOptions, ModelRequirements } from '../LanguageModels.types';
import type { NativeSession } from '../NativeLanguageModels.types';
import { availableModel, FakeSession, nativeResult } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: { getAvailabilityAsync: jest.fn(), createSessionAsync: jest.fn() },
}));

const nativeModule = jest.mocked(NativeModule!);
let native: FakeSession;
const schema = {
  type: 'object',
  properties: { category: { type: 'string', enum: ['work', 'other'] } },
  required: ['category'],
  additionalProperties: false,
} as const;
const flush = async () => {
  for (let i = 0; i < 15; i++) await Promise.resolve();
};

beforeEach(() => {
  native = new FakeSession();
  nativeModule.getAvailabilityAsync
    .mockReset()
    .mockResolvedValue(availableModel({ contextTokens: 4096 }));
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(native);
});

it('checks language requirements and exposes only implemented capabilities', async () => {
  const requirements = {
    inputLanguages: ['en'],
    outputLanguage: 'en',
  } as const;
  await expect(getAvailabilityAsync(requirements)).resolves.toMatchObject({
    status: 'available',
    capabilities: {
      execution: 'on-device',
      contextTokens: 4096,
      images: 'unsupported',
    },
  });
  expect(nativeModule.getAvailabilityAsync).toHaveBeenCalledWith(['en'], 'en');
  await expect(getAvailabilityAsync({ requires: ['images'] })).resolves.toEqual({
    status: 'unavailable',
    reason: 'unsupported-feature',
  });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('does not fabricate readiness or trigger model preparation', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue('{"status":"not-ready"}');
  await expect(prepareAsync({ allowDownload: true })).resolves.toEqual({
    status: 'not-ready',
    progress: null,
  });
  await expect(createSessionAsync()).rejects.toMatchObject({
    code: 'ERR_MODEL_NOT_READY',
  });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('snapshots requirements before checking asynchronous provider readiness', async () => {
  let ready!: (value: string) => void;
  nativeModule.getAvailabilityAsync.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      })
  );
  const requirements: ModelRequirements = {
    requires: ['constrainedOutput'],
    inputLanguages: ['en'],
  };
  const check = getAvailabilityAsync(requirements);
  (requirements.requires as string[])[0] = 'images';
  (requirements.inputLanguages as string[])[0] = 'invalid-change';
  ready(availableModel());
  await expect(check).resolves.toMatchObject({ status: 'available' });
  expect(nativeModule.getAvailabilityAsync).toHaveBeenCalledWith(['en'], null);
});

it('snapshots tools across asynchronous native creation', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  let finishOpening!: (session: NativeSession) => void;
  const completion = new FakeSession();
  completion.generateAsync.mockResolvedValue(nativeResult('{"type":"result","value":"answer"}'));
  nativeModule.createSessionAsync
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOpening = resolve;
        })
    )
    .mockResolvedValueOnce(completion);
  const { tool } = makeTool();
  const options: SessionOptions = { tools: [tool] };
  const opening = createSessionAsync(options);
  await flush();
  options.tools = [];
  finishOpening(native);
  const session = await opening;
  await expect(session.generateAsync('question')).resolves.toMatchObject({
    value: 'answer',
    format: 'validated',
  });
  expect(native.generateAsync).not.toHaveBeenCalled();
  session.dispose();
});

it('rejects unknown schema constraints before native generation and validates final output', async () => {
  const session = await createSessionAsync();
  await expect(
    session.generateAsync('test', {
      schema: { type: 'string', pattern: 'x' } as never,
    })
  ).rejects.toMatchObject({ code: 'ERR_SCHEMA_UNSUPPORTED' });
  expect(native.generateAsync).not.toHaveBeenCalled();
  native.generateAsync.mockResolvedValue(nativeResult('{"category":"invented"}'));
  await expect(session.generateAsync('test', { schema })).rejects.toMatchObject({
    code: 'ERR_RESPONSE_INVALID',
  });
  expect(native.listenerCount).toBe(0);
  native.generateAsync.mockResolvedValue(nativeResult('{"category":"work"}'));
  await expect(session.generateAsync('test', { schema })).resolves.toMatchObject({
    value: { category: 'work' },
    format: 'constrained',
  });
  session.dispose();
});

it('rejects overlapping requests and aborts uncooperative native work', async () => {
  const session = await createSessionAsync();
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  const controller = new AbortController();
  const request = session.generateAsync('first', { signal: controller.signal });
  const aborted = expect(request).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  await expect(session.generateAsync('second')).rejects.toMatchObject({
    code: 'ERR_SESSION_BUSY',
  });
  controller.abort();
  await aborted;
  expect(native.cancel).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
  session.dispose();
});

it('disposes pending work and releases native ownership exactly once', async () => {
  const session = await createSessionAsync();
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  const request = session.generateAsync('pending');
  const disposed = expect(request).rejects.toMatchObject({
    code: 'ERR_SESSION_DISPOSED',
  });
  await flush();
  expect(native.listenerCount).toBe(2);
  session.dispose();
  session.dispose();
  await disposed;
  expect(native.listenerCount).toBe(0);
  expect(native.dispose).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
  await expect(session.generateAsync('later')).rejects.toMatchObject({
    code: 'ERR_SESSION_DISPOSED',
  });
});

it('streams snapshots and one validated result; early return aborts the request', async () => {
  const session = await createSessionAsync();
  native.generateAsync.mockImplementation(async (requestId) => {
    native.emit('onText', { requestId, text: 'hello' });
    return nativeResult('hello world');
  });
  const events = [];
  for await (const event of session.generateStream('test')) events.push(event);
  expect(events).toEqual([
    { type: 'text', text: 'hello' },
    {
      type: 'result',
      result: expect.objectContaining({ value: 'hello world' }),
    },
  ]);
  native.generateAsync.mockImplementation(async (requestId) => {
    native.emit('onText', { requestId, text: 'partial' });
    return new Promise(() => {});
  });
  for await (const event of session.generateStream('again')) {
    expect(event.type).toBe('text');
    break;
  }
  expect(native.cancel).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
  session.dispose();
});

it('a rejected stream cannot abort a different active request', async () => {
  const session = await createSessionAsync();
  const controller = new AbortController();
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  const running = session.generateAsync('owner', { signal: controller.signal });
  const rejected = expect(running).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  const iterator = session.generateStream('other')[Symbol.asyncIterator]();
  await expect(iterator.next()).rejects.toMatchObject({
    code: 'ERR_SESSION_BUSY',
  });
  expect(native.cancel).not.toHaveBeenCalled();
  controller.abort();
  await rejected;
  session.dispose();
});

it('closing a stream cancels immediately while its first next is still waiting', async () => {
  const session = await createSessionAsync();
  native.generateAsync.mockImplementation(() => new Promise(() => {}));
  const iterator = session.generateStream('silent model')[Symbol.asyncIterator]();
  const waiting = iterator.next();
  await flush();
  await expect(iterator.return!()).resolves.toMatchObject({ done: true });
  await expect(waiting).resolves.toMatchObject({ done: true });
  expect(native.cancel).toHaveBeenCalledTimes(1);
  expect(native.listenerCount).toBe(0);
  session.dispose();
});

function makeTool(execute = jest.fn().mockResolvedValue('local result')) {
  return {
    execute,
    tool: {
      name: 'lookup',
      description: 'Read local notes.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      } as const,
      execute,
    },
  };
}

it('validates and intercepts a native tool call before replying asynchronously', async () => {
  const { tool, execute } = makeTool();
  const session = await createSessionAsync({ tools: [tool] });
  native.generateAsync.mockImplementation(
    (requestId) =>
      new Promise((resolve) => {
        native.resolveTool.mockImplementation(() => {
          resolve(nativeResult('answer'));
          return true;
        });
        native.emit('onToolCall', {
          requestId,
          callId: 'call-1',
          name: 'lookup',
          argumentsJSON: '{"query":"release"}',
        });
      })
  );
  const beforeTool = jest.fn(async (call) => {
    call.arguments.query = 'mutated';
    return true;
  });
  await expect(session.generateAsync('question', { beforeTool })).resolves.toMatchObject({
    value: 'answer',
  });
  expect(execute).toHaveBeenCalledWith(
    { query: 'release' },
    expect.objectContaining({
      callId: 'call-1',
      signal: expect.any(AbortSignal),
    })
  );
  expect(native.resolveTool).toHaveBeenCalledWith('call-1', 'local result', null);
  expect(native.listenerCount).toBe(0);
  session.dispose();
});

it.each(['invalid', 'denied', 'failed'])(
  'cancels a %s tool without a native retry or handler replay',
  async (scenario) => {
    const execute =
      scenario === 'failed'
        ? jest.fn().mockRejectedValue(new Error('failed effect'))
        : jest.fn().mockResolvedValue('result');
    const { tool } = makeTool(execute);
    const session = await createSessionAsync({ tools: [tool] });
    native.generateAsync.mockImplementation((requestId) => {
      native.emit('onToolCall', {
        requestId,
        callId: 'call-1',
        name: 'lookup',
        argumentsJSON: scenario === 'invalid' ? '{"query":42}' : '{"query":"valid"}',
      });
      return new Promise(() => {});
    });
    const expected =
      scenario === 'invalid'
        ? 'ERR_RESPONSE_INVALID'
        : scenario === 'denied'
          ? 'ERR_TOOL_DENIED'
          : 'ERR_TOOL_FAILED';
    await expect(
      session.generateAsync('question', {
        beforeTool: () => scenario !== 'denied',
      })
    ).rejects.toMatchObject({ code: expected });
    expect(execute).toHaveBeenCalledTimes(scenario === 'failed' ? 1 : 0);
    expect(native.cancel).toHaveBeenCalledTimes(1);
    expect(native.resolveTool).not.toHaveBeenCalled();
    session.dispose();
  }
);

it('preserves completed turns when alternating native text and compatibility output', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  const first = new FakeSession();
  const second = new FakeSession();
  first.generateAsync.mockResolvedValue(nativeResult('broken'));
  second.generateAsync.mockResolvedValue(nativeResult('{"category":"work"}'));
  nativeModule.createSessionAsync
    .mockResolvedValueOnce(native)
    .mockResolvedValueOnce(first)
    .mockResolvedValueOnce(second);
  const session = await createSessionAsync();
  await session.generateAsync('first text');
  await expect(
    session.generateAsync('categorize', { schema, maximumRetries: 1 })
  ).resolves.toMatchObject({
    value: { category: 'work' },
    format: 'validated',
  });
  expect(native.generateAsync).toHaveBeenCalledTimes(1);
  expect(JSON.parse(JSON.parse(first.generateAsync.mock.calls[0]![1]).task).previousTurns).toEqual([
    { prompt: 'first text', value: 'ready' },
  ]);
  expect(first.dispose).toHaveBeenCalledTimes(1);
  expect(second.dispose).toHaveBeenCalledTimes(1);
  await expect(session.generateAsync('switch')).resolves.toMatchObject({
    value: 'ready',
    format: 'text',
  });
  expect(JSON.parse(native.generateAsync.mock.calls[1]![1])).toMatchObject({
    previousTurns: [{ prompt: 'categorize', value: { category: 'work' } }],
    task: 'switch',
  });
  await session.generateAsync('another text');
  expect(native.generateAsync.mock.calls[2]![1]).toBe('another text');
  session.dispose();
});

it('releases a compatibility session that finishes opening after cancellation', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  let finishOpening!: (session: NativeSession) => void;
  nativeModule.createSessionAsync.mockResolvedValueOnce(native).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishOpening = resolve;
      })
  );
  const session = await createSessionAsync();
  const controller = new AbortController();
  const request = session.generateAsync('categorize', {
    schema,
    signal: controller.signal,
  });
  const aborted = expect(request).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  await flush();
  controller.abort();
  await aborted;
  const late = new FakeSession();
  finishOpening(late);
  await flush();
  expect(late.dispose).toHaveBeenCalledTimes(1);
  expect(late.release).toHaveBeenCalledTimes(1);
  expect(late.generateAsync).not.toHaveBeenCalled();
  session.dispose();
});

it('snapshots the tool budget before handlers can mutate caller options', async () => {
  const options = { maximumToolCalls: 1 };
  const { tool, execute } = makeTool();
  const session = await createSessionAsync({ tools: [tool] });
  native.generateAsync.mockImplementation((requestId) => {
    native.resolveTool.mockImplementationOnce(() => {
      options.maximumToolCalls = 100;
      native.emit('onToolCall', {
        requestId,
        callId: 'call-2',
        name: 'lookup',
        argumentsJSON: '{"query":"second"}',
      });
      return true;
    });
    native.emit('onToolCall', {
      requestId,
      callId: 'call-1',
      name: 'lookup',
      argumentsJSON: '{"query":"first"}',
    });
    return new Promise(() => {});
  });
  await expect(session.generateAsync('question', options)).rejects.toMatchObject({
    code: 'ERR_TOOL_CALL_LIMIT',
  });
  expect(execute).toHaveBeenCalledTimes(1);
  session.dispose();
});

it('rejects a null tool limit before calling native generation', async () => {
  const session = await createSessionAsync();
  await expect(
    session.generateAsync('question', { maximumToolCalls: null as never })
  ).rejects.toMatchObject({ code: 'ERR_OPTIONS_INVALID' });
  expect(native.generateAsync).not.toHaveBeenCalled();
  session.dispose();
});

it('keeps stored compatibility history independent of the returned result', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  const first = new FakeSession();
  const second = new FakeSession();
  first.generateAsync.mockResolvedValue(nativeResult('{"category":"work"}'));
  second.generateAsync.mockResolvedValue(nativeResult('{"category":"other"}'));
  nativeModule.createSessionAsync
    .mockResolvedValueOnce(native)
    .mockResolvedValueOnce(first)
    .mockResolvedValueOnce(second);
  const session = await createSessionAsync();
  const result = await session.generateAsync('first', { schema });
  result.value.category = 'other';
  await session.generateAsync('second', { schema });
  const prompt = second.generateAsync.mock.calls[0]![1];
  const task = JSON.parse(JSON.parse(prompt).task);
  expect(task.previousTurns).toEqual([{ prompt: 'first', value: { category: 'work' } }]);
  session.dispose();
});

it('wires compatibility tools through the public API without replaying effects during output repair', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({
      constrainedOutput: 'unsupported',
      runtimeToolDeclarations: 'unsupported',
    })
  );
  const { tool, execute } = makeTool();
  const call = new FakeSession();
  const invalid = new FakeSession();
  const result = new FakeSession();
  call.generateAsync.mockResolvedValue(
    nativeResult('{"type":"tool","id":"call-1","calls":{"lookup":{"query":"release"}}}')
  );
  invalid.generateAsync.mockResolvedValue(nativeResult('broken'));
  result.generateAsync.mockResolvedValue(nativeResult('{"type":"result","value":"answer"}'));
  nativeModule.createSessionAsync
    .mockResolvedValueOnce(native)
    .mockResolvedValueOnce(call)
    .mockResolvedValueOnce(invalid)
    .mockResolvedValueOnce(result);
  const session = await createSessionAsync({ tools: [tool] });
  const beforeTool = jest.fn().mockResolvedValue(true);
  await expect(
    session.generateAsync('question', { beforeTool, maximumSteps: 3 })
  ).resolves.toMatchObject({ value: 'answer', format: 'validated' });
  expect(execute).toHaveBeenCalledTimes(1);
  expect(beforeTool).toHaveBeenCalledTimes(1);
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0]).tools).toEqual([]);
  session.dispose();
});
