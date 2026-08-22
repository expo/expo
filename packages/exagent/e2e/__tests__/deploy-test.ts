import { untar } from 'multitars';
import fs from 'node:fs';
/* eslint-env jest */
// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
//
// `exagent deploy` is orchestration: it resolves the tools, runs `expo export` and the EAS CLI as
// subprocesses, and hands the URLs back. These tests drive the published CLI against a stub `eas`
// installed next to the stub `expo` bin of the fixtures (`e2e/fixtures/README.md`), so the
// orchestration is asserted without an EAS account, a network, or a cloud build. The real `eas` is
// never invoked here.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import zlib from 'node:zlib';

import {
  executeExagentAsync,
  getTemporaryPath,
  installStubBinAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
  stubExpoEnv,
} from '../utils';

/** The shape `deploy --json` prints, per `src/deploy/types.ts`. */
type DeployReport = {
  projectRoot: string;
  targets: ('web' | 'native')[];
  web: { url: string | null; exportDir: string; outputTail: string } | null;
  native: {
    id: string;
    url: string;
    framework: string;
    expiresInHours: number;
    upload: { files: number; size: number };
  } | null;
  followups: { id: string; command: string; why: string }[];
};

/** One recorded invocation of the stub `eas` bin. */
type StubEasInvocation = { args: string[]; cwd: string; isTTY: boolean };

const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';

/** URL the stub prints, in the shape the EAS CLI writes it. */
const STUB_DEPLOYMENT_URL = 'https://go-app--e2e123.expo.app';

/**
 * Stub `eas` bin. It records every invocation and prints the URL line the real CLI ends on, which is
 * what the web deploy parses its result out of. Only `eas deploy` is stubbed: the native rail no
 * longer runs the EAS CLI at all.
 *
 * Environment variables the tests steer it with:
 * - STUB_EAS_EXIT_CODE: exit code to return (default 0), to test failure reporting
 * - STUB_EAS_NO_URL: `1` to print no URL at all, for the "URL could not be parsed" path
 */
const STUB_EAS = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const cwd = process.cwd();
fs.appendFileSync(
  path.join(cwd, ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args, cwd, isTTY: !!process.stdin.isTTY }) + '\\n'
);

const exitCode = Number(process.env.STUB_EAS_EXIT_CODE || 0);
if (exitCode !== 0) {
  process.stderr.write('Entity not authorized: the request was made without an account.\\n');
  process.exit(exitCode);
}

