import NativeModule from '../ExpoAI';
import {
  categorizeAsync,
  createSessionAsync,
  generateAsync,
  schema,
  type ModelSchema,
} from '../index';
import { availableModel, FakeSession } from './fixtures/FakeSession';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: { getAvailabilityAsync: jest.fn(), createSessionAsync: jest.fn() },
}));

const nativeModule = jest.mocked(NativeModule!);
let owner: FakeSession;
const inputSchema = schema.object({ query: schema.string() });
const tool = (execute = jest.fn().mockResolvedValue({ answer: 'local' })) => ({
  name: 'lookup',
  description: 'Look up local data.',
  inputSchema,
  execute,
});
const calls = (...responses: string[]) => {
  const sessions = responses.map((response) => {
    const session = new FakeSession();
    session.generateAsync.mockResolvedValue(response);
    return session;
  });
  nativeModule.createSessionAsync.mockReset().mockResolvedValueOnce(owner);
  sessions.forEach((session) => nativeModule.createSessionAsync.mockResolvedValueOnce(session));
  return sessions;
};

beforeEach(() => {
  owner = new FakeSession();
  nativeModule.getAvailabilityAsync.mockReset().mockResolvedValue(availableModel());
  nativeModule.createSessionAsync.mockReset().mockResolvedValue(owner);
});

it('prefers native constraints without letting repair or step budgets weaken categorization', async () => {
  owner.generateAsync.mockResolvedValue('"work"');
  await expect(
    categorizeAsync('note', {
      categories: ['work', 'personal'],
      maximumRetries: 3,
      maximumSteps: 1,
    })
  ).resolves.toMatchObject({ value: 'work', format: 'constrained' });
  expect(nativeModule.createSessionAsync).toHaveBeenCalledTimes(1);
  expect(owner.generateAsync).toHaveBeenCalledTimes(1);
  expect(JSON.parse(owner.generateAsync.mock.calls[0]![2]).schema).toEqual(
    schema.enum(['work', 'personal'])
  );
});

it('uses validated repair for browser schemas with numeric bounds', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ provider: 'browser-prompt-api', runtimeToolDeclarations: 'unsupported' })
  );
  const [completion] = calls('3');
  await expect(
    generateAsync('pick a small number', {
      schema: schema.number({ minimum: 1, maximum: 5 }),
      maximumRetries: 0,
    })
  ).resolves.toMatchObject({ value: 3, format: 'validated' });
  expect(owner.generateAsync).not.toHaveBeenCalled();
  expect(JSON.parse(completion!.generateAsync.mock.calls[0]![2]).schema).toBeUndefined();
});

it('keeps native tools and constraints together when both are available', async () => {
  const definition = tool();
  owner.generateAsync.mockImplementation(
    (requestId) =>
      new Promise((resolve) => {
        owner.resolveTool.mockImplementation(() => {
          resolve('"work"');
          return true;
        });
        owner.emit('onToolCall', {
          requestId,
          callId: 'one',
          name: 'lookup',
          argumentsJSON: '{"query":"note"}',
        });
      })
  );
  await expect(
    categorizeAsync('note', {
      categories: ['work', 'personal'],
      tools: [definition],
      maximumRetries: 0,
    })
  ).resolves.toMatchObject({ value: 'work', format: 'constrained' });
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0]).tools).toHaveLength(1);
  expect(JSON.parse(owner.generateAsync.mock.calls[0]![2]).schema).toBeDefined();
  expect(definition.execute).toHaveBeenCalledTimes(1);
  expect(nativeModule.createSessionAsync).toHaveBeenCalledTimes(1);
});

it('rejects an unenforceable explicit native tool step limit without downgrading or executing', async () => {
  const definition = tool();
  await expect(
    generateAsync('task', { tools: [definition], maximumSteps: 1 })
  ).rejects.toMatchObject({ code: 'ERR_UNSUPPORTED_FEATURE' });
  expect(owner.generateAsync).not.toHaveBeenCalled();
  expect(definition.execute).not.toHaveBeenCalled();
});

it.each(['ERR_MODEL_REFUSAL', 'ERR_APP_BACKGROUND', 'ERR_MODEL_NOT_READY', 'ERR_RESPONSE_INVALID'])(
  'preserves native %s without a weaker retry',
  async (code) => {
    owner.generateAsync.mockRejectedValue(Object.assign(new Error('Native failure.'), { code }));
    await expect(
      generateAsync('task', { schema: schema.string(), maximumRetries: 3 })
    ).rejects.toMatchObject({ code });
    expect(owner.generateAsync).toHaveBeenCalledTimes(1);
    expect(nativeModule.createSessionAsync).toHaveBeenCalledTimes(1);
  }
);

