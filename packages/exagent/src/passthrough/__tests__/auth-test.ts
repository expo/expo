import { vol } from 'memfs';
import path from 'path';

import { exagentPassthrough } from '..';
import {
  AUTH_COMMANDS,
  authCliLabel,
  easArgsForAuthCommand,
  resolveAuthCliAsync,
} from '../auth';
import * as subprocess from '../../utils/subprocess';
import { runExpoAsync } from '../../utils/expoCli';
import { runInheritedAsync } from '../../utils/inheritedRun';

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
  it(`should fall back to the project's own eas CLI when there is no expo`, async () => {
    vol.fromJSON({ [easBin]: '#!/bin/sh' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toEqual({
      tool: 'eas',
      source: 'project-eas',
      command: easBin,
      prefixArgs: [],
    });
  });

  it(`should prefer the project's expo over the project's eas`, async () => {
    vol.fromJSON({ [expoBin]: '#!/bin/sh', [easBin]: '#!/bin/sh' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toMatchObject({
      tool: 'expo',
    });
  });

  it(`should fall back to an eas on PATH when the project has neither`, async () => {
    vol.fromJSON({ [pathEas]: '#!/bin/sh' });
    mockProbe({ exitCode: 0, stdout: 'eas-cli/22.4.0 darwin-arm64\n' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: pathDir })).resolves.toEqual({
      tool: 'eas',
      source: 'path-eas',
      command: pathEas,
      prefixArgs: [],
    });
  });

  // The machine this was built on has exactly this: an `eas` on PATH that is a wrapper panicking
  // before it reaches the CLI. Handing an interactive login to it would print a backtrace.
  it(`should skip an eas on PATH that is not the EAS CLI`, async () => {
    vol.fromJSON({ [pathEas]: '#!/bin/sh' });
    mockProbe({ exitCode: 101, stderr: 'thread panicked at src/main.rs\nStack backtrace:\n' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: pathDir })).resolves.toEqual({
      tool: 'eas',
      source: 'npx-eas',
      command: 'npx',
      prefixArgs: ['eas-cli@latest'],
    });
  });

  it(`should keep an eas on PATH that fails for a reason of its own`, async () => {
    vol.fromJSON({ [pathEas]: '#!/bin/sh' });
    // Non-zero, but the output is unmistakably the EAS CLI's, so it is the CLI having a bad day.
    mockProbe({ exitCode: 1, stderr: 'Error: not logged in. Run "eas login".\n' });

    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: pathDir })).resolves.toMatchObject({
      source: 'path-eas',
    });
  });

  it(`should fall back to npx when nothing is installed anywhere`, async () => {
    await expect(resolveAuthCliAsync(projectRoot, { pathEnv: '' })).resolves.toEqual({
      tool: 'eas',
      source: 'npx-eas',
      command: 'npx',
      prefixArgs: ['eas-cli@latest'],
    });
  });

  it(`should probe a PATH candidate once, and not probe the ones it trusts`, async () => {
    vol.fromJSON({ [easBin]: '#!/bin/sh', [pathEas]: '#!/bin/sh' });
    const probe = mockProbe({ exitCode: 0 });

    await resolveAuthCliAsync(projectRoot, { pathEnv: pathDir });

    // The project's own bin came out of node_modules, so it is the CLI by construction.
    expect(probe).not.toHaveBeenCalled();
  });
});

describe(easArgsForAuthCommand, () => {
  it.each(['login', 'logout', 'whoami'])(`should map %s to the eas command of the same name`, (name) => {
    expect(easArgsForAuthCommand(name)).toEqual([name]);
  });

  // `eas register` does not exist [observed — eas-cli 22.4.0]. Answering it with a command that is
  // not there would print the EAS CLI's "command not found" for a command the user did not type.
  it(`should have no eas equivalent for register`, () => {
    expect(easArgsForAuthCommand('register')).toBeNull();
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
        source: 'npx-eas',
        command: 'npx',
        prefixArgs: ['eas-cli@latest'],
      })
    ).toBe('npx eas-cli@latest');
    expect(
      authCliLabel({ tool: 'eas', source: 'project-eas', command: easBin, prefixArgs: [] })
    ).toBe(easBin);
  });
});
