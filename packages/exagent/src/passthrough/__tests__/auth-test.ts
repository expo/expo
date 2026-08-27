import { vol } from 'memfs';
import path from 'path';

import { exagentPassthrough } from '..';
import { AUTH_COMMANDS, authCliLabel, resolveAuthCliAsync, resolveRegisterCli } from '../auth';
import * as Log from '../../log';
import * as subprocess from '../../utils/subprocess';
import { runExpoAsync } from '../../utils/expoCli';
import { runInheritedAsync } from '../../utils/inheritedRun';
import { resetPackageRunnerCache } from '../../utils/packageRunner';

jest.mock('../../log');
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../../utils/inheritedRun', () => ({ runInheritedAsync: jest.fn() }));

const projectRoot = path.resolve('/project');
const expoBin = path.join(projectRoot, 'node_modules', '.bin', 'expo');
const easBin = path.join(projectRoot, 'node_modules', '.bin', 'eas');
const pathDir = path.resolve('/usr/local/bin');
const pathEas = path.join(pathDir, 'eas');

/** Answer the one `eas --version` probe the PATH candidate gets. */
function mockProbe(result: Partial<subprocess.SubprocessResult>) {
  return jest
    .spyOn(subprocess, 'spawnSubprocessAsync')
    .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '', ...result });
}