it('keeps native response constraints throughout compatibility tool orchestration', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ runtimeToolDeclarations: 'unsupported' })
  );
  const completions = calls(
    '{"type":"tool","id":"one","calls":{"lookup":{"query":"note"}}}',
    '{"type":"result","value":"work","calls":{"lookup":{"query":"extra"}}}',
    '{"type":"result","value":"work"}'
  );
  const definition = tool();
  await expect(
    categorizeAsync('note', {
      categories: ['work', 'personal'],
      tools: [definition],
      maximumSteps: 3,
    })
  ).resolves.toMatchObject({ value: 'work', format: 'constrained' });
  expect(definition.execute).toHaveBeenCalledTimes(1);
  for (const completion of completions) {
    const outputSchema = JSON.parse(completion.generateAsync.mock.calls[0]![2]).schema;
    expect(outputSchema.properties.calls.properties.lookup).toEqual(inputSchema);
    expect(outputSchema.properties.value).toEqual(schema.enum(['work', 'personal']));
    expect(outputSchema.additionalProperties).toBe(false);
  }
  const history = JSON.parse(completions[2]!.generateAsync.mock.calls[0]![1]).history;
  expect(history).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'completed-tool',
        output: '{"answer":"local"}',
      }),
      expect.objectContaining({ type: 'invalid-output' }),
    ])
  );
  for (const [options] of nativeModule.createSessionAsync.mock.calls)
    expect(JSON.parse(options).tools).toEqual([]);
});

it.each([
  '{"type":"tool","id":"one","calls":{}}',
  '{"type":"tool","id":"one","calls":{"lookup":{"query":4}}}',
  '{"type":"tool","id":"one","calls":{"lookup":{"query":"ok"}},"value":"work"}',
  '{"type":"result","value":"invented"}',
])('validates constrained protocol exclusivity and values independently: %s', async (response) => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ runtimeToolDeclarations: 'unsupported' })
  );
  calls(response);
  const definition = tool();
  await expect(
    categorizeAsync('note', {
      categories: ['work', 'personal'],
      tools: [definition],
      maximumRetries: 0,
    })
  ).rejects.toMatchObject({ code: 'ERR_VALIDATION_RETRIES_EXHAUSTED' });
  expect(definition.execute).not.toHaveBeenCalled();
});

it('uses native tools once and repairs unsupported structured output without replaying handlers', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  const [nativeTools, repair] = calls('unused', '"work"');
  const definition = tool();
  nativeTools!.generateAsync.mockImplementation(
    (requestId) =>
      new Promise((resolve) => {
        nativeTools!.resolveTool.mockImplementation(() => {
          resolve('bad JSON');
          return true;
        });
        nativeTools!.emit('onToolCall', {
          requestId,
          callId: 'one',
          name: 'lookup',
          argumentsJSON: '{"query":"note"}',
        });
      })
  );
  await expect(
    categorizeAsync('note', {
      categories: ['work', 'personal'],
      tools: [definition],
    })
  ).resolves.toMatchObject({ value: 'work', format: 'validated' });
  expect(definition.execute).toHaveBeenCalledTimes(1);
  expect(owner.generateAsync).not.toHaveBeenCalled();
  expect(nativeTools!.generateAsync).toHaveBeenCalledTimes(1);
  expect(repair!.generateAsync).toHaveBeenCalledTimes(1);
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0]).tools).toHaveLength(1);
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[1]![0]).tools).toHaveLength(1);
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[2]![0]).tools).toEqual([]);
  const observations = JSON.parse(repair!.generateAsync.mock.calls[0]![1]).history;
  expect(observations).toEqual(
    expect.arrayContaining([
      {
        type: 'completed-tool',
        id: 'one',
        name: 'lookup',
        arguments: { query: 'note' },
        output: '{"answer":"local"}',
      },
      expect.objectContaining({ type: 'invalid-output', text: 'bad JSON' }),
    ])
  );
  expect(nativeTools!.dispose).toHaveBeenCalledTimes(1);
});

it('keeps Apple language requirements at availability instead of passing unsupported session fields', async () => {
  const session = await createSessionAsync({
    instructions: 'Be concise.',
    inputLanguages: ['en'],
    outputLanguage: 'en',
  });
  expect(nativeModule.getAvailabilityAsync).toHaveBeenCalledWith(['en'], 'en');
  expect(JSON.parse(nativeModule.createSessionAsync.mock.calls[0]![0])).toEqual({
    instructions: 'Be concise.',
    tools: [],
  });
  session.dispose();
});

