import { ReadableStream as NodeReadableStream } from 'node:stream/web';

import type { ModelSchema } from '../LanguageModels.types';
import { categorizeAsync, generateAsync, prepareAsync } from '../index';
import type {
  BrowserAvailability,
  BrowserCreateOptions,
  BrowserLanguageModel,
  BrowserPromptOptions,
} from '../web/BrowserLanguageModel.types';
import { BrowserLanguageModels } from '../web/BrowserLanguageModels';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: jest.requireActual('../ExpoAI.web').default,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const flush = async () => {
  for (let index = 0; index < 50; index++) await Promise.resolve();
};
const schema: ModelSchema = { type: 'string', enum: ['work', 'personal'] };
let configureClone: ((clone: FakeBrowserModel) => void) | undefined;
const models: FakeBrowserModel[] = [];
class FakeBrowserModel implements BrowserLanguageModel {
  history: string[] = [];
  listeners = new Set<() => void>();
  constructor() {
    models.push(this);
  }
  prompt = jest.fn(async (input: string, _options: BrowserPromptOptions) => {
    this.history.push(input);
    return 'local result';
  });
  promptStreaming = jest.fn((input: string, _options: BrowserPromptOptions) => {
    this.history.push(input);
    return new NodeReadableStream<string>({
      start(controller) {
        controller.enqueue('local');
        controller.enqueue(' result');
        controller.close();
      },
    }) as ReadableStream<string>;
  });
  clone = jest.fn(async (_options: { signal: AbortSignal }): Promise<BrowserLanguageModel> => {
    const copy = new FakeBrowserModel();
    copy.history = [...this.history];
    configureClone?.(copy);
    return copy;
  });
  destroy = jest.fn();
  addEventListener(_event: 'contextoverflow', listener: () => void) {
    this.listeners.add(listener);
  }
  removeEventListener(_event: 'contextoverflow', listener: () => void) {
    this.listeners.delete(listener);
  }
}

const globals = ['window', 'LanguageModel', 'isSecureContext'] as const;
const originalGlobals = globals.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
function setGlobal(key: (typeof globals)[number], value: unknown) {
  Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
}
let provider: BrowserLanguageModels;
let api: {
  availability: jest.Mock<Promise<BrowserAvailability>, [unknown]>;
  create: jest.Mock<Promise<BrowserLanguageModel>, [BrowserCreateOptions]>;
};
let progress: ((event: ProgressEvent) => void) | undefined;
function emitProgress(loaded: number, total = 1, lengthComputable = true) {
  progress?.({ loaded, total, lengthComputable } as ProgressEvent);
}
const open = (options = {}) =>
  provider.createSessionAsync(JSON.stringify({ tools: [], ...options }));
const generate = (session: Awaited<ReturnType<typeof open>>, id = 'one', options = {}) =>
  session.generateAsync(id, id, JSON.stringify(options));
const nativeResult = (text: string) =>
  JSON.stringify({ text, usage: { inputTokens: null, outputTokens: null } });

beforeEach(() => {
  provider = new BrowserLanguageModels();
  models.length = 0;
  progress = undefined;
  configureClone = undefined;
  setGlobal('window', globalThis);
  setGlobal('isSecureContext', true);
  api = {
    availability: jest.fn<Promise<BrowserAvailability>, [unknown]>().mockResolvedValue('available'),
    create: jest.fn(async (options: BrowserCreateOptions) => {
      options.monitor?.({
        addEventListener: (_event, listener) => {
          progress = listener;
        },
      });
      // The browser emits these even when all model assets are already ready.
      emitProgress(0);
      emitProgress(1);
      return new FakeBrowserModel();
    }),
  };
  setGlobal('LanguageModel', api);
});
afterEach(() => {
  globals.forEach((key, index) => {
    const descriptor = originalGlobals[index];
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  });
  jest.useRealTimers();
});

