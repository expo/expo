/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
//
// `exagent status` is the read-only overview: it prints where the project is and what would
// happen next, and always exits 0. These tests run it through the CLI it is published as, against
// the fixture matrix in `e2e/fixtures/README.md`.
import fs from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';

import { WebSocketServer } from 'ws';

import {
  executeExagentAsync,
  holdDevLockAsync,
  installStubBinAsync,
  installStubFingerprintAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
  startStubDevServerAsync,
  writeAgentSelectionAsync,
} from '../utils';

/** The shape `status --json` prints, per `src/status/types.ts`. */
type StatusReport = {
  project: {
    root: string;
    name: string | null;
    sdkVersion: string | null;
    native: 'bare' | 'cng';
    nativeDirs: { ios: boolean; android: boolean };
    usesDevClient: boolean;
    hasWeb: boolean;
  } | null;
  expoGo: { compatible: boolean; reasonCount: number } | null;
  freshness: {
    hash: string | null;
    error?: string;
    platforms: {
      platform: 'ios' | 'android';
      state: 'fresh' | 'stale' | 'unknown';
      detail: string;
      recordedHash: string | null;
    }[];
  } | null;
  devServer: {
    url: string;
    running: boolean;
    appsConnected: number;
    source: 'flag' | 'lock' | 'log' | 'default' | 'scan';
    ready: boolean | null;
    projectRootMatched: boolean | null;
    reason?: string;
  } | null;
  skills: { agentIds: string[] | null; discovered: number; linked: number } | null;
  auth: {
    loggedIn: boolean | null;
    user: string | null;
    source: 'eas whoami' | 'EXPO_TOKEN' | null;
  } | null;
  next: {
    command: string;
    rule: string;
    target: string;
    steps: { argv: string[] }[];
    why: string | null;
  } | null;
  /** The raw project probe, per `src/project/types.ts`. Covered on its own in `probe-test.ts`. */
  probe: {
    projectRoot: string;
    sdkVersion: string | null;
    nativeDirs: { ios: boolean; android: boolean };
    usesDevClient: boolean;
    hasWeb: boolean;
    expoGo: {
      compatible: boolean;
      reasons: { kind: string; packageName?: string; detail: string }[];
    };
    fingerprint: { hash: string | null; error?: string };
  } | null;
  errors: Record<string, string>;
  followups: { id: string; command: string; why: string }[];
};

/** The hash the stub `@expo/fingerprint` bin of `dev-client-fresh-app` prints. */
const FIXTURE_FINGERPRINT_HASH = '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';

/** One debugger target, the shape `expo start` reports for a connected app. */
const CDP_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  title: 'Expo Go',
  type: 'native',
  description: '',
  devtoolsFrontendUrl: '/devtools',
  webSocketDebuggerUrl: 'ws://127.0.0.1/inspector/debug?device=1&page=1',
};

/** Copy a fixture and install both stub bins the status sections may reach for. */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);
  return projectRoot;
}

/** A dev server double that answers the debugger target list, and the port it listens on. */
async function startDevServerDoubleAsync(
  targets: unknown[],
  /**
   * Whether the debugger sockets the targets point at accept a connection.
   *
   * `live` is a connected app; `stale` is a page the dev server still lists with nothing behind it,
   * which is what an app that was force-stopped leaves and what `status` used to count as an app
   * (llp/0005 §Android, F56).
   */
  inspector: 'live' | 'stale' = 'live'
): Promise<{ server: Server; url: string }> {
  let port = 0;
  const server = createServer((request, response) => {
    if (request.url === '/json/list') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      // On this double's own port, the way a real dev server publishes its debugger URLs: a
      // fixture URL with no port is one nothing can connect to.
      response.end(
        JSON.stringify(
          targets.map((target) => ({
            ...(target as Record<string, unknown>),
            webSocketDebuggerUrl: `ws://127.0.0.1:${port}/inspector/debug?device=1&page=1`,
          }))
        )
      );
      return;
    }
    response.writeHead(404).end();
  });

  const inspectorServer = inspector === 'live' ? new WebSocketServer({ noServer: true }) : null;
  server.on('upgrade', (request, socket, head) => {
    if (inspectorServer && (request.url ?? '').split('?')[0] === '/inspector/debug') {
      inspectorServer.handleUpgrade(request, socket as never, head, () => {});
      return;
    }
    socket.destroy();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
  return { server, url: `http://127.0.0.1:${port}` };
}

/** A URL nothing listens on: a port that was bound, then released. */
async function getUnusedDevServerUrlAsync(): Promise<string> {
  const { server, url } = await startDevServerDoubleAsync([]);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return url;
}

/**
 * Run `status --json` in a prepared project and parse the report.
 *
 * Every call points the dev-server probe at a port nothing listens on, so the report never
 * depends on a Metro instance the developer happens to be running.
 */
async function reportInAsync(projectRoot: string, args: string[] = []): Promise<StatusReport> {
  const result = await executeExagentAsync(projectRoot, [
    'status',
    '--json',
    '--dev-server-url',
    await getUnusedDevServerUrlAsync(),
    ...args,
  ]);

  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout);
}