const quiet = process.env.STUB_EAS_NO_URL === '1';
if (args[0] === 'deploy') {
  process.stdout.write('Deploying to EAS Hosting\\n');
  if (!quiet) {
    process.stdout.write('Dashboard: https://expo.dev/projects/go-app/hosting/deployments\\n');
    process.stdout.write('Deployment URL: ${STUB_DEPLOYMENT_URL}\\n');
  }
}
process.exit(0);
`;

/**
 * Copy a fixture and install the stub `eas` bin into the `.stub-bin` directory that
 * `stubExpoEnv()` puts on `PATH`, so `eas` resolves to the stub the same way `expo` does.
 */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  // The stub is a Node script the shims run, not a bin itself: Windows can execute neither a
  // shebang script nor an extensionless file, so both shims are written (see
  // {@link installStubBinAsync}) exactly as npm installs a real `eas`.
  const stubScript = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(stubScript, STUB_EAS);
  await installStubBinAsync(binDir, 'eas', stubScript);
  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  return fs.promises.realpath(projectRoot);
}

/**
 * An environment whose `PATH` holds nothing, in every spelling the platform may read.
 *
 * This is the only way to test a missing EAS CLI on a machine that has one installed, and it has to
 * clear `Path` as well: on Windows a leftover spelling would still point at the real `eas`.
 */
function emptyPathEnv(emptyDir: string): Record<string, string> {
  return process.platform === 'win32' ? { PATH: emptyDir, Path: emptyDir } : { PATH: emptyDir };
}

/** What the stub Launch service answers with, standing in for launch.expo.dev. */
const STUB_LAUNCH_ID = 'launch-e2e-1';
const STUB_LAUNCH_URL = 'https://launch.expo.dev/l/e2e123';

/** One request the stub Launch service received. */
type LaunchRequest = {
  method: string;
  path: string;
  /** Header names lowercased, as node delivers them. */
  headers: Record<string, string | undefined>;
  /** The raw request body, i.e. the gzipped tarball. */
  body: Buffer;
};

/**
 * A stand-in for the Launch service, on localhost.
 *
 * The real service is never called from a test: `LAUNCH_HOST` points the upload here, so the
 * project source of whoever runs the suite never leaves the machine.
 */
async function startLaunchServerAsync({
  status = 200,
  body,
}: { status?: number; body?: unknown } = {}): Promise<{
  origin: string;
  requests: LaunchRequest[];
  closeAsync: () => Promise<void>;
}> {
  const requests: LaunchRequest[] = [];

  const server: Server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => {
      requests.push({
        method: request.method ?? '',
        path: request.url ?? '',
        headers: request.headers as Record<string, string | undefined>,
        body: Buffer.concat(chunks),
      });
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify(body ?? { id: STUB_LAUNCH_ID, url: STUB_LAUNCH_URL, framework: 'expo' })
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    origin: `http://127.0.0.1:${port}`,
    requests,
    closeAsync: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Write the state file `expo login` leaves behind, in a home directory of its own. */
async function writeExpoSessionAsync(sessionSecret: string): Promise<string> {
  const home = getTemporaryPath();
  await fs.promises.mkdir(home, { recursive: true });
  await fs.promises.writeFile(
    path.join(home, 'state.json'),
    JSON.stringify({ auth: { sessionSecret, userId: 'user-1', username: 'ada' } })
  );
  return home;
}

/**
 * Environment for a launch run: the stub service, and one credential.
 *
 * `EXPO_TOKEN` is always set, to empty when the test wants a session, because the machine running
 * the suite may have a real token exported and that must not decide the result of a test.
 */
function launchEnv(
  origin: string,
  { home, token = '' }: { home: string; token?: string }
): Record<string, string> {
  return {
    LAUNCH_HOST: origin,
    __UNSAFE_EXPO_HOME_DIRECTORY: home,
    EXPO_TOKEN: token,
  };
}

/** The entry names inside an uploaded gzipped tarball. */
async function readTarEntriesAsync(gzipped: Buffer): Promise<string[]> {
  const tarball = zlib.gunzipSync(gzipped);
  const names: string[] = [];
  for await (const entry of untar([new Uint8Array(tarball)])) {
    names.push(entry.name);
  }
  return names;
}

