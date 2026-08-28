// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// `@expo/agent-cli dev:wait` through the process boundary, which is where its contract actually lives: an
// agent reads the exit code of a subprocess, not a return value. Every case runs against the stub
// dev server of `e2e/utils.ts`, so a wait that expires costs 300ms instead of a real cold bundle.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeAgentCliAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  type StubDevServer,
} from '../../../../e2e/utils';

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

describe('@expo/agent-cli dev:wait', () => {
  it('documents its options and its exit codes in `--help`', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeAgentCliAsync(projectRoot, ['dev:wait', '--help']);

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

    const result = await executeAgentCliAsync(projectRoot, [
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

    const result = await executeAgentCliAsync(projectRoot, [
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

    const result = await executeAgentCliAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', server.url, '--timeout', '300'],
      { reject: false }
    );

    expect(result.exitCode).toBe(22);
    expect(result.stdout).toContain('timed out');
    // Errors are prompts: the way out is the last thing printed.
    expect(result.all).toContain('npx @expo/agent-cli dev:wait --timeout 600');
  });

  it('exits 1 when there is no dev server to wait on', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', 'http://127.0.0.1:1', '--timeout', '300'],
      { reject: false }
    );

    // A tool error, not an outcome: there was nothing to wait on, so waiting again is pointless.
    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('Try: npx @expo/agent-cli dev');
  });

  it('exits 1 on a bad argument, without touching the network', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(projectRoot, ['dev:wait', '--timeout', 'soon'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('--timeout');
  });

  // The human report was already right about this and the machine output was not: `ok: true` and
  // exit 0 sent an agent into a stranger's app while the prose on screen told a person not to go.
  it('exits 20 for another project’s dev server, and says so in the JSON', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot: '/somewhere/else', targets: [{ id: '1' }] });

    const result = await executeAgentCliAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', server.url, '--json'],
      { reject: false }
    );

    expect(result.exitCode).toBe(20);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      // The bundler really did finish; it finished someone else's bundle.
      ready: true,
      projectRootMatched: false,
    });
    expect(JSON.parse(result.stdout).followups[0].id).toBe('dev-wait-other-project');
  });

  it('keeps the human report of the mismatch unchanged', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot: '/somewhere/else', targets: [{ id: '1' }] });

    const result = await executeAgentCliAsync(
      projectRoot,
      ['dev:wait', '--dev-server-url', server.url],
      { reject: false }
    );

    expect(result.exitCode).toBe(20);
    expect(result.stdout).toContain('serves /somewhere/else');
    expect(result.stdout).toContain(projectRoot);
  });

  // A dev server that named no project root has not been shown to be the wrong one.
  it('exits 0 when the dev server named no project root at all', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = await startStubAsync({ projectRoot: null, targets: [{ id: '1' }] });

    const result = await executeAgentCliAsync(projectRoot, [
      'dev:wait',
      '--dev-server-url',
      server.url,
      '--json',
    ]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, projectRootMatched: null });
  });

  // The most damaging finding of the friction run: an agent broke the build, then asked four
  // different health commands whether the app was fine and got four green answers. `/status` only
  // ever proved the bundler process was alive.
  describe('the entry-bundle check', () => {
    it('exits 20 and names the file when the project does not compile', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({
        projectRoot,
        targets: [{ id: '1' }],
        bundle: 'broken',
      });

      const result = await executeAgentCliAsync(
        projectRoot,
        ['dev:wait', '--dev-server-url', server.url, '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report.ok).toBe(false);
      // The dev server was healthy the whole time. That was never the question.
      expect(report.ready).toBe(true);
      expect(report.bundle).toMatchObject({
        checked: true,
        ok: false,
        platform: 'ios',
        error: {
          type: 'TransformError',
          filename: 'src/app/index.tsx',
          lineNumber: 101,
          column: 2,
          message: expect.stringContaining("Unexpected keyword 'const'"),
        },
      });
      expect(report.followups[0].id).toBe('dev-wait-bundle-broken');
    });

    it('prints the file, line and message for a human', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({
        projectRoot,
        targets: [{ id: '1' }],
        bundle: 'broken',
      });

      const result = await executeAgentCliAsync(
        projectRoot,
        ['dev:wait', '--dev-server-url', server.url],
        { reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(result.stdout).toContain('does not compile for ios');
      expect(result.stdout).toContain('src/app/index.tsx:101:2');
      expect(result.stdout).toContain("Unexpected keyword 'const'");
    });

    it('exits 0 and says so when the entry bundle compiles', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

      const result = await executeAgentCliAsync(projectRoot, [
        'dev:wait',
        '--dev-server-url',
        server.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).bundle).toMatchObject({
        checked: true,
        ok: true,
        platform: 'ios',
        error: null,
      });
      expect(JSON.parse(result.stdout).bundle.url).toContain('platform=ios');
    });

    // @ref llp/0010-agent-conventions.rfc.md §The web target answers the same question with
    // different documents. The web dev server has no manifest, so `--platform web` used to skip
    // the check entirely and report green on the same file `--platform ios` exited 20 for
    // [observed — friction run 2, 2026-08-23].
    describe('the web target', () => {
      it('exits 0 with the bundle the page names when it compiles', async () => {
        const projectRoot = await setupFixtureAsync('go-app');
        const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

        const result = await executeAgentCliAsync(projectRoot, [
          'dev:wait',
          '--platform',
          'web',
          '--dev-server-url',
          server.url,
          '--json',
        ]);

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout).bundle).toMatchObject({
          checked: true,
          ok: true,
          platform: 'web',
          error: null,
        });
        expect(JSON.parse(result.stdout).bundle.url).toContain('platform=web');
      });

      it('exits 20 with the file and line off the error page the dev server renders', async () => {
        const projectRoot = await setupFixtureAsync('go-app');
        const server = await startStubAsync({
          projectRoot,
          targets: [{ id: '1' }],
          bundle: 'broken',
        });

        const result = await executeAgentCliAsync(
          projectRoot,
          ['dev:wait', '--platform', 'web', '--dev-server-url', server.url, '--json'],
          { reject: false }
        );

        expect(result.exitCode).toBe(20);
        expect(JSON.parse(result.stdout).bundle).toMatchObject({
          checked: true,
          ok: false,
          platform: 'web',
          error: {
            filename: '/project/src/app/index.tsx',
            lineNumber: 101,
            column: 2,
            message: expect.stringContaining("Unexpected keyword 'const'"),
          },
        });
      });

      // @ref llp/0010-agent-conventions.rfc.md §What app counting can and cannot see — F40.
      // The stub reports an iOS target, exactly as the live dev server did with Expo Go attached
      // and a browser running the web bundle: the browser is in neither list, because it never
      // registers a debugger target [observed — 2026-08-24, live].
      it('reports no app count for web, rather than the native one', async () => {
        const projectRoot = await setupFixtureAsync('go-app');
        const server = await startStubAsync({ projectRoot, targets: [{ id: 'ios-1' }] });

        const result = await executeAgentCliAsync(projectRoot, [
          'dev:wait',
          '--platform',
          'web',
          '--dev-server-url',
          server.url,
          '--json',
        ]);

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout)).toMatchObject({
          ok: true,
          appsConnected: null,
          appsReason: expect.stringContaining('native'),
        });
      });

      it('refuses --require-app for web, and names what to do instead', async () => {
        const projectRoot = await setupFixtureAsync('go-app');

        const result = await executeAgentCliAsync(
          projectRoot,
          ['dev:wait', '--platform', 'web', '--require-app', '--json'],
          { reject: false }
        );

        // A usage error, not an outcome: the flag combination asks for something no dev server
        // can answer, so there is nothing to report about the project.
        expect(result.exitCode).toBe(1);
        const { error } = JSON.parse(result.stdout);
        expect(error.code).toBe('BAD_ARGS');
        expect(error.message).toContain('--require-app cannot be answered for --platform web');
        expect(error.message).toContain('--platform ios');
      });

      it('keeps --platform web in the follow-ups, and names no native runtime', async () => {
        const projectRoot = await setupFixtureAsync('go-app');
        const server = await startStubAsync({
          projectRoot,
          targets: [{ id: 'ios-1' }],
          bundle: 'broken',
        });

        const result = await executeAgentCliAsync(
          projectRoot,
          ['dev:wait', '--platform', 'web', '--dev-server-url', server.url],
          { reject: false }
        );

        expect(result.all).toContain('npx @expo/agent-cli dev:wait --platform web');
        // `runtime:errors` reads the app through the debugger, which on this dev server is the
        // iOS runtime — a different app on a different platform than the one that was waited on.
        expect(result.all).not.toContain('runtime:errors');
      });
    });

    it('builds the bundle for the platform --platform names', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

      const result = await executeAgentCliAsync(projectRoot, [
        'dev:wait',
        '--dev-server-url',
        server.url,
        '--platform',
        'android',
        '--json',
      ]);

      expect(JSON.parse(result.stdout).bundle).toMatchObject({ ok: true, platform: 'android' });
      expect(JSON.parse(result.stdout).bundle.url).toContain('platform=android');
    });

    it('checks nothing with --no-bundle-check', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({
        projectRoot,
        targets: [{ id: '1' }],
        bundle: 'broken',
      });

      const result = await executeAgentCliAsync(projectRoot, [
        'dev:wait',
        '--dev-server-url',
        server.url,
        '--no-bundle-check',
        '--json',
      ]);

      // The escape hatch: the same broken project, and the same answer the command used to give
      // — with the flag named back, so a declined check does not read as a clean one (F48-7).
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).bundle).toEqual({
        checked: false,
        ok: null,
        platform: null,
        url: null,
        error: null,
        reason: 'the entry bundle check was not run (--no-bundle-check)',
      });
    });

    // A dev server that answers nothing this command understands has not shown the project to be
    // broken, so the gate stays green and says why it could not decide.
    it('exits 0 when the dev server answers no manifest', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({
        projectRoot,
        targets: [{ id: '1' }],
        bundle: 'no-manifest',
      });

      const result = await executeAgentCliAsync(projectRoot, [
        'dev:wait',
        '--dev-server-url',
        server.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      // `checked` follows `ok`: nothing was decided, so nothing was checked.
      expect(JSON.parse(result.stdout).bundle).toMatchObject({ checked: false, ok: null });
      expect(JSON.parse(result.stdout).bundle.reason).toContain('404');
    });

    // The first build of a cold dev server compiles the whole app, so the budget has to be able to
    // expire — and expiring is "look again", not "the project is broken".
    it('exits 22 when the first build does not finish inside --timeout', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({
        projectRoot,
        targets: [{ id: '1' }],
        bundleDelayMs: 30_000,
      });

      const result = await executeAgentCliAsync(
        projectRoot,
        ['dev:wait', '--dev-server-url', server.url, '--timeout', '600ms', '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(22);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: false,
        timedOut: true,
        bundle: { checked: false, ok: null },
      });
    });

    it('rejects a platform the dev server does not bundle for', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(projectRoot, ['dev:wait', '--platform', 'windows'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.all).toContain('--platform windows');
      expect(result.all).toContain('ios, android, web');
    });
  });

  describe('--require-app', () => {
    it('exits 0 when an app is already attached', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const server = await startStubAsync({ projectRoot, targets: [{ id: '1' }] });

      const result = await executeAgentCliAsync(projectRoot, [
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

      const result = await executeAgentCliAsync(
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

    await executeAgentCliAsync(projectRoot, ['dev:wait', '--dev-server-url', server.url], {
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

    const result = await executeAgentCliAsync(
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

    const result = await executeAgentCliAsync(projectRoot, ['dev:wait', '--json']);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      devServerUrl: server.url,
      source: 'log',
    });
  });
});
