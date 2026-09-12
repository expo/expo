import NativeModule from '../ExpoAI';
import { Tools } from '../apple';
import { createSessionAsync, generateAsync, getAvailabilityAsync, schema } from '../index';
import { availableModel, FakeSession } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: { getAvailabilityAsync: jest.fn(), createSessionAsync: jest.fn() },
}));

const nativeModule = jest.mocked(NativeModule!);
let native: FakeSession;
const image = { uri: 'file:///app/receipt.png', label: 'receipt' };
const flush = async () => {
  for (let index = 0; index < 40; index++) await Promise.resolve();
};

beforeEach(() => {
  native = new FakeSession();
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(native);
  nativeModule.getAvailabilityAsync
    .mockReset()
    .mockResolvedValue(availableModel({ imageTools: 'supported' }));
});

it('reports image tools independently of model vision and checks both requirements', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    JSON.stringify({
      status: 'available',
      images: false,
      imageTools: true,
      contextTokens: 4096,
    })
  );
  await expect(getAvailabilityAsync({ requires: ['imageTools'] })).resolves.toMatchObject({
    status: 'available',
    capabilities: { images: 'unsupported', imageTools: 'supported' },
  });
  await expect(getAvailabilityAsync({ requires: ['images'] })).resolves.toEqual({
    status: 'unavailable',
    reason: 'unsupported-feature',
  });
});

it('uses ordinary predefined objects and marks their native declarations without exposing handlers', async () => {
  await generateAsync('Read the receipt.', { tools: [Tools.ocr, Tools.barcode], images: [image] });
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0]).tools).toEqual([
    {
      name: 'expo_ocr',
      description: Tools.ocr.description,
      inputSchema: Tools.ocr.inputSchema,
      builtin: 'ocr',
    },
    {
      name: 'expo_barcode',
      description: Tools.barcode.description,
      inputSchema: Tools.barcode.inputSchema,
      builtin: 'barcode',
    },
  ]);
  expect(JSON.parse(native.generateAsync.mock.calls[0]![2]).images).toEqual([image]);
});

it('allows true image input without tools only when the selected model supports it', async () => {
  await expect(generateAsync('Describe this.', { images: [image] })).rejects.toMatchObject({
    code: 'ERR_UNSUPPORTED_FEATURE',
  });
  expect(native.generateAsync).not.toHaveBeenCalled();
  nativeModule.getAvailabilityAsync.mockResolvedValue(availableModel({ images: 'supported' }));
  await expect(generateAsync('Describe this.', { images: [image] })).resolves.toMatchObject({
    value: 'ready',
  });
});

it('rejects Apple image tools on another provider before creating a native session', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ provider: 'browser-prompt-api', imageTools: 'unsupported' })
  );
  await expect(
    generateAsync('Read this.', { tools: [Tools.ocr], images: [image] })
  ).rejects.toMatchObject({ code: 'ERR_UNSUPPORTED_FEATURE' });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

it('snapshots image labels and URIs before waiting for model readiness', async () => {
  let ready!: (value: string) => void;
  nativeModule.getAvailabilityAsync.mockImplementation(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      })
  );
  const images = [{ uri: image.uri }];
  const request = generateAsync('Read this.', { tools: [Tools.ocr], images });
  images[0]!.uri = 'file:///app/other.png';
  images.push({ uri: 'file:///app/third.png' });
  ready(availableModel({ imageTools: 'supported' }));
  await request;
  expect(JSON.parse(native.generateAsync.mock.calls[0]![2]).images).toEqual([
    { uri: image.uri, label: 'image-1' },
  ]);
});

it.each(
  [
    [{ uri: 'https://example.com/image.png' }],
    [{ uri: 'data:image/png;base64,abc' }],
    [{ uri: 'file://server/share/image.png' }],
    [{ uri: 'file:///app/image.png#secret' }],
    [{ uri: 'file:///app/%00.png' }],
    [{ uri: 'file:///app/%0aimage.png' }],
    [{ uri: 'file:///app/image\n.png' }],
    [{ uri: image.uri, label: '' }],
    [{ uri: image.uri, label: null }],
    [{ uri: image.uri, label: 'a\nb' }],
    [image, image],
    Array.from({ length: 9 }, (_, index) => ({ uri: image.uri, label: `image-${index}` })),
  ].map((images) => [images])
)('rejects invalid image references before checking readiness: %j', async (images) => {
  await expect(generateAsync('Read this.', { images: images as never })).rejects.toMatchObject({
    code: 'ERR_OPTIONS_INVALID',
  });
  expect(nativeModule.getAvailabilityAsync).not.toHaveBeenCalled();
});

it('does not evaluate accessors while snapshotting image references', async () => {
  const read = jest.fn(() => image.uri);
  await expect(
    generateAsync('Read this.', {
      images: [
        {
          get uri() {
            return read();
          },
        },
      ],
    })
  ).rejects.toMatchObject({ code: 'ERR_OPTIONS_INVALID' });
  expect(read).not.toHaveBeenCalled();
});

