// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// Which port the lock publishes. The dev server picks it, not the wrapper, so the wrapper reads
// it back out of the dev server's own log — and must not read the previous run's answer.

import { vol } from 'memfs';
import path from 'path';

import {
  DEFAULT_DEV_SERVER_PORT,
  readLastLoggedDevServerPort,
  readPortArg,
  resolveDevServerPortAsync,
} from '../port';

const projectRoot = path.join(path.sep, 'project');
const startLogPath = path.join(projectRoot, '.expo', 'dev', 'logs', 'start.log');

/** Write a `start.log` from `metro:instantiate` entries, as `2g` serializes them (`_e`, `_t`). */
function writeStartLog(entries: { port: number; at: number }[]) {
  vol.fromJSON({
    [startLogPath]: entries
      .map(({ port, at }) => JSON.stringify({ _e: 'metro:instantiate', _t: at, port }))
      .join('\n'),
  });
}

beforeEach(() => vol.reset());

describe(readPortArg, () => {
  it.each([
    [['start', '--port', '8082'], 8082],
    [['start', '--port=8083'], 8083],
    [['start', '-p', '8084'], 8084],
    [['start', '-p=8085'], 8085],
    [['run:ios', '--device', 'iPhone', '--port', '9000'], 9000],
  ])(`reads the port out of %p`, (args, expected) => {
    expect(readPortArg(args)).toBe(expected);
  });

  it.each([
    [['start']],
    [['start', '--port']],
    [['start', '--port', 'later']],
    // The value after the separator belongs to whatever `expo start` forwards it to.
    [['start', '--', '--port', '8082']],
  ])(`names no port in %p`, (args) => {
    expect(readPortArg(args)).toBeNull();
  });
});

describe(readLastLoggedDevServerPort, () => {
  it(`reads the last logged port`, () => {
    writeStartLog([
      { port: 8082, at: 1000 },
      { port: 8090, at: 2000 },
    ]);

    expect(readLastLoggedDevServerPort(projectRoot)).toBe(8090);
  });

  it(`reports nothing without a log`, () => {
    expect(readLastLoggedDevServerPort(projectRoot)).toBeNull();
  });

  it(`survives a torn write`, () => {
    vol.fromJSON({
      [startLogPath]: [
        JSON.stringify({ _e: 'metro:instantiate', _t: 1000, port: 8082 }),
        '{"_e":"metro:instantiate","_t":2000,"po',
      ].join('\n'),
    });

    expect(readLastLoggedDevServerPort(projectRoot)).toBe(8082);
  });

  it(`ignores entries older than the run that is asking`, () => {
    // The log outlives the dev server that wrote it, so the previous run's port is exactly the
    // zombie answer this lock exists to make impossible.
    writeStartLog([{ port: 8090, at: 1000 }]);

    expect(readLastLoggedDevServerPort(projectRoot, { since: 2000 })).toBeNull();
    expect(readLastLoggedDevServerPort(projectRoot, { since: 1000 })).toBe(8090);
  });

  it(`takes the newest entry at or after the cutoff`, () => {
    writeStartLog([
      { port: 8090, at: 1000 },
      { port: 8082, at: 3000 },
    ]);

    expect(readLastLoggedDevServerPort(projectRoot, { since: 2000 })).toBe(8082);
  });

  it(`ignores an entry with no timestamp when a cutoff is given`, () => {
    vol.fromJSON({
      [startLogPath]: JSON.stringify({ _e: 'metro:instantiate', port: 8090 }),
    });

    expect(readLastLoggedDevServerPort(projectRoot, { since: 1000 })).toBeNull();
    // Without a cutoff the entry is still a candidate: discovery probes it before trusting it.
    expect(readLastLoggedDevServerPort(projectRoot)).toBe(8090);
  });
});

describe(resolveDevServerPortAsync, () => {
  const watch = { intervalMs: 1, timeoutMs: 50 };

  it(`resolves the port the dev server logged`, async () => {
    writeStartLog([{ port: 8090, at: 2000 }]);

    await expect(
      resolveDevServerPortAsync(projectRoot, ['start'], { since: 1000, ...watch })
    ).resolves.toEqual({ port: 8090, source: 'log' });
  });

  it(`waits for the log entry to appear`, async () => {
    const resolved = resolveDevServerPortAsync(projectRoot, ['start'], {
      since: 1000,
      intervalMs: 1,
      timeoutMs: 5000,
    });
    setTimeout(() => writeStartLog([{ port: 8091, at: 2000 }]), 20);

    await expect(resolved).resolves.toEqual({ port: 8091, source: 'log' });
  });

  it(`falls back to the --port argument when the log never answers`, async () => {
    await expect(
      resolveDevServerPortAsync(projectRoot, ['start', '--port', '8082'], { since: 1000, ...watch })
    ).resolves.toEqual({ port: 8082, source: 'arg' });
  });

  it(`falls back to the default port when nothing answers`, async () => {
    await expect(
      resolveDevServerPortAsync(projectRoot, ['start'], { since: 1000, ...watch })
    ).resolves.toEqual({ port: DEFAULT_DEV_SERVER_PORT, source: 'default' });
  });

  it(`prefers the logged port over the requested one`, async () => {
    // `expo start` walks past a taken port, so the port it asked for is not the port it got.
    writeStartLog([{ port: 8083, at: 2000 }]);

    await expect(
      resolveDevServerPortAsync(projectRoot, ['start', '--port', '8082'], { since: 1000, ...watch })
    ).resolves.toEqual({ port: 8083, source: 'log' });
  });

  it(`stops waiting as soon as the dev server is gone`, async () => {
    const startedAt = Date.now();

    await expect(
      resolveDevServerPortAsync(projectRoot, ['start'], {
        since: 1000,
        isRunning: () => false,
        intervalMs: 1000,
        timeoutMs: 60_000,
      })
    ).resolves.toEqual({ port: DEFAULT_DEV_SERVER_PORT, source: 'default' });
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});
