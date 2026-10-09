import { list, tap, type ListedSession } from '2g/api';
import chalk from 'chalk';

import { expoCommandEvents } from '../events';
import { expoCommand } from '../index';
import { expoCommandPs } from '../ps';
import { handleOutputError } from '../utils';

jest.mock('2g/api', () => ({ list: jest.fn(), tap: jest.fn() }));

jest.mock('../ps/index.js', () => jest.requireActual('../ps'), { virtual: true });
jest.mock('../events/index.js', () => jest.requireActual('../events'), { virtual: true });
jest.mock('../ps/resolveOptions.js', () => jest.requireActual('../ps/resolveOptions'), {
  virtual: true,
});
jest.mock('../ps/psAsync.js', () => jest.requireActual('../ps/psAsync'), { virtual: true });
jest.mock('../events/resolveOptions.js', () => jest.requireActual('../events/resolveOptions'), {
  virtual: true,
});
jest.mock('../events/eventsAsync.js', () => jest.requireActual('../events/eventsAsync'), {
  virtual: true,
});

function session(id: string, command: string, alive = true): ListedSession {
  return {
    id,
    pid: Number(id),
    command,
    alive,
    startedAt: 1000,
    cwd: '/app',
    sessionDir: `/sessions/${id}`,
    metadata: { port: 8081, ready: true },
  };
}

let stdout: jest.SpyInstance;
let stderr: jest.SpyInstance;
const originalExitCode = process.exitCode;
const originalColorLevel = chalk.level;

beforeEach(() => {
  chalk.level = 0;
  stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  jest.mocked(list).mockResolvedValue([]);
  jest.mocked(tap).mockImplementation(async function* () {});
  process.exitCode = 0;
});

afterEach(() => {
  while (process.stdout.listeners('error').includes(handleOutputError)) {
    process.stdout.removeListener('error', handleOutputError);
  }
  stdout.mockRestore();
  stderr.mockRestore();
  process.exitCode = originalExitCode;
  chalk.level = originalColorLevel;
});

function output() {
  return stdout.mock.calls.map(([chunk]) => chunk).join('');
}

it.each([
  ['command:ps', expoCommandPs],
  ['command:events', expoCommandEvents],
] as const)('%s documents itself without discovering sessions', async (name, command) => {
  await command(['--help']);
  expect(output()).toContain(`  Info\n`);
  expect(output()).toContain(`  Usage\n    $ npx expo ${name} [selector]`);
  expect(output()).toContain('  Options\n');
  expect(output()).toContain(name === 'command:ps' ? '--json' : 'JSONL');
  expect(list).not.toHaveBeenCalled();
  expect(tap).not.toHaveBeenCalled();
});

it('lists only Expo sessions and excludes observers', async () => {
  const expo = session('100', 'expo start');
  jest
    .mocked(list)
    .mockResolvedValue([
      session('101', 'other-tool'),
      session('102', 'expo command:ps'),
      session('103', 'expo command:events'),
      session('105', 'expo command'),
      expo,
      session('104', 'expo export', false),
    ]);
  await expoCommandPs(['--active', '--json']);
  expect(JSON.parse(output())).toEqual([expo]);
  expect(stderr).not.toHaveBeenCalled();
});

it('prints an empty JSON array when no sessions match', async () => {
  await expoCommandPs(['--json', 'missing']);
  expect(list).toHaveBeenCalledWith();
  expect(JSON.parse(output())).toEqual([]);
  expect(process.exitCode).toBe(0);
});

it.each([expoCommandPs, expoCommandEvents])(
  'scopes sessions before applying exact-match precedence',
  async (command) => {
    const expo = session('100', 'expo start');
    const unrelated = session('101', 'start');
    jest
      .mocked(list)
      .mockImplementation(async (options) =>
        options?.selector === 'start' ? [unrelated] : [unrelated, expo]
      );

    await command(command === expoCommandPs ? ['start', '--json'] : ['start']);

    expect(list).toHaveBeenCalledWith();
    if (command === expoCommandPs) {
      expect(JSON.parse(output())).toEqual([expo]);
    } else {
      expect(tap).toHaveBeenCalledWith(expo.sessionDir, expect.any(Object));
    }
    expect(stderr).not.toHaveBeenCalled();
  }
);