it('isolates a failed native-tool structured attempt from the persistent native conversation', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  const [attempt] = calls('invalid JSON');
  const session = await createSessionAsync({ tools: [tool()] });
  await session.generateAsync('first completed turn');
  await expect(
    session.generateAsync('failed turn', { schema: schema.string(), maximumRetries: 0 })
  ).rejects.toMatchObject({ code: 'ERR_VALIDATION_RETRIES_EXHAUSTED' });
  expect(
    JSON.parse(JSON.parse(attempt!.generateAsync.mock.calls[0]![1]).task).previousTurns
  ).toEqual([{ prompt: 'first completed turn', value: 'ready' }]);
  await session.generateAsync('continue');
  expect(owner.generateAsync.mock.calls.map((call) => call[1])).toEqual([
    'first completed turn',
    'continue',
  ]);
  expect(attempt!.dispose).toHaveBeenCalledTimes(1);
  session.dispose();
});

it('passes every pending compatibility turn once when returning to native text', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ constrainedOutput: 'unsupported' })
  );
  calls('"one"', '"two"');
  const session = await createSessionAsync();
  await session.generateAsync('first', { schema: schema.string() });
  await session.generateAsync('second', { schema: schema.string() });
  await session.generateAsync('continue');
  expect(JSON.parse(owner.generateAsync.mock.calls[0]![1]).previousTurns).toEqual([
    { prompt: 'first', value: 'one' },
    { prompt: 'second', value: 'two' },
  ]);
  await session.generateAsync('next');
  expect(owner.generateAsync.mock.calls[1]![1]).toBe('next');
  session.dispose();
});

it('rejects obsolete implementation switches instead of silently ignoring them', async () => {
  await expect(
    generateAsync('task', {
      schema: schema.string(),
      mode: 'validated',
    } as never)
  ).rejects.toMatchObject({ code: 'ERR_OPTIONS_INVALID' });
  await expect(
    createSessionAsync({ tools: [tool()], toolMode: 'validated' } as never)
  ).rejects.toMatchObject({ code: 'ERR_OPTIONS_INVALID' });
  expect(nativeModule.createSessionAsync).not.toHaveBeenCalled();
});

function nestedSchema(depth: number): ModelSchema {
  let result: ModelSchema = { type: 'string' };
  for (let index = 0; index < depth; index++) result = { type: 'array', items: result };
  return result;
}
function nestedValue(depth: number): unknown {
  let result: unknown = 'leaf';
  for (let index = 0; index < depth; index++) result = [result];
  return result;
}

it('reserves internal envelope depth without reducing the public schema limit', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    availableModel({ runtimeToolDeclarations: 'unsupported' })
  );
  const output = nestedValue(32);
  const input = { payload: nestedValue(31) };
  const sessions = calls(
    JSON.stringify({ type: 'tool', id: 'one', calls: { deep: input } }),
    JSON.stringify({ type: 'result', value: output })
  );
  const execute = jest.fn().mockResolvedValue('read');
  await expect(
    generateAsync('deep task', {
      schema: nestedSchema(32),
      tools: [
        {
          name: 'deep',
          description: 'Read nested input.',
          inputSchema: schema.object({ payload: nestedSchema(31) }),
          execute,
        },
      ],
    })
  ).resolves.toMatchObject({ value: output, format: 'constrained' });
  expect(execute).toHaveBeenCalledWith(input, expect.anything());
  expect(
    JSON.parse(sessions[0]!.generateAsync.mock.calls[0]![2]).schema.properties.calls.properties.deep
  ).toEqual(schema.object({ payload: nestedSchema(31) }));
  const count = nativeModule.createSessionAsync.mock.calls.length;
  await expect(generateAsync('too deep', { schema: nestedSchema(33) })).rejects.toMatchObject({
    code: 'ERR_SCHEMA_UNSUPPORTED',
  });
  await expect(
    createSessionAsync({
      tools: [
        {
          name: 'deep',
          description: 'Read nested input.',
          inputSchema: {
            type: 'object',
            properties: { payload: nestedSchema(32) },
            additionalProperties: false,
          },
          execute,
        },
      ],
    })
  ).rejects.toMatchObject({ code: 'ERR_SCHEMA_UNSUPPORTED' });
  expect(nativeModule.createSessionAsync).toHaveBeenCalledTimes(count);
});
