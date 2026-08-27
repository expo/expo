import { vol } from 'memfs';
import path from 'path';

import {
  easCliArgs,
  easCliLabel,
  resolveEasCli,
  resolveEasCliAsync,
  resolveEasCliOrThrow,
  resolveInstalledEasCli,
} from '../easCli';
import { CommandError } from '../errors';
import { resetInvokerCache } from '../invoker';
import { resetPackageRunnerCache } from '../packageRunner';
import { spawnSubprocessAsync } from '../subprocess';

jest.mock('../subprocess', () => ({
  ...jest.requireActual('../subprocess'),
  spawnSubprocessAsync: jest.fn(),
}));

const projectRoot = '/project';
const realPlatform = process.platform;

/** A `PATH` with a package runner on it but no `eas`, which is the machine wave 18 is about. */
const PATH_WITH_RUNNER = '/usr/local/bin';

/** Environments captured live, the same two `packageRunner-test.ts` pins. */
const NPX_ENV = {
  npm_config_user_agent: 'npm/11.17.0 node/v26.5.0 darwin arm64 workspaces/false',
  npm_execpath: '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js',
};
const BUNX_ENV = {
  npm_config_user_agent: 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64',
  npm_execpath: '/opt/homebrew/Cellar/bun/1.3.14/bin/bun',
};

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

/** What a spawn of `eas --version` answered, for the rung that probes the `PATH` candidate. */
function answers({ exitCode, stdout = '', stderr = '' }: { exitCode: number | null; stdout?: string; stderr?: string }) {
  jest.mocked(spawnSubprocessAsync).mockResolvedValue({
    exitCode,
    stdout,
    stderr,
    spawnError: undefined,
    timedOut: false,
  } as any);
}

beforeEach(() => {
  // A fixed platform for every test but the Windows one: the resolver picks the bin *name* from
  // it, so the tests would otherwise install a bin the resolver on Windows never looks for.
  mockPlatform('darwin');
  resetInvokerCache();
  resetPackageRunnerCache();
  jest.mocked(spawnSubprocessAsync).mockReset();
});

afterEach(() => {
  mockPlatform(realPlatform);
  vol.reset();
});

describe(resolveEasCliOrThrow, () => {
  it(`should prefer the eas-cli installed in the project`, () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/.bin/eas`]: '#!/bin/sh',
      '/usr/local/bin/eas': '#!/bin/sh',
    });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER })).toEqual({
      command: path.join(projectRoot, 'node_modules', '.bin', 'eas'),
      prefixArgs: [],
      source: 'project',
    });
  });

  it(`should prefer the .cmd shim of the project on Windows`, () => {
    mockPlatform('win32');
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/eas.cmd`]: '' });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER })).toEqual({
      command: path.join(projectRoot, 'node_modules', '.bin', 'eas.cmd'),
      prefixArgs: [],
      source: 'project',
    });
  });

  it(`should fall back to the eas on PATH`, () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh' });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER })).toEqual({
      command: path.join('/usr/local/bin', 'eas'),
      prefixArgs: [],
      source: 'path',
    });
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
  // The rung wave 18 added, and the reason it exists: an installed `eas-cli` is not a thing this
  // CLI may expect [confirmed — Kudo, 2026-08-26].
  it(`should run the published eas-cli through npx when nothing is installed`, () => {
    vol.fromJSON({ '/usr/local/bin/npx': '#!/bin/sh' });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })).toEqual({
      command: 'npx',
      prefixArgs: ['--yes', 'eas-cli@latest'],
      source: 'runner',
      runner: 'npx',
    });
  });

  it(`should run it through bunx in a project whose lockfile is bun's`, () => {
    vol.fromJSON({
      [`${projectRoot}/bun.lock`]: '',
      '/usr/local/bin/npx': '#!/bin/sh',
      '/usr/local/bin/bunx': '#!/bin/sh',
    });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })).toEqual({
      command: path.join('/usr/local/bin', 'bunx'),
      prefixArgs: ['eas-cli@latest'],
      source: 'runner',
      runner: 'bunx',
    });
  });

  it(`should run it through bunx when bunx started this process, whatever the lockfile says`, () => {
    vol.fromJSON({
      [`${projectRoot}/package-lock.json`]: '',
      '/usr/local/bin/npx': '#!/bin/sh',
      '/usr/local/bin/bunx': '#!/bin/sh',
    });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: BUNX_ENV })).toEqual({
      command: path.join('/usr/local/bin', 'bunx'),
      prefixArgs: ['eas-cli@latest'],
      source: 'runner',
      runner: 'bunx',
    });
  });

  it(`should keep npx for a bun project on a machine where bunx is not reachable`, () => {
    vol.fromJSON({ [`${projectRoot}/bun.lockb`]: '', '/usr/local/bin/npx': '#!/bin/sh' });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })).toEqual({
      command: 'npx',
      prefixArgs: ['--yes', 'eas-cli@latest'],
      source: 'runner',
      runner: 'npx',
    });
  });

  it(`should read the lockfile of the workspace root a package sits in`, () => {
    vol.fromJSON({
      '/monorepo/bun.lock': '',
      '/monorepo/apps/app/package.json': '{}',
      '/usr/local/bin/npx': '#!/bin/sh',
      '/usr/local/bin/bunx': '#!/bin/sh',
    });

    expect(
      resolveEasCliOrThrow('/monorepo/apps/app', { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })
    ).toMatchObject({ runner: 'bunx' });
  });

  it(`should throw a prompt the agent can act on only when even a package runner is missing`, () => {
    // Errors are prompts (llp/0006). The install line is no longer `npm install -g eas-cli`: the
    // resolver would have run the published CLI itself if anything on this machine could.
    expect.assertions(5);
    try {
      resolveEasCliOrThrow(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV });
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('EAS_CLI_MISSING');
      expect(error.message).toContain('no package runner');
      expect(error.message).not.toContain('npm install -g eas-cli');
      expect(error.suggestedCommand).toBe('npm install --save-dev eas-cli');
    }
  });
});

