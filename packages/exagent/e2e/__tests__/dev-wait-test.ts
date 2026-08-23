/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// `exagent dev:wait` through the process boundary, which is where its contract actually lives: an
// agent reads the exit code of a subprocess, not a return value. Every case runs against the stub
// dev server of `e2e/utils.ts`, so a wait that expires costs 300ms instead of a real cold bundle.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  type StubDevServer,
} from '../utils';

/** Stub dev servers started by a test, closed after it. */
const servers: StubDevServer[] = [];

async function startStubAsync(
  options: Parameters<typeof startStubDevServerAsync>[0] = {}
): Promise<StubDevServer> {
  const server = await startStubDevServerAsync(options);
  servers.push(server);
  return server;
}

/** Read the JSONL event stream a run wrote. `2g` names the event in the `_e` field. */
function readEvents(eventsFile: string): any[] {
  return fs
    .readFileSync(eventsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

afterEach(async () => {
  for (const server of servers.splice(0)) {
    await server.close();
  }
});

describe('exagent dev:wait', () => {
  it('documents its options and its exit codes in `--help`', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['dev:wait', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--timeout');
    expect(result.all).toContain('--require-app');
    expect(result.all).toContain('--dev-server-url');
    // The codes are the contract an agent branches on, so they are documented, not implied.
    expect(result.all).toContain('22');
  });

  it('exits 0 against a dev server that is ready', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

    const result = await executeExagentAsync(projectRoot, [
      'dev:wait',
      '--dev-server-url',
      server.url,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('ready');
  });

  it('reports the whole answer as one JSON object', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

    const result = await executeExagentAsync(projectRoot, [
      'dev:wait',
      '--dev-server-url',
      server.url,
      '--json',
    ]);

    const payload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({
      ok: true,
      devServerUrl: server.url,
      ready: true,
      // The stub names the project root in the header a real dev server sends, so this is the
      // wire contract that closes the "is it my dev server" caveat of discovery.
      projectRootMatched: true,
      appsConnected: 1,
      timedOut: false,
      // `--dev-server-url` was named, so nothing was guessed at.
      source: 'flag',
    });
    expect(typeof payload.waitedMs).toBe('number');
  });

  // The distinction the whole exit-code convention exists for: inconclusive, not failed.
  it('exits 22 when the wait expires on a dev server that is still bundling', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot, statusDelayMs: 30_000 });

    const result = await executeExagentAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', server.url, '--timeout', '300'],
      { reject: false }
    );

    expect(result.exitCode).toBe(22);
    expect(result.stdout).toContain('timed out');
    // Errors are prompts: the way out is the last thing printed.
    expect(result.all).toContain('npx exagent dev:wait --timeout 600');
  });

  it('exits 1 when there is no dev server to wait on', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', 'http://127.0.0.1:1', '--timeout', '300'],
      { reject: false }
    );

    // A tool error, not an outcome: there was nothing to wait on, so waiting again is pointless.
    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('Try: npx exagent dev');
  });

  it('exits 1 on a bad argument, without touching the network', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev:wait', '--timeout', 'soon'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('--timeout');
  });

  it('names another project as the owner of the bundle it found', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot: '/somewhere/else', targets: [{ id: '1' }] });

    const result = await executeExagentAsync(projectRoot, [
      'dev:wait',
      '--dev-server-url',
      server.url,
      '--json',
    ]);

    expect(JSON.parse(result.stdout)).toMatchObject({ projectRootMatched: false });
  });

  describe('--require-app', () => {
    it('exits 0 when an app is already attached', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

      const result = await executeExagentAsync(projectRoot, [
        'dev:wait',
        '--dev-server-url',
        server.url,
        '--require-app',
      ]);

      expect(result.exitCode).toBe(0);
    });

    it('exits 22 when the bundle is built but nothing ever attaches', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({ projectRoot, targets: [] });

      const result = await executeExagentAsync(
        projectRoot,
        ['dev:wait', '--dev-server-url', server.url, '--require-app', '--timeout', '500'],
        { reject: false }
      );

      expect(result.exitCode).toBe(22);
    });
  });

  it('emits one cli:dev_wait event for a driving agent', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });
    const eventsFile = path.join(projectRoot, 'events.jsonl');

    await executeExagentAsync(projectRoot, ['dev:wait', '--dev-server-url', server.url], {
      env: { LOG_EVENTS: eventsFile },
    });

    const waits = readEvents(eventsFile).filter((entry) => entry._e === 'cli:dev_wait');
    expect(waits).toHaveLength(1);
    expect(waits[0]).toMatchObject({
      devServerUrl: server.url,
      source: 'flag',
      ready: true,
      projectRootMatched: true,
      appsConnected: 1,
      timedOut: false,
    });
  });

  // `process.exit` drops buffered JSONL, so the events that explain a non-zero code would be the
  // ones lost. `exitWithCodeAsync` flushes first (llp/0010 §Exit codes).
  it('still writes its events when it exits with an outcome code', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot, statusDelayMs: 30_000 });
    const eventsFile = path.join(projectRoot, 'events.jsonl');

    const result = await executeExagentAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', server.url, '--timeout', '300'],
      { env: { LOG_EVENTS: eventsFile }, reject: false }
    );

    expect(result.exitCode).toBe(22);
    const waits = readEvents(eventsFile).filter((entry) => entry._e === 'cli:dev_wait');
    expect(waits).toHaveLength(1);
    expect(waits[0]).toMatchObject({ ready: false, timedOut: true });
  });

  it('finds the project dev server on its own when no URL is named', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });
    // The port the project's own `start.log` recorded is step 1 of discovery, and it is the step
    // an ephemeral test port can exercise without holding a lock.
    const logPath = path.join(projectRoot, '.expo', 'dev', 'logs', 'start.log');
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
    await fs.promises.writeFile(
      logPath,
      `${JSON.stringify({ _e: 'metro:instantiate', port: server.port })}\n`
    );

    const result = await executeExagentAsync(projectRoot, ['dev:wait', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      devServerUrl: server.url,
      source: 'log',
    });
  });
});
