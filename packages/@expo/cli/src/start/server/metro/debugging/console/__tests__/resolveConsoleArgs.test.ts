import chalk from 'chalk';

import type { ConsoleSession } from '../ConsoleSession';
import { resolveConsoleArgsAsync } from '../resolveConsoleArgs';
import type { RemoteObject } from '../types';

interface CallFunctionOnParams {
  functionDeclaration: string;
  objectId: string;
}

function createSession(objects: Record<string, unknown> = {}) {
  const send = jest.fn(async (method: string, params: CallFunctionOnParams) => {
    if (method === 'Runtime.callFunctionOn') {
      // oxlint-disable-next-line no-new-func
      const serialize = new Function(`return (${params.functionDeclaration})`)();
      return { result: { value: serialize.call(objects[params.objectId]) } };
    }
    return {};
  });
  return { send } as unknown as ConsoleSession & { send: typeof send };
}

const object = (objectId: string): RemoteObject => ({ type: 'object', objectId });

test('prints primitives as Node does', async () => {
  const args: RemoteObject[] = [
    { type: 'string', value: 'count' },
    { type: 'number', value: 42 },
    { type: 'object', subtype: 'null', value: null },
    { type: 'undefined' },
    { type: 'bigint', unserializableValue: '10n' },
  ];

  expect(await resolveConsoleArgsAsync(createSession(), args)).toEqual([
    'count',
    '42',
    'null',
    'undefined',
    '10n',
  ]);
});

test('serializes an object in the app and releases it', async () => {
  const circular: Record<string, unknown> = { name: 'circular' };
  circular.self = circular;
  const session = createSession({
    '1': {
      map: new Map([['key', { nested: [1, 2] }]]),
      set: new Set(['a']),
      date: new Date(0),
      fn: function named() {},
      circular,
    },
  });

  expect(await resolveConsoleArgsAsync(session, [object('1')])).toEqual([
    [
      '{',
      "  map: Map(1) { 'key' => { nested: [ 1, 2 ] } },",
      "  set: Set(1) { 'a' },",
      '  date: 1970-01-01T00:00:00.000Z,',
      '  fn: [Function named],',
      "  circular: { name: 'circular', self: [Circular] }",
      '}',
    ].join('\n'),
  ]);
  expect(session.send).toHaveBeenCalledWith('Runtime.releaseObject', { objectId: '1' });
});

test('falls back to the preview when the app does not answer', async () => {
  const session = createSession();
  session.send.mockRejectedValue(new Error('closed'));

  const arg: RemoteObject = {
    ...object('1'),
    preview: {
      type: 'object',
      overflow: true,
      properties: [
        { name: 'a', type: 'number', value: '1' },
        { name: 'b', type: 'string', value: 'two' },
      ],
    },
  };

  expect(await resolveConsoleArgsAsync(session, [arg])).toEqual(["{ a: 1, b: 'two', … }"]);
});

test('prints an error as its headline, followed by its stack', async () => {
  const stack =
    'Error: boom\n    at render (http://localhost:8081/index.bundle//&platform=ios:1:2)';
  const error: RemoteObject = {
    type: 'object',
    subtype: 'error',
    objectId: '1',
    description: stack,
  };

  expect(
    await resolveConsoleArgsAsync(createSession(), [{ type: 'string', value: 'Failed' }, error])
  ).toEqual(['Failed', '[Error: boom]', stack]);
});

test('applies format specifiers of the first argument', async () => {
  const args: RemoteObject[] = [
    { type: 'string', value: '%s is %d years' },
    { type: 'string', value: 'Bob' },
    { type: 'number', value: 42 },
  ];

  expect(await resolveConsoleArgsAsync(createSession(), args)).toEqual(['Bob is 42 years']);
});

test('applies a numeric format specifier when colors are enabled', async () => {
  const args: RemoteObject[] = [
    { type: 'string', value: '%d years' },
    { type: 'number', value: 42 },
  ];
  const level = chalk.level;
  chalk.level = 1;

  try {
    expect(await resolveConsoleArgsAsync(createSession(), args)).toEqual(['42 years']);
  } finally {
    chalk.level = level;
  }
});