describe(resolveInstalledEasCli, () => {
  // The rung-limited resolver, for the one caller that must not pay a download: reading a session
  // file is not worth one, and the rungs under it answer the same question for free.
  it(`should answer null rather than a runner when nothing is installed`, () => {
    vol.fromJSON({ '/usr/local/bin/npx': '#!/bin/sh' });

    expect(resolveInstalledEasCli(projectRoot, { pathEnv: PATH_WITH_RUNNER })).toBeNull();
  });

  it(`should still find the eas on PATH`, () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh' });

    expect(resolveInstalledEasCli(projectRoot, { pathEnv: PATH_WITH_RUNNER })).toEqual({
      command: path.join('/usr/local/bin', 'eas'),
      prefixArgs: [],
      source: 'path',
    });
  });
});

describe(resolveEasCliAsync, () => {
  // @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — what answers the name `eas` on a
  // machine may be a wrapper, a shim or a stale link. The probe was per call site; it is the
  // ladder's now, so the rung *below* it is what a shim falls through to.
  it(`should skip an eas on PATH that is not the EAS CLI and use the runner instead`, async () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh', '/usr/local/bin/npx': '#!/bin/sh' });
    answers({ exitCode: 101, stderr: `thread 'main' panicked at src/main.rs:41:9:\nStack backtrace:` });

    await expect(
      resolveEasCliAsync(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })
    ).resolves.toEqual({
      command: 'npx',
      prefixArgs: ['--yes', 'eas-cli@latest'],
      source: 'runner',
      runner: 'npx',
    });
  });

  it(`should keep an eas on PATH that answers the way the CLI does`, async () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh', '/usr/local/bin/npx': '#!/bin/sh' });
    answers({ exitCode: 0, stdout: 'eas-cli/22.5.0 darwin-arm64 node-v24.3.0' });

    await expect(
      resolveEasCliAsync(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })
    ).resolves.toEqual({
      command: path.join('/usr/local/bin', 'eas'),
      prefixArgs: [],
      source: 'path',
    });
  });

  it(`should never probe the project's own bin, which holds only what was installed into it`, async () => {
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/eas`]: '#!/bin/sh' });

    await expect(
      resolveEasCliAsync(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })
    ).resolves.toMatchObject({ source: 'project' });
    expect(spawnSubprocessAsync).not.toHaveBeenCalled();
  });
});

describe(easCliLabel, () => {
  it(`should name a resolved binary by its path and a runner by the line a reader can paste`, () => {
    expect(easCliLabel({ command: '/project/node_modules/.bin/eas', prefixArgs: [], source: 'project' })).toBe(
      '/project/node_modules/.bin/eas'
    );
    expect(
      easCliLabel({
        command: '/usr/local/bin/npx',
        prefixArgs: ['--yes', 'eas-cli@latest'],
        source: 'runner',
        runner: 'npx',
      })
    ).toBe('npx --yes eas-cli@latest');
    expect(
      easCliLabel({
        command: '/opt/homebrew/bin/bunx',
        prefixArgs: ['eas-cli@latest'],
        source: 'runner',
        runner: 'bunx',
      })
    ).toBe('bunx eas-cli@latest');
  });
});

describe(easCliArgs, () => {
  it(`should put the package name before the eas command word`, () => {
    expect(
      easCliArgs(
        { command: 'npx', prefixArgs: ['--yes', 'eas-cli@latest'], source: 'runner', runner: 'npx' },
        ['build:list', '--json']
      )
    ).toEqual(['--yes', 'eas-cli@latest', 'build:list', '--json']);
    expect(easCliArgs({ command: '/bin/eas', prefixArgs: [], source: 'path' }, ['whoami'])).toEqual([
      'whoami',
    ]);
  });
});

describe(resolveEasCli, () => {
  it(`should answer null when there is no eas and no runner to download one`, () => {
    expect(resolveEasCli(projectRoot, { pathEnv: PATH_WITH_RUNNER, env: NPX_ENV })).toBeNull();
  });
});