it.each(['window', 'LanguageModel', 'isSecureContext'] as const)(
  'reports unavailable without %s',
  async (key) => {
    setGlobal(key, key === 'isSecureContext' ? false : undefined);
    expect(JSON.parse(await provider.getAvailabilityAsync([], null))).toMatchObject({
      status: 'unavailable',
    });
    await expect(open()).rejects.toMatchObject({ code: 'ERR_MODEL_UNAVAILABLE' });
    expect(api.create).not.toHaveBeenCalled();
  }
);

it.each(['downloadable', 'downloading', 'unavailable'] as const)(
  'does not create or download for %s readiness',
  async (status) => {
    api.availability.mockResolvedValue(status);
    expect(JSON.parse(await provider.prepareAsync('prep', false, [], null))).toMatchObject({
      status,
    });
    await expect(open()).rejects.toMatchObject({
      code: status === 'unavailable' ? 'ERR_MODEL_UNAVAILABLE' : 'ERR_MODEL_NOT_READY',
    });
    expect(api.create).not.toHaveBeenCalled();
  }
);

it('passes the same language configuration to availability and creation', async () => {
  const session = await open({
    instructions: 'Be helpful.',
    inputLanguages: ['en', 'ja'],
    outputLanguage: 'ja',
  });
  const expected = {
    expectedInputs: [{ type: 'text', languages: ['en', 'ja'] }],
    expectedOutputs: [{ type: 'text', languages: ['ja'] }],
  };
  expect(api.availability).toHaveBeenCalledWith(expected);
  expect(api.create).toHaveBeenCalledWith(
    expect.objectContaining({
      ...expected,
      initialPrompts: [{ role: 'system', content: 'Be helpful.' }],
    })
  );
  expect(JSON.parse(await provider.getAvailabilityAsync([], null)).capabilities).toMatchObject({
    provider: 'browser-prompt-api',
    model: null,
    constrainedOutput: 'supported',
    runtimeToolDeclarations: 'unsupported',
  });
  session.dispose();
});

it('accepts ready initialization progress but aborts a newly required download', async () => {
  const session = await open();
  expect(models[0]!.destroy).not.toHaveBeenCalled();
  session.dispose();
  api.availability.mockResolvedValueOnce('available').mockResolvedValue('downloading');
  await expect(open()).rejects.toMatchObject({ code: 'ERR_MODEL_NOT_READY' });
  expect(api.create.mock.calls[1]![0].signal?.aborted).toBe(true);
  expect(models[1]!.destroy).toHaveBeenCalled();
});

it('ignores creation progress delivered after a session has opened', async () => {
  const session = await open();
  const count = api.availability.mock.calls.length;
  api.availability.mockResolvedValue('downloading');
  emitProgress(0.5);
  await flush();
  expect(api.availability).toHaveBeenCalledTimes(count);
  await expect(generate(session)).resolves.toBe(nativeResult('local result'));
  session.dispose();
});

it('prepares explicitly, forwards fractional or unknown progress, and releases the preparation model', async () => {
  api.availability.mockResolvedValueOnce('downloadable').mockResolvedValue('available');
  const callback = jest.fn();
  const subscription = provider.addListener('onPreparationProgress', callback);
  api.create.mockImplementationOnce(async (options) => {
    options.monitor?.({
      addEventListener: (_event, listener) => {
        progress = listener;
      },
    });
    emitProgress(0);
    emitProgress(30, 100);
    emitProgress(0, 0, false);
    emitProgress(1);
    return new FakeBrowserModel();
  });
  expect(JSON.parse(await provider.prepareAsync('prep', true, [], null))).toMatchObject({
    status: 'available',
  });
  expect(callback.mock.calls.map(([value]) => value)).toEqual([
    { requestId: 'prep', progress: 0 },
    { requestId: 'prep', progress: 0.3 },
    { requestId: 'prep', progress: null },
    { requestId: 'prep', progress: 1 },
  ]);
  expect(models[0]!.destroy).toHaveBeenCalledTimes(1);
  emitProgress(0.5);
  expect(callback).toHaveBeenCalledTimes(4);
  subscription.remove();
});