it.each([
  ['100', ['100']],
  ['expo start', ['100']],
  [' START ', ['100', '1000']],
  ['/app', ['100', '1000']],
  ['missing', []],
])('matches Expo selector %j with exact matches preferred', async (selector, ids) => {
  jest
    .mocked(list)
    .mockResolvedValue([session('100', 'expo start'), session('1000', 'expo start --web')]);
  await expoCommandPs([selector as string, '--json']);
  expect(JSON.parse(output()).map((item: ListedSession) => item.id)).toEqual(ids);
});

it('shows command and ready server details using the resolved project root', async () => {
  jest.mocked(list).mockResolvedValue([
    {
      ...session('100', 'expo start'),
      metadata: {
        ready: true,
        port: 8081,
        devServerUrl: 'http://localhost:8081',
        projectRoot: '/app/mobile',
      },
    },
  ]);
  await expoCommandPs([]);
  expect(output()).toBe(
    'PID\tSTATUS\tSTARTED\tCOMMAND\tPROJECT\tPORT\tURL\n' +
      '100\talive\t1970-01-01T00:00:01.000Z\tstart\t/app/mobile\t8081\thttp://localhost:8081\n'
  );
});

it.each([
  { alive: true, ready: false },
  { alive: true, ready: undefined },
  { alive: true, ready: 'true' },
  { alive: false, ready: true },
])('hides server details when unavailable: %j', async ({ alive, ready }) => {
  jest.mocked(list).mockResolvedValue([
    {
      ...session('100', 'expo start', alive),
      metadata: {
        ready,
        port: 8081,
        devServerUrl: 'http://localhost:8081',
      } as ListedSession['metadata'],
    },
  ]);
  await expoCommandPs([]);
  expect(output().trim().split('\n')[1]!.split('\t')).toEqual([
    '100',
    alive ? 'alive' : 'exited',
    '1970-01-01T00:00:01.000Z',
    'start',
    '/app',
    '-',
    '-',
  ]);
});

it('handles older sessions without metadata and escapes project paths in TSV', async () => {
  jest.mocked(list).mockResolvedValue([
    {
      ...session('100', 'expo export'),
      cwd: '/app\twith\nnewlines',
      metadata: {},
    },
  ]);
  await expoCommandPs([]);
  const lines = output().trim().split('\n');
  expect(lines).toHaveLength(2);
  expect(lines[1]!.split('\t')).toEqual([
    '100',
    'alive',
    '1970-01-01T00:00:01.000Z',
    'export',
    '/app\\twith\\nnewlines',
    '-',
    '-',
  ]);
});

it('selects an Expo session even when a non-Expo session is running', async () => {
  jest
    .mocked(list)
    .mockResolvedValue([session('100', 'other-tool'), session('101', 'expo export', false)]);
  await expoCommandEvents([]);
  expect(tap).toHaveBeenCalledWith('/sessions/101', expect.objectContaining({ follow: false }));
});

it('prefers the only running Expo session and delegates event filtering to 2g', async () => {
  jest
    .mocked(list)
    .mockResolvedValue([session('100', 'expo start', false), session('101', 'expo start')]);
  await expoCommandEvents([
    '--since',
    '5m',
    'expo start',
    '--filter',
    'metro:bundling',
    '--filter=devserver:*',
    '--tail',
    '--spans',
  ]);
  expect(list).toHaveBeenCalledWith();
  expect(tap).toHaveBeenCalledWith('/sessions/101', {
    since: '5m',
    filter: ['metro:bundling', 'devserver:*'],
    spans: true,
    follow: true,
  });
});

it('handles a selector after the option terminator', async () => {
  jest.mocked(list).mockResolvedValue([{ ...session('101', 'expo start'), cwd: '/app/-project' }]);
  await expoCommandEvents(['--', '-project']);
  expect(list).toHaveBeenCalledWith();
  expect(tap).toHaveBeenCalledWith('/sessions/101', expect.any(Object));
});

it('rejects ambiguity without exposing other tools as candidates', async () => {
  jest
    .mocked(list)
    .mockResolvedValue([
      session('100', 'expo start'),
      session('101', 'expo start'),
      session('102', 'other-tool'),
    ]);
  await expoCommandEvents([]);
  expect(tap).not.toHaveBeenCalled();
  expect(stdout).not.toHaveBeenCalled();
  expect(stderr).toHaveBeenCalledWith(expect.stringContaining('Ambiguous Expo CLI session'));
  expect(stderr.mock.calls[0][0]).not.toContain('other-tool');
  expect(process.exitCode).toBe(1);
});