/** Run `status --json` in a fixture and parse the report. */
async function reportAsync(fixtureName: string): Promise<StatusReport> {
  return reportInAsync(await setupAsync(fixtureName));
}

/**
 * Install an `eas` bin that answers `whoami`, on the `PATH` the wrapper searches.
 *
 * The auth section runs a real subprocess, so without a stub the report would say whatever the
 * machine running the suite happens to be signed in as.
 *
 * @param user the account it names, or null for a CLI that refuses because nobody is signed in
 */
async function installStubEasAsync(
  projectRoot: string,
  { user }: { user: string | null }
): Promise<void> {
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const stubScript = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(
    stubScript,
    user
      ? `process.stdout.write(${JSON.stringify(`${user}\n`)});\n`
      : `process.stderr.write('Not logged in\\n');\nprocess.exit(1);\n`
  );
  await installStubBinAsync(binDir, 'eas', stubScript);
}

describe('exagent status', () => {
  it('prints usage with `status --help`', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['status', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--json');
    expect(result.all).toContain('--dev-server-url');
  });

  it('lists the command in the top level help', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('status');
  });

  describe('go-app — an Expo Go compatible CNG project', () => {
    it('prints one line per section', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('project');
      expect(result.stdout).toContain('go-app');
      expect(result.stdout).toContain('SDK 54.0.0');
      expect(result.stdout).toContain('CNG');
      expect(result.stdout).toContain('expo go');
      expect(result.stdout).toContain('compatible');
      expect(result.stdout).toContain('freshness');
      expect(result.stdout).toContain('dev server');
      expect(result.stdout).toContain('not running');
      expect(result.stdout).toContain('skills');
      expect(result.stdout).toContain('next');
      expect(result.stdout).toContain('expo-go');
    });

    it('reports every section in the JSON report', async () => {
      const report = await reportAsync('go-app');

      expect(Object.keys(report)).toEqual([
        'project',
        'expoGo',
        'freshness',
        'devServer',
        'skills',
        'auth',
        'next',
        'probe',
        'errors',
        'followups',
      ]);
      expect(report.errors).toEqual({});
      expect(report.project).toMatchObject({
        name: 'go-app',
        sdkVersion: '54.0.0',
        native: 'cng',
        usesDevClient: false,
        hasWeb: true,
      });
      expect(report.expoGo).toEqual({ compatible: true, reasonCount: 0 });
      expect(report.next?.rule).toBe('expo-go');
      expect(report.next?.steps[0]!.argv).toEqual(['expo', 'start', '--go']);
    });

    it('reports an unknown freshness when the project has no fingerprint tool', async () => {
      const report = await reportAsync('go-app');

      // No `fingerprint` bin is installed for this fixture, so nothing can be compared.
      expect(report.freshness?.hash).toBeNull();
      expect(report.freshness?.platforms.map((platform) => platform.state)).toEqual([
        'unknown',
        'unknown',
      ]);
    });

    // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
    // Who the CLI family acts as, asked with a stub `eas` so the answer is the fixture's and not
    // the machine's.
    describe('the auth section', () => {
      it('reports the account the EAS CLI named', async () => {
        const projectRoot = await setupAsync('go-app');
        await installStubEasAsync(projectRoot, { user: 'e2e-user' });

        const report = await reportInAsync(projectRoot);

        expect(report.auth).toEqual({
          loggedIn: true,
          user: 'e2e-user',
          source: 'eas whoami',
        });
      });

      it('reports a signed-out machine, and still exits 0', async () => {
        const projectRoot = await setupAsync('go-app');
        await installStubEasAsync(projectRoot, { user: null });

        const result = await executeExagentAsync(projectRoot, [
          'status',
          '--dev-server-url',
          await getUnusedDevServerUrlAsync(),
        ]);

        // Status is information: not being signed in is a fact it reports, not a failure.
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('auth');
        expect(result.stdout).toContain('not signed in');
      });
    });

    it('reports that no agent is selected', async () => {
      const report = await reportAsync('go-app');

      expect(report.skills).toEqual({ agentIds: null, discovered: 0, linked: 0 });
    });

    it('reports the agents a previous skills run selected', async () => {
      const projectRoot = await setupAsync('go-app');
      await writeAgentSelectionAsync(projectRoot, ['claude-code']);

      const report = await reportInAsync(projectRoot);

      expect(report.skills?.agentIds).toEqual(['claude-code']);
    });

    it('starts nothing and exits 0', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(result.exitCode).toBe(0);
      // Status is read-only: it never invokes the `expo` CLI.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });

    it('emits the status event for a driving agent', async () => {
      const projectRoot = await setupAsync('go-app');
      const eventsFile = path.join(projectRoot, 'events.jsonl');
      const result = await executeExagentAsync(
        projectRoot,
        ['status', '--dev-server-url', await getUnusedDevServerUrlAsync()],
        { env: { LOG_EVENTS: eventsFile } }
      );

      expect(result.exitCode).toBe(0);
      const events = fs
        .readFileSync(eventsFile, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      // `2g` names the event in the `_e` field of every JSONL line.
      const status = events.find((entry) => entry._e === 'cli:status');
      expect(status).toMatchObject({ rule: 'expo-go', devServerRunning: false });
    });

    // @ref llp/0009-smart-followups.rfc.md §Examples per command — status keeps its own `next`
    // line, so the follow-ups only reach a driving agent through JSON and the event stream.
    it('keeps the follow-ups out of the text report', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('Suggested next:');
    });

    it('reports an empty follow-up list with --no-followups, keeping the key set', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--json',
        '--no-followups',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(result.exitCode).toBe(0);
      const report: StatusReport = JSON.parse(result.stdout);
      expect(report.followups).toEqual([]);
      expect(Object.keys(report)).toContain('followups');
    });
  });

  describe('dev-client-fresh-app — a recorded build that still matches', () => {
    it('reports the platform of the recorded build as fresh', async () => {
      const report = await reportAsync('dev-client-fresh-app');

      expect(report.freshness?.hash).toBe(FIXTURE_FINGERPRINT_HASH);
      const ios = report.freshness?.platforms.find((platform) => platform.platform === 'ios');
      expect(ios).toMatchObject({ state: 'fresh', recordedHash: FIXTURE_FINGERPRINT_HASH });
    });

    it('reports the Expo Go blocker and the dev client dependency', async () => {
      const report = await reportAsync('dev-client-fresh-app');

      expect(report.project?.usesDevClient).toBe(true);
      expect(report.expoGo?.compatible).toBe(false);
      expect(report.expoGo!.reasonCount).toBeGreaterThan(0);
    });

    it('reports a native fingerprint change as stale', async () => {
      const projectRoot = await setupAsync('dev-client-fresh-app');
      const result = await executeExagentAsync(
        projectRoot,
        ['status', '--json', '--dev-server-url', await getUnusedDevServerUrlAsync()],
        { env: { STUB_FINGERPRINT_HASH: 'aaaabbbbccccddddeeeeffff0000111122223333' } }
      );

      expect(result.exitCode).toBe(0);
      const report: StatusReport = JSON.parse(result.stdout);
      expect(report.freshness?.platforms.every((platform) => platform.state === 'stale')).toBe(
        true
      );
    });

    it('reports a failing fingerprint tool as an unknown freshness, still exiting 0', async () => {
      const projectRoot = await setupAsync('dev-client-fresh-app');
      const result = await executeExagentAsync(
        projectRoot,
        ['status', '--json', '--dev-server-url', await getUnusedDevServerUrlAsync()],
        { env: { STUB_FINGERPRINT_EXIT_CODE: '1' } }
      );

      // A broken tool is a section note, never a failed command.
      expect(result.exitCode).toBe(0);
      const report: StatusReport = JSON.parse(result.stdout);
      expect(report.freshness?.hash).toBeNull();
      expect(report.freshness?.error).toBeTruthy();
      expect(report.errors).toEqual({});
    });
  });

  describe('bare-app — committed native directories', () => {
    it('reports the project as bare and plans a build', async () => {
      const report = await reportAsync('bare-app');

      expect(report.project?.native).toBe('bare');
      expect(report.project?.nativeDirs).toEqual({ ios: true, android: true });
      expect(report.next?.rule).toBe('bare-stale');
    });

    it('names the checked-in native directories in the human report', async () => {
      const projectRoot = await setupAsync('bare-app');
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('bare (ios, android)');
    });
  });

  describe('the dev server section', () => {
    let server: Server | undefined;

    afterEach(async () => {
      if (server) {
        await new Promise<void>((resolve) => server!.close(() => resolve()));
        server = undefined;
      }
    });

    it('reports a running dev server and the app connected to it', async () => {
      const projectRoot = await setupAsync('go-app');
      const devServer = await startDevServerDoubleAsync([CDP_TARGET]);
      server = devServer.server;

      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--json',
        '--dev-server-url',
        devServer.url,
      ]);

      expect(result.exitCode).toBe(0);
      const report: StatusReport = JSON.parse(result.stdout);
      expect(report.devServer).toEqual({
        url: devServer.url,
        running: true,
        appsConnected: 1,
        appsListed: 1,
        appsStale: 0,
        // The double answers the target list and 404s everything else, so it is reachable and its
        // bundler is not ready — which is exactly what a port that is not Metro looks like.
        source: 'flag',
        ready: false,
        projectRootMatched: null,
      });
    });

    // The readiness probe of status is short and never waits for a bundle, so this asserts the
    // answer a dev server that has already finished gives.
    it('reports a ready bundler and the project it serves', async () => {
      const projectRoot = await setupAsync('go-app');
      const stub = await startStubDevServerAsync({ projectRoot, targets: [CDP_TARGET] });

      try {
        const result = await executeExagentAsync(projectRoot, [
          'status',
          '--json',
          '--dev-server-url',
          stub.url,
        ]);

        expect(JSON.parse(result.stdout).devServer).toEqual({
          url: stub.url,
          running: true,
          appsConnected: 1,
          appsListed: 1,
          appsStale: 0,
          source: 'flag',
          ready: true,
          projectRootMatched: true,
        });
      } finally {
        await stub.close();
      }
    });

    // The report used to say "running on http://127.0.0.1:8099" and, three lines below it,
    // "next  exagent dev → expo-go: expo start --go" — advice to start a second dev server, which
    // is both a contradiction and a command that would fail on the busy port.
    it('sends a healthy dev server to verification instead of to a second dev server', async () => {
      const projectRoot = await setupAsync('go-app');
      const stub = await startStubDevServerAsync({ projectRoot, targets: [CDP_TARGET] });

      try {
        const result = await executeExagentAsync(projectRoot, [
          'status',
          '--json',
          '--dev-server-url',
          stub.url,
        ]);

        const report: StatusReport = JSON.parse(result.stdout);
        expect(report.next?.command).toBe('exagent dev:wait --require-app');
        expect(report.next?.why).toContain('instead of starting a second server');
        // The project's own shape is still reported: a running server does not change it.
        expect(report.next?.rule).toBe('expo-go');
        expect(report.next?.steps).toEqual([]);
      } finally {
        await stub.close();
      }
    });

    it('prints the reason on the human next line', async () => {
      const projectRoot = await setupAsync('go-app');
      const stub = await startStubDevServerAsync({ projectRoot, targets: [CDP_TARGET] });

      try {
        const result = await executeExagentAsync(projectRoot, [
          'status',
          '--dev-server-url',
          stub.url,
        ]);

        expect(result.stdout).toContain('exagent dev:wait --require-app');
        expect(result.stdout).not.toContain('exagent dev → expo-go');
      } finally {
        await stub.close();
      }
    });

    // A dev server that serves someone else is not this project's, so the plan still stands.
    it('keeps the plan when the dev server belongs to another project', async () => {
      const projectRoot = await setupAsync('go-app');
      const stub = await startStubDevServerAsync({ projectRoot: '/somewhere/else', targets: [] });

      try {
        const result = await executeExagentAsync(projectRoot, [
          'status',
          '--json',
          '--dev-server-url',
          stub.url,
        ]);

        const report: StatusReport = JSON.parse(result.stdout);
        expect(report.next?.command).toBe('exagent dev');
        expect(report.next?.why).toBeNull();
      } finally {
        await stub.close();
      }
    });

    it('names another project as the owner of the dev server that answered', async () => {
      const projectRoot = await setupAsync('go-app');
      const stub = await startStubDevServerAsync({ projectRoot: '/somewhere/else', targets: [] });

      try {
        const result = await executeExagentAsync(projectRoot, [
          'status',
          '--dev-server-url',
          stub.url,
        ]);

        expect(result.stdout).toContain('serves another project');
      } finally {
        await stub.close();
      }
    });

    it('prints the running dev server and its connected app for a human', async () => {
      const projectRoot = await setupAsync('go-app');
      const devServer = await startDevServerDoubleAsync([CDP_TARGET]);
      server = devServer.server;

      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        devServer.url,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`running on ${devServer.url}`);
      expect(result.stdout).toContain('1 app connected');
    });

    it('reports a dev server without a connected app', async () => {
      const projectRoot = await setupAsync('go-app');
      const devServer = await startDevServerDoubleAsync([]);
      server = devServer.server;

      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--json',
        '--dev-server-url',
        devServer.url,
      ]);

      expect(result.exitCode).toBe(0);
      const report: StatusReport = JSON.parse(result.stdout);
      expect(report.devServer).toMatchObject({ running: true, appsConnected: 0 });
    });

    it('reports a dev server that does not answer, still exiting 0', async () => {
      const report = await reportAsync('go-app');

      expect(report.devServer?.running).toBe(false);
      expect(report.devServer?.appsConnected).toBe(0);
      expect(report.devServer?.reason).toBeTruthy();
    });

    // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
    // With no `--dev-server-url`, discovery asks the project's dev-server lock before it scans
    // ports. The lock is held by this test, standing in for a running `exagent start`.
    it('finds the dev server the project lock names, with no URL given', async () => {
      const projectRoot = await setupAsync('go-app');
      const devServer = await startDevServerDoubleAsync([CDP_TARGET]);
      server = devServer.server;
      const releaseLock = await holdDevLockAsync(projectRoot, {
        url: devServer.url,
        port: Number(new URL(devServer.url).port),
        pid: process.pid,
        startedAt: new Date().toISOString(),
        projectRoot,
      });

      try {
        const result = await executeExagentAsync(projectRoot, ['status', '--json']);

        expect(result.exitCode).toBe(0);
        const report: StatusReport = JSON.parse(result.stdout);
        // An ephemeral port, so no scan of 8081-8085 could have found it — and `source` now says
        // which step did.
        expect(report.devServer).toEqual({
          url: devServer.url,
          running: true,
          appsConnected: 1,
          appsListed: 1,
          appsStale: 0,
          source: 'lock',
          ready: false,
          projectRootMatched: null,
        });
      } finally {
        releaseLock();
      }
    });

    it('ignores a lock whose dev server is gone', async () => {
      const projectRoot = await setupAsync('go-app');
      const goneUrl = await getUnusedDevServerUrlAsync();
      const releaseLock = await holdDevLockAsync(projectRoot, {
        url: goneUrl,
        port: Number(new URL(goneUrl).port),
        pid: process.pid,
        startedAt: new Date().toISOString(),
        projectRoot,
      });

      try {
        const result = await executeExagentAsync(projectRoot, ['status', '--json']);

        expect(result.exitCode).toBe(0);
        const report: StatusReport = JSON.parse(result.stdout);
        // The lock is probed, never trusted, so a URL that does not answer is not the answer.
        // What discovery falls through to depends on the machine, so only this is asserted.
        expect(report.devServer?.url).not.toBe(goneUrl);
      } finally {
        releaseLock();
      }
    });

    it('rejects a `--dev-server-url` that is not a URL', async () => {
      const projectRoot = await setupAsync('go-app');
      const result = await executeExagentAsync(
        projectRoot,
        ['status', '--dev-server-url', 'not a url'],
        { reject: false }
      );

      // A flag the user got wrong is an argument error, not a status the command can report.
      expect(result.exitCode).toBe(1);
      expect(result.all).toContain('--dev-server-url');
    });
  });

  describe('broken-app — a dependency missing from node_modules', () => {
    it('still reports the sections it can read', async () => {
      const report = await reportAsync('broken-app');

      expect(report.project?.name).toBe('broken-app');
      expect(report.next).not.toBeNull();
      expect(report.devServer?.running).toBe(false);
    });
  });
});