it('cancels preparation without waiting for the browser and disposes a late session', async () => {
  api.availability.mockResolvedValue('downloadable');
  const pending = deferred<BrowserLanguageModel>();
  api.create.mockImplementationOnce((options) => {
    options.monitor?.({
      addEventListener: (_event, listener) => {
        progress = listener;
      },
    });
    return pending.promise;
  });
  const callback = jest.fn();
  provider.addListener('onPreparationProgress', callback);
  const task = provider.prepareAsync('prep', true, [], null);
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  provider.cancelPreparation('wrong-id');
  expect(api.create.mock.calls[0]![0].signal?.aborted).toBe(false);
  provider.cancelPreparation('prep');
  await rejected;
  emitProgress(0.5);
  expect(callback).not.toHaveBeenCalled();
  const late = new FakeBrowserModel();
  pending.resolve(late);
  await flush();
  expect(late.destroy).toHaveBeenCalledTimes(1);
});

it('explains browser permission or activation failures', async () => {
  api.availability.mockResolvedValue('downloadable');
  api.create.mockRejectedValueOnce({ name: 'NotAllowedError', message: 'Activation required' });
  await expect(provider.prepareAsync('prep', true, [], null)).rejects.toMatchObject({
    code: 'ERR_PREPARATION_FAILED',
    message: expect.stringContaining('user interaction'),
  });
});

it('uses native constraints and validates output before committing browser history', async () => {
  const session = await open();
  configureClone = (clone) => clone.prompt.mockResolvedValueOnce('"work"');
  await expect(generate(session, 'classify', { schema })).resolves.toBe(nativeResult('"work"'));
  expect(models[1]!.prompt).toHaveBeenCalledWith(
    'classify',
    expect.objectContaining({ responseConstraint: schema })
  );
  expect(models[0]!.destroy).not.toHaveBeenCalled();
  expect(session.acceptResult('classify')).toBe(true);
  expect(models[0]!.destroy).toHaveBeenCalledTimes(1);
  configureClone = (clone) => clone.prompt.mockResolvedValueOnce('"invalid-category"');
  await expect(generate(session, 'invalid', { schema })).rejects.toMatchObject({
    code: 'ERR_RESPONSE_INVALID',
  });
  expect(models[1]!.destroy).not.toHaveBeenCalled();
  expect(models[2]!.destroy).toHaveBeenCalled();
  session.dispose();
});

it('streams cumulative text and commits completed history for the next generation', async () => {
  const session = await open();
  const listener = jest.fn();
  session.addListener('onText', listener);
  await expect(generate(session, 'first', { stream: true })).resolves.toBe(
    nativeResult('local result')
  );
  expect(listener.mock.calls.map(([value]) => value)).toEqual([
    { requestId: 'first', text: 'local' },
    { requestId: 'first', text: 'local result' },
  ]);
  expect(session.acceptResult('first')).toBe(true);
  await generate(session, 'second');
  expect(models[2]!.history).toEqual(['first', 'second']);
  session.dispose();
});

it('keeps completed history pending until its exact request is accepted once', async () => {
  const session = await open();
  expect(session.acceptResult('first')).toBe(false);
  await generate(session, 'first');
  expect(models[0]!.history).toEqual([]);
  expect(models[0]!.destroy).not.toHaveBeenCalled();
  expect(models[1]!.history).toEqual(['first']);
  expect(session.acceptResult('wrong-id')).toBe(false);
  session.discardResult('wrong-id');
  expect(models[1]!.destroy).not.toHaveBeenCalled();
  await expect(generate(session, 'before-acceptance')).rejects.toMatchObject({
    code: 'ERR_SESSION_BUSY',
  });
  expect(session.acceptResult('first')).toBe(true);
  expect(session.acceptResult('first')).toBe(false);
  session.discardResult('first');
  session.cancel('first');
  expect(models[0]!.destroy).toHaveBeenCalledTimes(1);
  expect(models[1]!.destroy).not.toHaveBeenCalled();
  await generate(session, 'second');
  expect(models[2]!.history).toEqual(['first', 'second']);
  expect(session.acceptResult('first')).toBe(false);
  expect(session.acceptResult('second')).toBe(true);
  session.dispose();
  expect(models.every((model) => model.destroy.mock.calls.length === 1)).toBe(true);
});