it('does not tap a selector matching only another tool', async () => {
  jest.mocked(list).mockResolvedValue([session('100', 'other-tool')]);
  await expoCommandEvents(['100']);
  expect(tap).not.toHaveBeenCalled();
  expect(stderr).toHaveBeenCalledWith(expect.stringContaining('No Expo CLI sessions found'));
  expect(process.exitCode).toBe(1);
});

it.each([
  ['--unknown'],
  ['--debug'],
  ['one', 'two'],
  ['--since'],
  ['--format', 'pretty'],
  ['--json'],
])('rejects invalid events arguments %j', async (...args) => {
  await expoCommandEvents(args);
  expect(list).not.toHaveBeenCalled();
  expect(tap).not.toHaveBeenCalled();
  expect(stdout).not.toHaveBeenCalled();
  expect(stderr).toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

it('reports 2g failures on stderr without a stack trace', async () => {
  jest.mocked(list).mockResolvedValue([session('100', 'expo start')]);
  jest.mocked(tap).mockImplementationOnce(() => {
    throw new Error('Invalid --since value: invalid');
  });
  await expoCommandEvents(['--since', 'invalid']);
  expect(stderr).toHaveBeenCalledWith('Invalid --since value: invalid\n');
  expect(stdout).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

it('streams each event as a separate JSON line by default', async () => {
  jest.mocked(list).mockResolvedValue([session('100', 'expo start')]);
  const events = [
    { _e: 'devserver:url', _t: 1000, port: 8081 },
    { _e: 'metro:bundling', _t: 2000, _d: 10 },
  ];
  jest.mocked(tap).mockImplementation(async function* () {
    yield* events;
  });
  await expoCommandEvents([]);
  expect(
    output()
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
  ).toEqual(events);
  expect(stderr).not.toHaveBeenCalled();
});

it.each([[], ['--help'], ['-h']])('shows command usage without a prompt: %j', async (...args) => {
  await expoCommand(args);
  expect(output()).toContain('  Usage\n    $ npx expo command <ps|events>');
  expect(output()).toContain('  Info\n');
  expect(output()).not.toContain('  Options\n');
  expect(output()).toContain('ps [selector]');
  expect(output()).toContain('events [selector]');
  expect(list).not.toHaveBeenCalled();
  expect(tap).not.toHaveBeenCalled();
});

it.each(['ps', 'events'])('forwards help to command %s', async (command) => {
  await expoCommand([command, '--help']);
  expect(output()).toContain(`  Usage\n    $ npx expo command:${command} [selector]`);
  expect(list).not.toHaveBeenCalled();
});

it('dispatches ps arguments without changing them', async () => {
  jest
    .mocked(list)
    .mockResolvedValue([session('100', 'expo start'), session('101', 'expo start', false)]);
  const args = ['ps', 'expo start', '--active', '--json'];
  await expoCommand(args);
  expect(list).toHaveBeenCalledWith();
  expect(JSON.parse(output())).toEqual([session('100', 'expo start')]);
  expect(args).toEqual(['ps', 'expo start', '--active', '--json']);
});

it('dispatches events arguments', async () => {
  jest.mocked(list).mockResolvedValue([session('100', 'expo start')]);
  await expoCommand(['events', '100', '--since', '5m', '--tail']);
  expect(tap).toHaveBeenCalledWith(
    '/sessions/100',
    expect.objectContaining({ since: '5m', follow: true })
  );
});

it('reports an unknown subcommand on stderr', async () => {
  await expoCommand(['unknown']);
  expect(stdout).not.toHaveBeenCalled();
  expect(stderr).toHaveBeenCalledWith(
    'Unknown command: unknown. Run `npx expo command --help` for usage.\n'
  );
  expect(process.exitCode).toBe(1);
});

it('keeps JSON and JSONL plain when terminal colors are enabled', async () => {
  chalk.level = 1;
  const item = session('100', 'expo start');
  jest.mocked(list).mockResolvedValue([item]);
  await expoCommandPs(['--json']);
  expect(output()).toBe(`${JSON.stringify([item], null, 2)}\n`);

  stdout.mockClear();
  const event = { _e: 'devserver:url', _t: 1000, port: 8081 };
  jest.mocked(tap).mockImplementation(async function* () {
    yield event;
  });
  await expoCommandEvents([]);
  expect(output()).toBe(`${JSON.stringify(event)}\n`);
});
