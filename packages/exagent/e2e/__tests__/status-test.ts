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
  builds: {
    askedEas: boolean;
    platforms: {
      platform: 'ios' | 'android';
      state: 'found' | 'none' | 'unknown';
      fingerprintHash: string | null;
      buildId: string | null;
      createdAt: string | null;
      buildProfile: string | null;
      buildUrl: string | null;
      source: 'cache' | 'eas' | null;
      reason: string | null;
    }[];
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
    buildLocation: {
      runsOn: 'local' | 'eas';
      platform: 'ios' | 'android';
      requirement: string;
      selection: { source: string; because: string; why: string; doomed: boolean } | null;
    } | null;
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

/** File the stub `eas` bin appends one JSON line to per invocation. */
const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';

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
async function reportInAsync(
  projectRoot: string,
  args: string[] = [],
  env: Record<string, string> = {}
): Promise<StatusReport> {
  const result = await executeExagentAsync(
    projectRoot,
    ['status', '--json', '--dev-server-url', await getUnusedDevServerUrlAsync(), ...args],
    { env }
  );

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
      expect(result.stdout).toContain('device');
      expect(result.stdout).toContain('next');
      expect(result.stdout).toContain('expo-go');
    });

    it('reports every section in the JSON report', async () => {
      const report = await reportAsync('go-app');

      expect(Object.keys(report)).toEqual([
        'project',
        'expoGo',
        'freshness',
        'builds',
        'devServer',
        'device',
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

  // @ref llp/0004-smart-start-and-project-state.rfc.md §The EAS build lookup, and why it is opt-in
  //
  // Three states, and one cost. The cost is the design: a default run must not spawn `eas
  // build:list` at all, and a cached answer must not spawn it either. Both are pinned by counting
  // what crossed the process boundary, because a section that quietly grew a network call would
  // pass every assertion about its *answer*.
  describe('the EAS build lookup', () => {
    /** The per-platform hashes the stub prints, which is what an EAS build carries. */
    const IOS_HASH = 'aaaa1111bbbb2222cccc3333dddd4444eeee5555';
    const ANDROID_HASH = 'ffff6666eeee7777dddd8888cccc9999bbbb0000';
    const BUILD_ID = '21d7d434-6495-4e74-b8c7-68ecd0dff489';

    /** One finished build, in the shape the recorded `build:list` payload has. */
    const FINISHED_BUILD = {
      id: BUILD_ID,
      status: 'FINISHED',
      platform: 'IOS',
      buildProfile: 'simulator',
      createdAt: '2026-08-19T17:37:12.674Z',
      artifacts: { buildUrl: 'https://expo.dev/artifacts/eas/abc.tar.gz' },
    };

    /**
     * A `fingerprint` bin that answers a different hash per platform, the way the real one does.
     *
     * This is the fact the whole design turns on, and the fixture's own stub cannot show it: the
     * project hash covers both platforms and is not a hash any build carries. Live, on one working
     * tree: `031f6b0c…` for the project and `8ce1acfb…` for iOS [observed — apps/observe-tester,
     * 2026-08-26].
     */
    const STUB_FINGERPRINT = `#!/usr/bin/env node
'use strict';
const args = process.argv.slice(2);
const platform = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : null;
const hash = platform === 'ios'
  ? ${JSON.stringify(IOS_HASH)}
  : platform === 'android'
    ? ${JSON.stringify(ANDROID_HASH)}
    : (process.env.STUB_FINGERPRINT_HASH || ${JSON.stringify(FIXTURE_FINGERPRINT_HASH)});
process.stdout.write(JSON.stringify({ hash, sources: [] }) + '\\n');
`;

    /**
     * An `eas` bin answering both commands `status` may reach for, recording every invocation.
     *
     * - STUB_EAS_USER: the account `whoami` names (default `e2e-user`)
     * - STUB_EAS_BUILD_LIST: the JSON `build:list` prints (default `[]`, i.e. no build)
     * - STUB_EAS_BUILD_LIST_STDOUT / STUB_EAS_BUILD_LIST_EXIT: a refusal, on the stream the real
     *   CLI puts it on
     */
    const STUB_EAS = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(
  path.join(process.cwd(), ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args }) + '\\n'
);
if (args[0] === 'whoami') {
  process.stdout.write((process.env.STUB_EAS_USER || 'e2e-user') + '\\n');
  process.exit(0);
}
if (args[0] === 'build:list') {
  const exitCode = Number(process.env.STUB_EAS_BUILD_LIST_EXIT || 0);
  if (exitCode !== 0) {
    process.stdout.write((process.env.STUB_EAS_BUILD_LIST_STDOUT || 'refused') + '\\n');
    process.stderr.write('    Error: build:list command failed.\\n');
    process.exit(exitCode);
  }
  process.stdout.write((process.env.STUB_EAS_BUILD_LIST || '[]') + '\\n');
  process.exit(0);
}
process.stderr.write('stub eas: unexpected command ' + args[0] + '\\n');
process.exit(1);
`;

    /** Copy the fixture and install both stubs over the ones `setupAsync` put there. */
    async function setupWithEasAsync(fixture = 'dev-client-fresh-app'): Promise<string> {
      const projectRoot = await setupAsync(fixture);
      const binDir = path.join(projectRoot, '.stub-bin');
      await fs.promises.mkdir(binDir, { recursive: true });

      const fingerprintStub = path.join(binDir, 'fingerprint-platform-stub.js');
      await fs.promises.writeFile(fingerprintStub, STUB_FINGERPRINT);
      const easStub = path.join(binDir, 'eas-builds-stub.js');
      await fs.promises.writeFile(easStub, STUB_EAS);

      for (const dir of [binDir, path.join(projectRoot, 'node_modules', '.bin')]) {
        await installStubBinAsync(dir, 'fingerprint', fingerprintStub);
        await installStubBinAsync(dir, 'eas', easStub);
      }
      return projectRoot;
    }

    /** The commands the stub `eas` was asked for, in order. */
    function easCommands(projectRoot: string): string[] {
      const logPath = path.join(projectRoot, STUB_EAS_LOG_NAME);
      if (!fs.existsSync(logPath)) {
        return [];
      }
      return fs
        .readFileSync(logPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => (JSON.parse(line) as { args: string[] }).args[0]!);
    }

    function iosOf(report: StatusReport) {
      return report.builds!.platforms.find((platform) => platform.platform === 'ios')!;
    }

    it('reports both platforms as unknown by default, and never calls eas build:list', async () => {
      const projectRoot = await setupWithEasAsync();

      const report = await reportInAsync(projectRoot);

      expect(report.builds?.askedEas).toBe(false);
      expect(report.builds?.platforms.map((platform) => platform.state)).toEqual([
        'unknown',
        'unknown',
      ]);
      expect(iosOf(report).reason).toContain('--builds');
      // The auth section still asks `whoami`; the lookup asks nothing. That is the whole promise.
      expect(easCommands(projectRoot)).toEqual(['whoami']);
    });

    it('leaves the eas build line out of the human report of a default run', async () => {
      const projectRoot = await setupWithEasAsync();
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('eas build');
    });

    it('asks EAS about the per-platform fingerprint with --builds, and reports the hit', async () => {
      const projectRoot = await setupWithEasAsync();

      const report = await reportInAsync(projectRoot, ['--builds'], {
        STUB_EAS_BUILD_LIST: JSON.stringify([FINISHED_BUILD]),
      });

      expect(report.builds?.askedEas).toBe(true);
      expect(iosOf(report)).toMatchObject({
        state: 'found',
        source: 'eas',
        buildId: BUILD_ID,
        buildProfile: 'simulator',
        createdAt: '2026-08-19T17:37:12.674Z',
        buildUrl: 'https://expo.dev/artifacts/eas/abc.tar.gz',
        // The per-platform hash, not `freshness.hash`, which is the project's and is unchanged.
        fingerprintHash: IOS_HASH,
      });
      expect(report.freshness?.hash).toBe(FIXTURE_FINGERPRINT_HASH);
      expect(
        report.builds!.platforms.find((platform) => platform.platform === 'android')
          ?.fingerprintHash
      ).toBe(ANDROID_HASH);
    });

    it('pins the argv of the lookup that crossed the process boundary', async () => {
      const projectRoot = await setupWithEasAsync();
      await reportInAsync(projectRoot, ['--builds']);

      const invocations = fs
        .readFileSync(path.join(projectRoot, STUB_EAS_LOG_NAME), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => (JSON.parse(line) as { args: string[] }).args);

      expect(invocations).toContainEqual([
        'build:list',
        '--platform',
        'ios',
        '--fingerprint-hash',
        IOS_HASH,
        '--status',
        'finished',
        '--limit',
        '1',
        '--json',
        '--non-interactive',
      ]);
    });

    // The other half of the decision: a hit is written against the *project* fingerprint, so the
    // next run answers it for free. A cache that still spawned would be no cache at all.
    it('answers a second run from the cache, spawning no lookup at all', async () => {
      const projectRoot = await setupWithEasAsync();
      await reportInAsync(projectRoot, ['--builds'], {
        STUB_EAS_BUILD_LIST: JSON.stringify([FINISHED_BUILD]),
      });
      await fs.promises.rm(path.join(projectRoot, STUB_EAS_LOG_NAME));

      const report = await reportInAsync(projectRoot);

      expect(iosOf(report)).toMatchObject({ state: 'found', source: 'cache', buildId: BUILD_ID });
      expect(easCommands(projectRoot)).toEqual(['whoami']);
    });

    it('stops trusting the cached answer once the project fingerprint moves', async () => {
      const projectRoot = await setupWithEasAsync();
      await reportInAsync(projectRoot, ['--builds'], {
        STUB_EAS_BUILD_LIST: JSON.stringify([FINISHED_BUILD]),
      });

      const report = await reportInAsync(projectRoot, [], {
        STUB_FINGERPRINT_HASH: 'aaaabbbbccccddddeeeeffff0000111122223333',
      });

      expect(iosOf(report).state).toBe('unknown');
    });

    it('reports none when EAS answered and has no build for the fingerprint', async () => {
      const projectRoot = await setupWithEasAsync();

      const report = await reportInAsync(projectRoot, ['--builds']);

      expect(iosOf(report)).toMatchObject({
        state: 'none',
        source: 'eas',
        reason: expect.any(String),
      });
    });

    // The live case: `notesapp` has no EAS link, and the CLI refuses on stdout with exit 1.
    it('reports a project with no EAS link as unknown, and still exits 0', async () => {
      const projectRoot = await setupWithEasAsync();
      const result = await executeExagentAsync(
        projectRoot,
        ['status', '--json', '--builds', '--dev-server-url', await getUnusedDevServerUrlAsync()],
        {
          env: {
            STUB_EAS_BUILD_LIST_EXIT: '1',
            STUB_EAS_BUILD_LIST_STDOUT:
              'EAS project not configured. This command cannot configure it in non-interactive mode.',
          },
        }
      );

      expect(result.exitCode).toBe(0);
      const report: StatusReport = JSON.parse(result.stdout);
      expect(iosOf(report)).toMatchObject({
        state: 'unknown',
        reason:
          'EAS project not configured. This command cannot configure it in non-interactive mode.',
      });
      expect(report.errors).toEqual({});
    });

    // The auth section already answered this, so the lookup asks nobody a second time.
    it('reports a signed-out machine as unknown without calling eas build:list', async () => {
      const projectRoot = await setupWithEasAsync();
      await fs.promises.writeFile(
        path.join(projectRoot, '.stub-bin', 'eas-builds-stub.js'),
        `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
fs.appendFileSync(
  path.join(process.cwd(), ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args: process.argv.slice(2) }) + '\\n'
);
process.stderr.write('Not logged in\\n');
process.exit(1);
`
      );

      const report = await reportInAsync(projectRoot, ['--builds']);

      expect(report.auth?.loggedIn).toBe(false);
      expect(iosOf(report)).toMatchObject({ state: 'unknown' });
      expect(iosOf(report).reason).toContain('not signed in');
      expect(easCommands(projectRoot)).toEqual(['whoami']);
    });

    it('names the download command on the human line and in the follow-ups when the build is stale', async () => {
      const projectRoot = await setupWithEasAsync();
      const env = {
        STUB_EAS_BUILD_LIST: JSON.stringify([FINISHED_BUILD]),
        // The project's own recorded build no longer matches, so a rebuild was the alternative.
        STUB_FINGERPRINT_HASH: 'aaaabbbbccccddddeeeeffff0000111122223333',
      };
      const result = await executeExagentAsync(
        projectRoot,
        ['status', '--builds', '--dev-server-url', await getUnusedDevServerUrlAsync()],
        { env }
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('eas build');
      expect(result.stdout).toContain(`npx eas build:download --build-id ${BUILD_ID}`);

      const report = await reportInAsync(projectRoot, ['--builds'], env);
      expect(report.followups.map((followup) => followup.id)).toContain('status-cached-build');
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

  // @ref llp/0015-backend-selection-and-config.rfc.md §What `status` reports
  describe('where the next build would run', () => {
    it('says nothing about a build for a project whose next plan has none', async () => {
      const projectRoot = await setupAsync('go-app');
      const report = await reportInAsync(projectRoot);
      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);

      expect(report.next?.buildLocation).toBeNull();
      expect(result.stdout).not.toContain('build ');
    });

    it('names the place and the cause for a project that needs one', async () => {
      const report = await reportAsync('dev-client-app');

      expect(report.next?.buildLocation).not.toBeNull();
      expect(['local', 'eas']).toContain(report.next!.buildLocation!.runsOn);
      // Something chose it, and said so in a sentence every other surface prints too.
      expect(report.next!.buildLocation!.selection!.because).toBeTruthy();
    });

    it('reports the backend the project config asked for, in both outputs', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const file = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(file, 'utf8'));
      packageJson.expo = { ...packageJson.expo, exagent: { buildBackend: 'eas' } };
      await fs.promises.writeFile(file, JSON.stringify(packageJson, null, 2));

      const report = await reportInAsync(projectRoot);
      expect(report.next!.buildLocation).toMatchObject({
        runsOn: 'eas',
        selection: { source: 'config' },
      });

      const result = await executeExagentAsync(projectRoot, [
        'status',
        '--dev-server-url',
        await getUnusedDevServerUrlAsync(),
      ]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('build ');
      expect(result.stdout).toContain('"expo.exagent" in package.json');
    });

    // `status` exits 0 by contract, and a preference file it cannot read must not change that:
    // every other line of the report is still a fact worth having.
    it('still reports everything else when the config cannot be read', async () => {
      const projectRoot = await setupAsync('dev-client-app');
      const file = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(file, 'utf8'));
      packageJson.expo = { ...packageJson.expo, exagent: { buildBackend: 'cloud' } };
      await fs.promises.writeFile(file, JSON.stringify(packageJson, null, 2));

      const report = await reportInAsync(projectRoot);

      expect(report.project?.name).toBeTruthy();
      expect(report.next?.rule).toBe('dev-client-stale');
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
        hostType: null,
        tunnelUrl: null,
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
          hostType: null,
          tunnelUrl: null,
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
          hostType: null,
          tunnelUrl: null,
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