it.each(['cancel', 'discardResult'] as const)(
  '%s after browser completion preserves only accepted history',
  async (method) => {
    const session = await open();
    await generate(session, 'accepted');
    expect(session.acceptResult('accepted')).toBe(true);
    await generate(session, 'completed-but-rejected', { stream: true });
    session[method]('completed-but-rejected');
    expect(session.acceptResult('completed-but-rejected')).toBe(false);
    expect(models[2]!.destroy).toHaveBeenCalledTimes(1);
    expect(models[1]!.destroy).not.toHaveBeenCalled();
    await generate(session, 'after');
    expect(models[3]!.history).toEqual(['accepted', 'after']);
    expect(session.acceptResult('completed-but-rejected')).toBe(false);
    session.discardResult('completed-but-rejected');
    expect(models[3]!.destroy).not.toHaveBeenCalled();
    expect(session.acceptResult('after')).toBe(true);
    session.dispose();
    expect(models.every((model) => model.destroy.mock.calls.length === 1)).toBe(true);
  }
);

it('discards an active browser request before a late completion can stage history', async () => {
  const session = await open();
  const pending = deferred<string>();
  configureClone = (clone) =>
    clone.prompt.mockImplementationOnce(async (input) => {
      clone.history.push(input);
      return pending.promise;
    });
  const task = generate(session, 'discarded');
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  expect(session.acceptResult('discarded')).toBe(false);
  session.discardResult('wrong-id');
  expect(models[1]!.destroy).not.toHaveBeenCalled();
  session.discardResult('discarded');
  await rejected;
  expect(session.acceptResult('discarded')).toBe(false);
  configureClone = undefined;
  await generate(session, 'after');
  pending.resolve('late answer');
  await flush();
  expect(session.acceptResult('discarded')).toBe(false);
  expect(models[2]!.history).toEqual(['after']);
  expect(session.acceptResult('after')).toBe(true);
  session.dispose();
  expect(models.every((model) => model.destroy.mock.calls.length === 1)).toBe(true);
});

it('does not stage invalid browser output and keeps the session reusable', async () => {
  const session = await open();
  await generate(session, 'accepted');
  expect(session.acceptResult('accepted')).toBe(true);
  configureClone = (clone) =>
    clone.prompt.mockImplementationOnce(async (input) => {
      clone.history.push(input);
      return '9007199254740992';
    });
  await expect(generate(session, 'invalid', { schema: { type: 'integer' } })).rejects.toMatchObject(
    {
      code: 'ERR_RESPONSE_INVALID',
    }
  );
  expect(session.acceptResult('invalid')).toBe(false);
  session.discardResult('invalid');
  expect(models[2]!.destroy).toHaveBeenCalledTimes(1);
  configureClone = undefined;
  await generate(session, 'after');
  expect(models[3]!.history).toEqual(['accepted', 'after']);
  expect(session.acceptResult('after')).toBe(true);
  session.dispose();
  expect(models.every((model) => model.destroy.mock.calls.length === 1)).toBe(true);
});

it('disposes both committed and pending browser models exactly once', async () => {
  const session = await open();
  await generate(session, 'pending');
  session.dispose();
  session.release();
  session.discardResult('pending');
  session.cancel('pending');
  expect(session.acceptResult('pending')).toBe(false);
  await expect(generate(session, 'after-disposal')).rejects.toMatchObject({
    code: 'ERR_SESSION_DISPOSED',
  });
  expect(models).toHaveLength(2);
  expect(models.every((model) => model.destroy.mock.calls.length === 1)).toBe(true);
});