beforeEach(() => {
  vol.reset();
  // The runner is resolved once per process, so a test that resolved it must not decide for the
  // next one.
  resetPackageRunnerCache();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe(resolveAuthCliAsync, () => {
  it(`should use the project's own expo CLI when it has one`, async () => {
    vol.fromJSON({ [expoBin]: '#!/bin/sh' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toEqual({
      tool: 'expo',
      source: 'project-expo',
      command: expoBin,
      prefixArgs: [],
    });
  });

  // The whole point: a directory with no expo package used to reach for `npx expo`, which
  // downloads the entire SDK to read a file the EAS CLI can read now.
  it(`should ask the EAS CLI through the package runner when there is no expo`, async () => {
    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toEqual({
      tool: 'eas',
      source: 'runner-eas',
      command: 'npx',
      // `--yes` because npx prompts before installing a package it has not seen, and this CLI never
      // attaches stdin, so the prompt would be a hang (`src/utils/easCli.ts`).
      prefixArgs: ['--yes', 'eas-cli@latest'],
      runner: 'npx',
    });
  });

  // The pin, still winning — through the runner rather than around it. `npx --yes eas-cli` runs the
  // project's own copy and touches no network [observed — live, 2026-08-27], so declaring the CLI is
  // what a project does to control its version, and it no longer needs a rung of its own.
  it(`should drop the version from the spec when the project declares eas-cli`, async () => {
    vol.fromJSON({
      [path.join(projectRoot, 'package.json')]: JSON.stringify({
        devDependencies: { 'eas-cli': '22.4.0' },
      }),
    });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toMatchObject({
      source: 'runner-eas',
      prefixArgs: ['--yes', 'eas-cli'],
    });
  });

  it(`should prefer the project's expo over the EAS CLI`, async () => {
    vol.fromJSON({ [expoBin]: '#!/bin/sh', [easBin]: '#!/bin/sh' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toMatchObject({
      tool: 'expo',
    });
  });

  // The machine this was built on has an `eas` on `PATH` that is a wrapper panicking before it
  // reaches the CLI, and handing an interactive login to it printed a backtrace. There used to be a
  // `--version` probe here to catch that. There is no candidate to probe any more: a runner resolves
  // a package, so no file called `eas` is a thing this chain can pick.
  it(`should never pick a file called eas, and never probe one`, async () => {
    vol.fromJSON({ [easBin]: '#!/bin/sh', [pathEas]: '#!/bin/sh' });
    const probe = mockProbe({ exitCode: 0 });

    const cli = await resolveAuthCliAsync(projectRoot, { pathEnv: pathDir });

    expect(cli).toMatchObject({ source: 'runner-eas', command: 'npx' });
    expect(cli.command).not.toBe(pathEas);
    expect(probe).not.toHaveBeenCalled();
  });
});

describe(resolveRegisterCli, () => {
  it(`should use the project's own expo CLI when it has one`, () => {
    vol.fromJSON({ [expoBin]: '#!/bin/sh' });

    expect(resolveRegisterCli(projectRoot, { pathEnv: '' })).toEqual({
      tool: 'expo',
      source: 'project-expo',
      command: expoBin,
      prefixArgs: [],
    });
  });

  // `eas register` does not exist [observed — eas-cli 22.5.0], so the chain the other three fall
  // down does not exist for this one. `npx expo register` is the only thing that can create an
  // account, and the SDK download it costs is paid once per person rather than once per run.
  it(`should fall back to the expo package runner, not to any eas`, () => {
    vol.fromJSON({ [easBin]: '#!/bin/sh', [pathEas]: '#!/bin/sh' });

    expect(resolveRegisterCli(projectRoot, { pathEnv: pathDir })).toEqual({
      tool: 'expo',
      source: 'runner-expo',
      command: 'npx',
      prefixArgs: ['expo'],
      runner: 'npx',
    });
  });

  // The other three would have taken the project's eas here. register does not, because it cannot.
  it(`should ignore an eas the other auth commands would have used`, async () => {
    vol.fromJSON({ [easBin]: '#!/bin/sh' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toMatchObject({
      source: 'runner-eas',
    });
    expect(resolveRegisterCli(projectRoot, { pathEnv: '' })).toMatchObject({
      source: 'runner-expo',
    });
  });
});

describe(`register passthrough`, () => {
  // Never a real signup: the stub records the invocation and exits.
  it(`should spawn the expo CLI with register, and say so on stderr`, async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(path.resolve('/elsewhere'));
    jest.mocked(runInheritedAsync).mockResolvedValue(0);

    await exagentPassthrough('register')([]);

    expect(runInheritedAsync).toHaveBeenCalledWith('npx', ['expo', 'register'], expect.anything());
    expect(jest.mocked(Log.error).mock.calls.join('\n')).toContain('npx expo');
  });

  it(`should keep stdio inherited, because signup is interactive`, async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(path.resolve('/elsewhere'));
    jest.mocked(runInheritedAsync).mockResolvedValue(0);

    await exagentPassthrough('register')([]);

    // `runInheritedAsync` is the inherited-stdio spawn: using it at all is the assertion.
    expect(runExpoAsync).not.toHaveBeenCalled();
  });
});

describe(`AUTH_COMMANDS`, () => {
  it(`should be the four auth commands the expo CLI forwards`, () => {
    expect([...AUTH_COMMANDS]).toEqual(['login', 'logout', 'register', 'whoami']);
  });
});

describe(exagentPassthrough, () => {
  it(`should route the four auth commands away from the plain expo forward`, async () => {
    // A directory with no project and no expo: the plain forward would reach for `npx expo`.
    jest.spyOn(process, 'cwd').mockReturnValue(path.resolve('/elsewhere'));
    jest.spyOn(subprocess, 'spawnSubprocessAsync').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: '',
    });
    jest.mocked(runInheritedAsync).mockResolvedValue(0);

    await exagentPassthrough('whoami')([]);

    expect(runExpoAsync).not.toHaveBeenCalled();
    expect(runInheritedAsync).toHaveBeenCalled();
  });

  it(`should leave every other forwarded command on the expo path`, async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(path.resolve('/elsewhere'));
    jest.mocked(runExpoAsync).mockResolvedValue(0);

    await exagentPassthrough('prebuild')(['--clean']);

    expect(runExpoAsync).toHaveBeenCalledWith(path.resolve('/elsewhere'), ['prebuild', '--clean']);
  });
});

describe(authCliLabel, () => {
  it(`should name the CLI and where it came from`, () => {
    expect(
      authCliLabel({
        tool: 'eas',
        source: 'runner-eas',
        command: 'npx',
        prefixArgs: ['--yes', 'eas-cli@latest'],
        runner: 'npx',
      })
    ).toBe('npx --yes eas-cli@latest');
    // The runner is named, not the path it was found at.
    expect(
      authCliLabel({
        tool: 'eas',
        source: 'runner-eas',
        command: '/opt/homebrew/bin/bunx',
        prefixArgs: ['eas-cli@latest'],
        runner: 'bunx',
      })
    ).toBe('bunx eas-cli@latest');
    expect(
      authCliLabel({ tool: 'expo', source: 'project-expo', command: expoBin, prefixArgs: [] })
    ).toBe(expoBin);
  });
});
