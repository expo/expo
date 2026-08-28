import { vol } from 'memfs';
import path from 'path';

import { EXIT_NEEDS_HUMAN } from '../../exitCodes';
import { CommandError } from '../../utils/errors';
import * as subprocess from '../../utils/subprocess';
import { buildCreateLaunchArgs, resolveCreateLaunchCli, runCreateLaunchAsync } from '../launchCli';

const projectRoot = '/project';
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

/** Answer the one subprocess run of a launch. */
function mockRun(result: Partial<subprocess.SubprocessResult>) {
  return jest
    .spyOn(subprocess, 'spawnSubprocessAsync')
    .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '', ...result });
}

beforeEach(() => {
  mockPlatform('darwin');
});

afterEach(() => {
  mockPlatform(realPlatform);
  jest.restoreAllMocks();
  vol.reset();
});

describe(buildCreateLaunchArgs, () => {
  it(`should always ask for the machine-readable output`, () => {
    // `--json` is what makes the run non-interactive: it answers the confirmation itself and
    // prints the launch as one JSON object.
    expect(buildCreateLaunchArgs({})).toEqual(['--json']);
  });

  it(`should name the app inside the uploaded directory`, () => {
    expect(buildCreateLaunchArgs({ projectPath: 'apps/mobile' })).toEqual([
      '--json',
      '--project',
      'apps/mobile',
    ]);
  });
});

describe(resolveCreateLaunchCli, () => {
  it(`should prefer the create-launch installed in the project`, () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/.bin/create-launch`]: '#!/bin/sh',
      '/usr/local/bin/create-launch': '#!/bin/sh',
    });

    expect(resolveCreateLaunchCli(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join(projectRoot, 'node_modules', '.bin', 'create-launch'),
      args: [],
    });
  });

  it(`should use the .cmd shim of the project on Windows`, () => {
    mockPlatform('win32');
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/create-launch.cmd`]: '' });

    expect(resolveCreateLaunchCli(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join(projectRoot, 'node_modules', '.bin', 'create-launch.cmd'),
      args: [],
    });
  });

  // F113: the project's copy in an npm workspace is at the workspace root, and it must still beat
  // the machine's own — a repository that pins a version pins it for its packages too.
  it(`should prefer a create-launch an npm workspace hoisted above the project, over PATH`, () => {
    const workspace = path.resolve('/workspace');
    const app = path.join(workspace, 'apps', 'mobile');
    const hoisted = path.join(workspace, 'node_modules', '.bin', 'create-launch');
    vol.fromJSON({ [hoisted]: '#!/bin/sh', '/usr/local/bin/create-launch': '#!/bin/sh' });

    expect(resolveCreateLaunchCli(app, { pathEnv: '/usr/local/bin' })).toEqual({
      command: hoisted,
      args: [],
    });
  });

  it(`should fall back to a create-launch on PATH`, () => {
    vol.fromJSON({ '/usr/local/bin/create-launch': '#!/bin/sh' });

    expect(resolveCreateLaunchCli(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join('/usr/local/bin', 'create-launch'),
      args: [],
    });
  });

  it(`should fall back to the registry, so no install step is needed`, () => {
    expect(resolveCreateLaunchCli(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: expect.stringMatching(/^npx(\.cmd)?$/),
      args: ['create-launch@latest'],
    });
  });
});

describe(runCreateLaunchAsync, () => {
  const cli = { command: 'create-launch', args: [] };
  const launch = { id: 'launch-1', url: 'https://launch.expo.dev/l/abc', framework: 'expo' };

  it(`should run the CLI in the uploaded directory and return the launch`, async () => {
    const run = mockRun({ stdout: `${JSON.stringify(launch)}\n` });

    await expect(
      runCreateLaunchAsync({ cli, uploadRoot: '/workspace', json: true })
    ).resolves.toEqual(launch);

    // The upload is whatever the CLI is run in, so the working directory is the whole contract.
    expect(run).toHaveBeenCalledWith(
      'create-launch',
      ['--json'],
      expect.objectContaining({ cwd: '/workspace', output: 'capture' })
    );
  });

  it(`should pass the app path through and keep progress on the terminal in text mode`, async () => {
    const run = mockRun({ stdout: JSON.stringify(launch) });

    await runCreateLaunchAsync({
      cli,
      uploadRoot: '/workspace',
      projectPath: 'apps/mobile',
      json: false,
    });

    expect(run).toHaveBeenCalledWith(
      'create-launch',
      ['--json', '--project', 'apps/mobile'],
      expect.objectContaining({ output: 'capture-stdout' })
    );
  });

  it(`should read the launch from the last line of output`, async () => {
    // A debug line before the payload must not break the parse.
    mockRun({ stdout: `Reading project…\n${JSON.stringify(launch)}\n` });

    await expect(
      runCreateLaunchAsync({ cli, uploadRoot: '/workspace', json: true })
    ).resolves.toEqual(launch);
  });

  it(`should report output that is not a launch`, async () => {
    mockRun({ stdout: 'all done!\n' });

    await expect(
      runCreateLaunchAsync({ cli, uploadRoot: '/workspace', json: true })
    ).rejects.toMatchObject({ code: 'LAUNCH_UNEXPECTED_OUTPUT' });
  });

  // A login is not something the CLI can retry: it needs the person this run belongs to
  // (llp/0010 §Needs-human protocol). The code stays the one this site has always raised.
  it(`should map the non-interactive auth failure onto the login handoff`, async () => {
    // What the real CLI prints when nobody is signed in and it cannot prompt.
    mockRun({
      exitCode: 1,
      stderr: 'You need to be authenticated with Expo before launching in non-interactive\n',
    });

    expect.assertions(5);
    try {
      await runCreateLaunchAsync({ cli, uploadRoot: '/workspace', json: true });
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('LAUNCH_NOT_AUTHENTICATED');
      expect(error.suggestedCommand).toBe('npx expo login');
      expect(error.exitCode).toBe(EXIT_NEEDS_HUMAN);
      expect(error.needsHuman).toEqual({
        scenario: 'expo-login',
        need: 'Sign in to an Expo account on this machine.',
        command: 'npx expo login',
        url: 'https://expo.dev/settings/access-tokens',
        unattendedEnv: ['EXPO_TOKEN'],
        resumable: true,
        detectedBy: 'exit-signature',
      });
    }
  });

  it(`should carry any other failure through with what the CLI said`, async () => {
    mockRun({ exitCode: 1, stderr: 'Launch has a project size limit of 500 MB\n' });

    await expect(
      runCreateLaunchAsync({ cli, uploadRoot: '/workspace', json: true })
    ).rejects.toMatchObject({
      code: 'LAUNCH_FAILED',
      message: expect.stringContaining('project size limit of 500 MB'),
    });
  });

  it(`should report a CLI that could not be started at all`, async () => {
    const enoent = Object.assign(new Error('spawn npx ENOENT'), { code: 'ENOENT' });
    mockRun({ exitCode: null, spawnError: enoent });

    await expect(
      runCreateLaunchAsync({ cli, uploadRoot: '/workspace', json: true })
    ).rejects.toMatchObject({
      code: 'CREATE_LAUNCH_UNAVAILABLE',
      suggestedCommand: 'npm install -g create-launch',
    });
  });
});