it('waits for approval before executing Vision and serializes ordinary native data', async () => {
  const executeBuiltinToolAsync = jest.fn().mockResolvedValue('{"text":"Total 42"}');
  Object.assign(native, { executeBuiltinToolAsync });
  let respond!: (value: string) => void;
  native.generateAsync.mockImplementation((requestId) => {
    native.emit('onToolCall', {
      requestId,
      callId: 'read-1',
      name: 'expo_ocr',
      argumentsJSON: '{"image":"receipt"}',
    });
    return new Promise((resolve) => {
      respond = resolve;
    });
  });
  let decide!: (allowed: boolean) => void;
  const request = generateAsync('Read this.', {
    tools: [Tools.ocr],
    images: [image],
    beforeTool: () =>
      new Promise((resolve) => {
        decide = resolve;
      }),
  });
  await flush();
  expect(executeBuiltinToolAsync).not.toHaveBeenCalled();
  decide(true);
  await flush();
  expect(executeBuiltinToolAsync).toHaveBeenCalledWith('read-1', 'ocr', 'receipt');
  expect(native.resolveTool).toHaveBeenCalledWith('read-1', '{"text":"Total 42"}', null);
  respond('42');
  await expect(request).resolves.toMatchObject({ value: '42' });
});

it('denial and cancellation during approval never start an image tool', async () => {
  const executeBuiltinToolAsync = jest.fn();
  Object.assign(native, { executeBuiltinToolAsync });
  native.generateAsync.mockImplementation((requestId) => {
    native.emit('onToolCall', {
      requestId,
      callId: 'denied',
      name: 'expo_ocr',
      argumentsJSON: '{"image":"receipt"}',
    });
    return new Promise(() => {});
  });
  await expect(
    generateAsync('Read this.', { tools: [Tools.ocr], images: [image], beforeTool: () => false })
  ).rejects.toMatchObject({ code: 'ERR_TOOL_DENIED' });
  expect(executeBuiltinToolAsync).not.toHaveBeenCalled();
  const controller = new AbortController();
  let decide!: (allowed: boolean) => void;
  const request = generateAsync('Read this.', {
    tools: [Tools.ocr],
    images: [image],
    signal: controller.signal,
    beforeTool: () =>
      new Promise((resolve) => {
        decide = resolve;
      }),
  });
  const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_ABORTED' });
  await flush();
  controller.abort();
  await rejected;
  decide(true);
  await flush();
  expect(executeBuiltinToolAsync).not.toHaveBeenCalled();
});

it('does not permit calling predefined handlers outside their active request', async () => {
  await expect(
    Tools.ocr.execute(
      { image: 'receipt' },
      { callId: 'arbitrary', signal: new AbortController().signal }
    )
  ).rejects.toMatchObject({ code: 'ERR_UNSUPPORTED_FEATURE' });
});

it('preserves a native provider timeout without retrying generation', async () => {
  native.generateAsync.mockRejectedValue(
    Object.assign(new Error('Provider timed out.'), { code: 'ERR_TIMEOUT' })
  );
  await expect(generateAsync('Read this.')).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
  expect(native.generateAsync).toHaveBeenCalledTimes(1);
});

it('returns real metadata for text, structured, and streamed completions', async () => {
  const usage = {
    inputTokens: 80,
    outputTokens: 10,
    cachedInputTokens: 40,
    reasoningTokens: 0,
    contextTokens: 90,
  };
  const generateWithMetadataAsync = jest
    .fn()
    .mockResolvedValue(JSON.stringify({ text: 'ready', usage }));
  Object.assign(native, { generateWithMetadataAsync });
  await expect(generateAsync('Read this.')).resolves.toMatchObject({ value: 'ready', usage });
  generateWithMetadataAsync.mockResolvedValue(JSON.stringify({ text: '{"total":42}', usage }));
  await expect(
    generateAsync('Read this.', { schema: schema.object({ total: schema.number() }) })
  ).resolves.toMatchObject({ value: { total: 42 }, usage });
  const session = await createSessionAsync();
  const events = [];
  for await (const event of session.generateStream('Read this.')) events.push(event);
  expect(events.at(-1)).toMatchObject({ type: 'result', result: { usage } });
  session.dispose();
  expect(native.generateAsync).not.toHaveBeenCalled();
});

it('keeps iOS 26 context counting separate from unknown request usage', async () => {
  Object.assign(native, {
    generateWithMetadataAsync: jest.fn().mockResolvedValue(
      JSON.stringify({
        text: 'ready',
        usage: { inputTokens: null, outputTokens: null, contextTokens: 100 },
      })
    ),
  });
  await expect(generateAsync('Read this.')).resolves.toMatchObject({
    usage: { inputTokens: null, outputTokens: null, contextTokens: 100 },
  });
});

it('aggregates measured calls across output repair without summing independent context sizes', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  Object.assign(native, {
    generateWithMetadataAsync: jest
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          text: '{"total":"wrong"}',
          usage: { inputTokens: 10, outputTokens: 4, contextTokens: 14 },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          text: '{"total":42}',
          usage: { inputTokens: 20, outputTokens: 5, contextTokens: 25 },
        })
      ),
  });
  await expect(
    generateAsync('Read this.', { schema: schema.object({ total: schema.number() }) })
  ).resolves.toMatchObject({
    value: { total: 42 },
    usage: { inputTokens: 30, outputTokens: 9, contextTokens: 25 },
  });
});

it.each([
  { text: 'ready', usage: { inputTokens: -1, outputTokens: 0 } },
  { text: 'ready', usage: { inputTokens: 1.5, outputTokens: 0 } },
  { text: 'ready', usage: { inputTokens: null } },
  { text: 'ready', usage: { inputTokens: null, outputTokens: null, contextTokens: '100' } },
  { text: 42, usage: { inputTokens: null, outputTokens: null } },
])('rejects malformed native metadata: %j', async (response) => {
  Object.assign(native, {
    generateWithMetadataAsync: jest.fn().mockResolvedValue(JSON.stringify(response)),
  });
  await expect(generateAsync('Read this.')).rejects.toMatchObject({
    code: 'ERR_PROVIDER_RESPONSE_INVALID',
  });
});