it('cancels an ignored browser prompt without changing the committed history', async () => {
  const session = await open();
  await generate(session, 'first');
  expect(session.acceptResult('first')).toBe(true);
  const pending = deferred<string>();
  configureClone = (clone) =>
    clone.prompt.mockImplementationOnce(async (input) => {
      clone.history.push(input);
      return pending.promise;
    });
  const task = generate(session, 'canceled');
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  await expect(generate(session, 'busy')).rejects.toMatchObject({ code: 'ERR_SESSION_BUSY' });
  session.cancel('wrong-id');
  expect(models[2]!.destroy).not.toHaveBeenCalled();
  session.cancel('canceled');
  await rejected;
  configureClone = undefined;
  await generate(session, 'after');
  expect(models[3]!.history).toEqual(['first', 'after']);
  pending.resolve('late answer');
  await flush();
  expect(models[2]!.destroy).toHaveBeenCalled();
  session.dispose();
});

it('disposes a clone that arrives after cancellation', async () => {
  const session = await open();
  const pending = deferred<BrowserLanguageModel>();
  models[0]!.clone.mockReturnValueOnce(pending.promise);
  const task = generate(session);
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  session.cancel('one');
  await rejected;
  const late = new FakeBrowserModel();
  pending.resolve(late);
  await flush();
  expect(late.destroy).toHaveBeenCalledTimes(1);
  expect(late.prompt).not.toHaveBeenCalled();
  session.dispose();
});

it('rejects context overflow before the browser can silently trim committed history', async () => {
  const session = await open();
  await generate(session, 'first');
  expect(session.acceptResult('first')).toBe(true);
  configureClone = (clone) =>
    clone.prompt.mockImplementationOnce(async () => {
      clone.listeners.forEach((listener) => listener());
      return 'answer after overflow';
    });
  await expect(generate(session, 'overflow')).rejects.toMatchObject({
    code: 'ERR_CONTEXT_WINDOW_EXCEEDED',
  });
  configureClone = undefined;
  await generate(session, 'after');
  expect(models[3]!.history).toEqual(['first', 'after']);
  session.dispose();
});

it.each([
  ['AbortError', 'ERR_ABORTED'],
  ['QuotaExceededError', 'ERR_CONTEXT_WINDOW_EXCEEDED'],
  ['NotSupportedError', 'ERR_UNSUPPORTED_FEATURE'],
  ['NotReadableError', 'ERR_MODEL_REFUSAL'],
  ['SyntaxError', 'ERR_RESPONSE_INVALID'],
  ['UnknownError', 'ERR_GENERATION_FAILED'],
])('maps browser %s to %s without a fallback model request', async (name, code) => {
  const session = await open();
  configureClone = (clone) =>
    clone.prompt.mockRejectedValueOnce({ name, message: 'browser failure' });
  await expect(generate(session, 'task', { schema })).rejects.toMatchObject({ code });
  expect(models).toHaveLength(2);
  session.dispose();
});

it('rejects explicit output token limits and native tools before inference', async () => {
  await expect(open({ tools: [{}] })).rejects.toMatchObject({ code: 'ERR_UNSUPPORTED_FEATURE' });
  expect(api.create).not.toHaveBeenCalled();
  const session = await open();
  await expect(generate(session, 'task', { maximumOutputTokens: 10 })).rejects.toMatchObject({
    code: 'ERR_UNSUPPORTED_FEATURE',
  });
  expect(models[0]!.clone).not.toHaveBeenCalled();
  expect(session.resolveTool()).toBe(false);
  session.dispose();
});

it('has no default deadline and rejects retained calls after disposal', async () => {
  jest.useFakeTimers();
  const session = await open();
  configureClone = (clone) => clone.prompt.mockReturnValueOnce(new Promise(() => {}));
  const task = generate(session);
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_SESSION_DISPOSED' });
  await flush();
  expect(jest.getTimerCount()).toBe(0);
  session.dispose();
  session.release();
  await rejected;
  await expect(generate(session)).rejects.toMatchObject({ code: 'ERR_SESSION_DISPOSED' });
  expect(models[0]!.destroy).toHaveBeenCalledTimes(1);
  expect(models[1]!.destroy).toHaveBeenCalledTimes(1);
  expect(session.acceptResult('one')).toBe(false);
});