/** Every invocation of the stub `eas` bin recorded for a project. */
function readStubEasInvocations(projectRoot: string): StubEasInvocation[] {
  const logPath = path.join(projectRoot, STUB_EAS_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('exagent deploy', () => {
  describe('web', () => {
    it(`should export the web bundle, deploy it, and print one JSON object`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json']);
      const report: DeployReport = JSON.parse(result.stdout);

      // The export runs through the project's own Expo CLI, as a subprocess.
      expect(readStubExpoInvocations(projectRoot)).toEqual([
        { args: ['export', '--platform', 'web'], cwd: projectRoot },
      ]);
      // The upload runs non-interactively, because nothing can answer a prompt here.
      expect(readStubEasInvocations(projectRoot)).toEqual([
        { args: ['deploy', '--non-interactive'], cwd: projectRoot, isTTY: false },
      ]);
      // The top-level key set is the contract of the command (llp/0006 §Output contract).
      expect(Object.keys(report).sort()).toEqual([
        'followups',
        'native',
        'projectRoot',
        'targets',
        'web',
      ]);
      expect(report).toMatchObject({
        projectRoot,
        targets: ['web'],
        native: null,
        web: { url: STUB_DEPLOYMENT_URL, exportDir: 'dist' },
      });
      expect(report.web!.outputTail).toContain(STUB_DEPLOYMENT_URL);
      expect(report.followups.map((followup) => followup.id)).toEqual([
        'open-deployment',
        'eas-deploy-prod',
      ]);
    });

    it(`should deploy the web app of a project that has one, without a target flag`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy']);

      expect(readStubEasInvocations(projectRoot)[0]!.args).toEqual(['deploy', '--non-interactive']);
      expect(result.stdout).toContain(STUB_DEPLOYMENT_URL);
      expect(result.stdout).toContain('Next:');
    });

    it(`should report a deployment whose URL is not in the output`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web', '--json'], {
        env: { STUB_EAS_NO_URL: '1' },
      });
      const report: DeployReport = JSON.parse(result.stdout);

      // A URL the parser missed is not a failed deploy: the tail carries what the tool said.
      expect(report.web).toMatchObject({ url: null });
      expect(report.web!.outputTail).toContain('Deploying to EAS Hosting');
      expect(report.followups.map((followup) => followup.id)).toEqual(['eas-deploy-prod']);
    });

    it(`should ask for a target when the project has no web app`, async () => {
      const projectRoot = await setupAsync('dev-client-app');

      const result = await executeExagentAsync(projectRoot, ['deploy'], { reject: false });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No deploy target');
      // Errors are prompts (llp/0006): the last line is what an agent runs next.
      expect(result.stderr).toContain('Try: npx exagent deploy --native');
      // Nothing was spent before the question was asked.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
      expect(readStubEasInvocations(projectRoot)).toEqual([]);
    });

    it(`should report a failing eas without hiding its exit code`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
        env: { STUB_EAS_EXIT_CODE: '7' },
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('exited with code 7');
      expect(result.stderr).toContain('Try: npx eas-cli whoami');
    });

    it(`should name the install command when no eas is available`, async () => {
      const projectRoot = await setupAsync('go-app');
      // A PATH with nothing on it: the only way to test a missing EAS CLI on a machine that has
      // one installed.
      const emptyDir = getTemporaryPath();
      await fs.promises.mkdir(emptyDir, { recursive: true });

      const result = await executeExagentAsync(projectRoot, ['deploy', '--web'], {
        env: emptyPathEnv(emptyDir),
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('EAS CLI is not available');
      expect(result.stderr).toContain('Try: npm install -g eas-cli');
      // The export costs minutes, so the missing tool is found before it runs.
      expect(readStubExpoInvocations(projectRoot)).toEqual([]);
    });
  });

  describe('native — launch.expo.dev', () => {
    it(`should upload the project source as the signed in user and hand back the URL`, async () => {
      const projectRoot = await setupAsync('go-app');
      const home = await writeExpoSessionAsync('session-secret-value');
      const server = await startLaunchServerAsync();

      try {
        const result = await executeExagentAsync(projectRoot, ['deploy', '--native', '--json'], {
          env: launchEnv(server.origin, { home }),
        });
        const report: DeployReport = JSON.parse(result.stdout);

        // One request, to the endpoint of the reference implementation, as this user.
        expect(server.requests).toHaveLength(1);
        const [request] = server.requests;
        expect(request!.method).toBe('POST');
        expect(request!.path).toBe('/--/v1/launch/cli');
        expect(request!.headers['content-type']).toBe('application/gzip');
        expect(request!.headers['expo-session']).toBe('session-secret-value');
        expect(request!.headers['authorization']).toBeUndefined();
        expect(request!.headers['user-agent']).toMatch(/^exagent\//);
        // A single app upload has no path inside the tarball to point at.
        expect(request!.headers['x-project-root']).toBeUndefined();

        // The body is a gzip stream, and it holds the project under `project/`.
        expect([...request!.body.subarray(0, 2)]).toEqual([0x1f, 0x8b]);
        const entries = await readTarEntriesAsync(request!.body);
        expect(entries).toContain('project/package.json');
        expect(entries).toContain('project/app.json');
        // What the upload leaves out is what keeps a project under the size limit.
        expect(entries.some((entry) => entry.includes('node_modules'))).toBe(false);

        // The top-level key set is the contract of the command (llp/0006 §Output contract).
        expect(Object.keys(report).sort()).toEqual([
          'followups',
          'native',
          'projectRoot',
          'targets',
          'web',
        ]);
        expect(Object.keys(report.native!).sort()).toEqual([
          'expiresInHours',
          'framework',
          'id',
          'upload',
          'url',
        ]);
        expect(report).toMatchObject({
          targets: ['native'],
          web: null,
          native: { id: STUB_LAUNCH_ID, url: STUB_LAUNCH_URL, framework: 'expo' },
        });
        expect(report.native!.upload.files).toBeGreaterThan(0);
        // Opening the URL is the next action, and the only one.
        expect(report.followups.map((followup) => followup.id)).toEqual(['open-launch-url']);
        expect(report.followups[0]!.command).toBe(STUB_LAUNCH_URL);
        // Nothing was exported or uploaded to EAS Hosting: that is the other rail.
        expect(readStubExpoInvocations(projectRoot)).toEqual([]);
        expect(readStubEasInvocations(projectRoot)).toEqual([]);
      } finally {
        await server.closeAsync();
      }
    });

    it(`should print the launch URL as the step it is`, async () => {
      const projectRoot = await setupAsync('go-app');
      const home = await writeExpoSessionAsync('session-secret-value');
      const server = await startLaunchServerAsync();

      try {
        const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
          env: launchEnv(server.origin, { home }),
        });

        expect(result.stdout).toContain('Open this to finish the launch:');
        expect(result.stdout).toContain(STUB_LAUNCH_URL);
        expect(result.stdout).toContain('expires in 8 hours');
        expect(result.stdout).toContain('Next:');
      } finally {
        await server.closeAsync();
      }
    });

    it(`should authenticate with EXPO_TOKEN when one is set`, async () => {
      const projectRoot = await setupAsync('go-app');
      // A token belongs to a machine that cannot sign in, and it wins over a stored session.
      const home = await writeExpoSessionAsync('session-secret-value');
      const server = await startLaunchServerAsync();

      try {
        await executeExagentAsync(projectRoot, ['deploy', '--native'], {
          env: launchEnv(server.origin, { home, token: 'token-value' }),
        });

        expect(server.requests[0]!.headers['authorization']).toBe('Bearer token-value');
        expect(server.requests[0]!.headers['expo-session']).toBeUndefined();
      } finally {
        await server.closeAsync();
      }
    });

    it(`should upload a whole monorepo and name the app inside it`, async () => {
      const projectRoot = await setupAsync('go-app');
      const workspaceRoot = path.dirname(projectRoot);
      const appDirectory = path.basename(projectRoot);
      const home = await writeExpoSessionAsync('session-secret-value');
      const server = await startLaunchServerAsync();

      try {
        const result = await executeExagentAsync(
          projectRoot,
          ['deploy', '--native', '--upload-root', workspaceRoot, '--json'],
          { env: launchEnv(server.origin, { home }) }
        );

        expect(JSON.parse(result.stdout).native.url).toBe(STUB_LAUNCH_URL);
        // The service unpacks `project/` and looks for the app at this path inside it.
        expect(server.requests[0]!.headers['x-project-root']).toBe(appDirectory);
        const entries = await readTarEntriesAsync(server.requests[0]!.body);
        expect(entries).toContain(`project/${appDirectory}/package.json`);
      } finally {
        await server.closeAsync();
      }
    });

    it(`should answer a machine that is not signed in with the login command`, async () => {
      const projectRoot = await setupAsync('go-app');
      // An Expo home with no state file at all: nobody is logged in here.
      const home = getTemporaryPath();
      await fs.promises.mkdir(home, { recursive: true });
      const server = await startLaunchServerAsync();

      try {
        const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
          env: launchEnv(server.origin, { home }),
          reject: false,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('not signed in');
        expect(result.stderr).toContain('EXPO_TOKEN');
        // Errors are prompts (llp/0006): the last line is what an agent runs next.
        expect(result.stderr).toContain('Try: npx expo login');
        // Nothing was uploaded before the credential was checked.
        expect(server.requests).toEqual([]);
      } finally {
        await server.closeAsync();
      }
    });

    it(`should report what the service refused`, async () => {
      const projectRoot = await setupAsync('go-app');
      const home = await writeExpoSessionAsync('session-secret-value');
      const server = await startLaunchServerAsync({
        status: 422,
        body: { message: 'No supported framework was found' },
      });

      try {
        const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
          env: launchEnv(server.origin, { home }),
          reject: false,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No supported framework was found');
        expect(result.stderr).toContain('Try: npx exagent deploy --native');
      } finally {
        await server.closeAsync();
      }
    });

    it(`should answer a rejected credential with the login command`, async () => {
      const projectRoot = await setupAsync('go-app');
      const home = await writeExpoSessionAsync('stale-secret');
      const server = await startLaunchServerAsync({
        status: 401,
        body: { message: 'Unauthorized' },
      });

      try {
        const result = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
          env: launchEnv(server.origin, { home }),
          reject: false,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Try: npx expo login');
      } finally {
        await server.closeAsync();
      }
    });

    it(`should explain that the retired build flags are gone`, async () => {
      const projectRoot = await setupAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['deploy', '--platform', 'ios'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('launch.expo.dev');
      expect(result.stderr).toContain('Try: npx exagent deploy --native');
    });
  });

  it(`should deploy both targets in one run`, async () => {
    const projectRoot = await setupAsync('go-app');
    const home = await writeExpoSessionAsync('session-secret-value');
    const server = await startLaunchServerAsync();

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['deploy', '--web', '--native', '--json'],
        { env: launchEnv(server.origin, { home }) }
      );
      const report: DeployReport = JSON.parse(result.stdout);

      expect(report.targets).toEqual(['web', 'native']);
      expect(readStubEasInvocations(projectRoot).map((invocation) => invocation.args[0])).toEqual([
        'deploy',
      ]);
      expect(report.web!.url).toBe(STUB_DEPLOYMENT_URL);
      expect(report.native!.url).toBe(STUB_LAUNCH_URL);
      // The launch is the unfinished half, so it is named first.
      expect(report.followups.map((followup) => followup.id)).toEqual([
        'open-launch-url',
        'open-deployment',
        'eas-deploy-prod',
      ]);
    } finally {
      await server.closeAsync();
    }
  });

  it(`should run with no TTY on any stream`, async () => {
    // The e2e runner attaches no stdin (see `spawnExagent`), which is the shape an agent runs the
    // CLI in: `--non-interactive` plus no stdin means a prompt fails instead of hanging, and the
    // launch upload never prompts at all.
    const projectRoot = await setupAsync('go-app');
    const home = await writeExpoSessionAsync('session-secret-value');
    const server = await startLaunchServerAsync();

    try {
      await executeExagentAsync(projectRoot, ['deploy', '--web'], {
        env: stubExpoEnv(projectRoot),
      });
      expect(readStubEasInvocations(projectRoot)[0]!.isTTY).toBe(false);

      const launched = await executeExagentAsync(projectRoot, ['deploy', '--native'], {
        env: launchEnv(server.origin, { home }),
      });
      expect(launched.exitCode).toBe(0);
    } finally {
      await server.closeAsync();
    }
  });
});
