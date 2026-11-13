import type { ToolDefinition } from '../LanguageModels.types';
import { schema } from '../schemaHelpers';
import { getTools, serializeToolResult, toolDeclarations } from '../tools';

const inputSchema = schema.object({ query: schema.string() });
const context = { callId: 'call-one', signal: new AbortController().signal };

it('snapshots plain definitions per task and serializes ordinary synchronous and asynchronous values', async () => {
  const execute = jest.fn(() => ({
    notes: ['one'],
    count: 1,
    ready: true,
    next: null,
  }));
  const definition = {
    name: '_lookup1',
    description: 'Find notes.',
    inputSchema,
    execute,
  };
  const [tool] = getTools([definition]);
  definition.name = 'changed';
  definition.description = 'Changed';
  definition.execute = jest.fn();
  expect(toolDeclarations([tool!])).toEqual([
    { name: '_lookup1', description: 'Find notes.', inputSchema },
  ]);
  await expect(tool!.execute({ query: 'original' }, context)).resolves.toBe(
    '{"notes":["one"],"count":1,"ready":true,"next":null}'
  );
  expect(execute).toHaveBeenCalledWith({ query: 'original' }, context);
  const [asynchronous] = getTools([
    {
      name: 'async',
      description: 'Async lookup.',
      inputSchema,
      execute: async () => 'plain text',
    },
  ]);
  await expect(asynchronous!.execute({}, context)).resolves.toBe('plain text');
});

it('takes an independent input schema snapshot for each session', () => {
  const mutable = {
    type: 'object' as const,
    properties: { query: { type: 'string' as const } },
    required: ['query'],
    additionalProperties: false as const,
  };
  const definition = {
    name: 'lookup',
    description: 'Find notes.',
    inputSchema: mutable,
    execute: () => null,
  };
  const [first] = getTools([definition]);
  mutable.required.length = 0;
  const [second] = getTools([definition]);
  expect(first!.inputSchema).toMatchObject({ required: ['query'] });
  expect(second!.inputSchema).toMatchObject({ required: [] });
});

it.each(['', 'with-dash', '1first', 'white space', 'ø', 'a'.repeat(65)])(
  'rejects names unsupported by the native provider: %s',
  (name) => {
    expect(() =>
      getTools([{ name, description: 'Find notes.', inputSchema, execute: () => null }])
    ).toThrow(expect.objectContaining({ code: 'ERR_OPTIONS_INVALID' }));
  }
);

it('rejects duplicate names, empty descriptions, nonobject inputs, and accessors without executing them', () => {
  const tool: ToolDefinition<typeof inputSchema> = {
    name: 'lookup',
    description: 'Find notes.',
    inputSchema,
    execute: () => null,
  };
  expect(() => getTools([tool, tool])).toThrow();
  expect(() => getTools([{ ...tool, description: '' }])).toThrow();
  expect(() => getTools([{ ...tool, inputSchema: schema.string() } as never])).toThrow();
  const get = jest.fn(() => 'lookup');
  expect(() =>
    getTools([Object.defineProperty({ ...tool }, 'name', { get, enumerable: true })])
  ).toThrow();
  expect(get).not.toHaveBeenCalled();
});

it('preserves strings while serializing all ordinary JSON data including null-prototype objects', () => {
  expect(serializeToolResult('"quoted"\ntext')).toBe('"quoted"\ntext');
  expect(serializeToolResult(1.5)).toBe('1.5');
  expect(serializeToolResult(false)).toBe('false');
  expect(serializeToolResult(null)).toBe('null');
  const data = Object.assign(Object.create(null), {
    text: 'line\nbreak',
    items: [1, 'two', null],
  });
  expect(JSON.parse(serializeToolResult(data))).toEqual({
    text: 'line\nbreak',
    items: [1, 'two', null],
  });
  const names = JSON.parse('{"__proto__":"safe","constructor":true,"toJSON":"ordinary data"}');
  expect(JSON.parse(serializeToolResult(names))).toEqual(names);
});

it.each([
  undefined,
  Infinity,
  NaN,
  -Infinity,
  BigInt(1),
  Symbol('value'),
  () => 'value',
  new Date(),
  new Map(),
  new Set(),
  /expression/,
])('rejects values JSON would lose or transform: %p', (value) => {
  expect(() => serializeToolResult(value)).toThrow(
    expect.objectContaining({ code: 'ERR_TOOL_FAILED' })
  );
  expect(() => serializeToolResult({ nested: value })).toThrow();
  expect(() => serializeToolResult([value])).toThrow();
});

it('rejects cycles, sparse arrays, added properties, and hidden values', () => {
  const cycle: unknown[] = [];
  cycle.push(cycle);
  expect(() => serializeToolResult(cycle)).toThrow();
  expect(() => serializeToolResult(new Array(1))).toThrow();
  expect(() => serializeToolResult(Object.assign([], { ignored: true }))).toThrow();
  expect(() => serializeToolResult({ [Symbol('ignored')]: true })).toThrow();
  expect(() =>
    serializeToolResult(Object.defineProperty({}, 'ignored', { value: true }))
  ).toThrow();
  const shared = { okay: true };
  expect(serializeToolResult([shared, shared])).toBe('[{"okay":true},{"okay":true}]');
});

it('never invokes getters or toJSON and surfaces unsupported handler output as a tool failure', async () => {
  const get = jest.fn(() => 'changed');
  const toJSON = jest.fn(() => 'changed');
  expect(() =>
    serializeToolResult(Object.defineProperty({}, 'value', { get, enumerable: true }))
  ).toThrow();
  expect(() =>
    serializeToolResult(Object.defineProperty([0], '0', { get, enumerable: true }))
  ).toThrow();
  expect(() => serializeToolResult({ toJSON })).toThrow();
  expect(get).not.toHaveBeenCalled();
  expect(toJSON).not.toHaveBeenCalled();
  const [tool] = getTools([
    {
      name: 'lookup',
      description: 'Find notes.',
      inputSchema,
      execute: async () => undefined,
    },
  ]);
  await expect(tool!.execute({}, context)).rejects.toMatchObject({
    code: 'ERR_TOOL_FAILED',
  });
});

it('rejects sparse or accessor tool lists before reading an element', () => {
  const get = jest.fn();
  expect(() => getTools(new Array(1))).toThrow(
    expect.objectContaining({ code: 'ERR_OPTIONS_INVALID' })
  );
  expect(() => getTools(Object.assign([], { extra: true }))).toThrow();
  expect(() => getTools(Object.defineProperty([null], '0', { get, enumerable: true }))).toThrow();
  expect(get).not.toHaveBeenCalled();
});