it('cancels a streaming reader and keeps only previously completed history', async () => {
  const session = await open();
  await generate(session, 'first');
  expect(session.acceptResult('first')).toBe(true);
  const cancel = jest.fn();
  configureClone = (clone) =>
    clone.promptStreaming.mockReturnValueOnce(
      new NodeReadableStream<string>({
        start(controller) {
          controller.enqueue('partial');
        },
        cancel,
      }) as ReadableStream<string>
    );
  const listener = jest.fn(() => session.cancel('stream'));
  const subscription = session.addListener('onText', listener);
  await expect(generate(session, 'stream', { stream: true })).rejects.toMatchObject({
    code: 'ERR_ABORTED',
  });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledTimes(1);
  subscription.remove();
  configureClone = undefined;
  await generate(session, 'after');
  expect(models[3]!.history).toEqual(['first', 'after']);
  session.dispose();
});

it('categorizes through the public API with native constraints selected automatically', async () => {
  configureClone = (clone) => clone.prompt.mockResolvedValueOnce('"work"');
  await expect(
    categorizeAsync('Schedule a work meeting', { categories: ['work', 'personal'] })
  ).resolves.toMatchObject({
    value: 'work',
    format: 'constrained',
    provider: 'browser-prompt-api',
  });
  expect(models[1]!.prompt.mock.calls[0]![1].responseConstraint).toBeDefined();
  expect(models.every((model) => model.destroy.mock.calls.length > 0)).toBe(true);
});

it('uses browser constraints for tool protocol turns while preserving approval and ordinary tool data', async () => {
  const execute = jest.fn().mockResolvedValue({ reference: 'local-receipt' });
  const beforeTool = jest.fn().mockResolvedValue(true);
  let calls = 0;
  configureClone = (clone) =>
    clone.prompt.mockImplementationOnce(async () =>
      JSON.stringify(
        ++calls === 1
          ? { type: 'tool', id: 'receipt-1', calls: { receipt: { label: 'sample' } } }
          : { type: 'result', value: 'done' }
      )
    );
  await expect(
    generateAsync('Get a receipt', {
      tools: [
        {
          name: 'receipt',
          description: 'Get a receipt.',
          inputSchema: {
            type: 'object',
            properties: { label: { type: 'string' } },
            required: ['label'],
            additionalProperties: false,
          },
          execute,
        },
      ],
      beforeTool,
    })
  ).resolves.toMatchObject({
    value: 'done',
    format: 'constrained',
    provider: 'browser-prompt-api',
  });
  expect(execute).toHaveBeenCalledTimes(1);
  expect(execute).toHaveBeenCalledWith(
    { label: 'sample' },
    expect.objectContaining({ callId: 'receipt-1' })
  );
  expect(beforeTool).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'receipt', callId: 'receipt-1' })
  );
  const completions = models.flatMap((model) => model.prompt.mock.calls);
  expect(completions).toHaveLength(2);
  expect(completions.every(([, options]) => options.responseConstraint !== undefined)).toBe(true);
  expect(completions[1]![0]).toContain('local-receipt');
});

it('routes public preparation cancellation and ignores late download progress', async () => {
  api.availability.mockResolvedValue('downloadable');
  const pending = deferred<BrowserLanguageModel>();
  api.create.mockImplementationOnce((options) => {
    options.monitor?.({
      addEventListener: (_event, listener) => {
        progress = listener;
      },
    });
    return pending.promise;
  });
  const controller = new AbortController();
  const onProgress = jest.fn();
  const task = prepareAsync({ allowDownload: true, signal: controller.signal, onProgress });
  const rejected = expect(task).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  emitProgress(0.4);
  await flush();
  controller.abort();
  await rejected;
  emitProgress(0.8);
  expect(onProgress).toHaveBeenCalledTimes(1);
  expect(api.create.mock.calls[0]![0].signal?.aborted).toBe(true);
  const late = new FakeBrowserModel();
  pending.resolve(late);
  await flush();
  expect(late.destroy).toHaveBeenCalledTimes(1);
});
