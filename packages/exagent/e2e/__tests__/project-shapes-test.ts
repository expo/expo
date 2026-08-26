/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §The probe
//
// The project states the fixture matrix does not have. Every other e2e file copies one of six
// fixtures into a temporary directory that looks the same every time; this one asks what happens
// when the *shape around* the project is not that — a path with a space in it, a workspace, a
// directory with no repository, a `package.json` that is not an Expo app, and no project at all.
//
// These are the states a real caller is in far more often than the fixture matrix suggests, and
// three of the four are shapes a unit test cannot produce: a socket path, a `find-up` walk and a
// subprocess `cwd` are all facts about a real filesystem.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  readDevLockAsync,
  setupFixtureAsync,
  waitForDevLockAsync,
} from '../utils';

/** A fresh temporary directory whose own name holds a space. */
async function temporaryDirWithSpaceAsync(): Promise<string> {
  return await fs.promises.realpath(
    await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent e2e '))
  );
}

/** Install the fixture's stub `expo` bin into a project that was copied by hand. */
async function installStubExpoAsync(projectRoot: string): Promise<void> {
  const stubScript = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
  for (const dir of [
    path.join(projectRoot, '.stub-bin'),
    path.join(projectRoot, 'node_modules', '.bin'),
  ]) {
    await installStubBinAsync(dir, 'expo', stubScript);
  }
}

/** Copy a fixture into a directory the caller chose, stub bins included. */
async function copyFixtureIntoAsync(fixtureName: string, target: string): Promise<string> {
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.cp(path.resolve(__dirname, '..', 'fixtures', fixtureName), target, {
    recursive: true,
    verbatimSymlinks: true,
  });
  await installStubExpoAsync(target);
  return target;
}

describe('a project whose path holds a space', () => {
  // Every path this CLI builds crosses a shell or a spawn at some point — the `.cmd` shim on
  // Windows, the `sh` shim everywhere else, the `adb exec-out` redirection, the screenshot file.
  // A space is what tells an unquoted one from a quoted one, and no fixture directory has ever had
  // one.
  it('reads the project and plans against it', async () => {
    const projectRoot = await copyFixtureIntoAsync(
      'go-app',
      path.join(await temporaryDirWithSpaceAsync(), 'my app')
    );

    const result = await executeExagentAsync(projectRoot, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.root).toBe(projectRoot);
    expect(report.next.command).toBe('exagent dev');
  });

  // The dev-server lock is a unix socket **inside the project**, so the project path is part of an
  // address the kernel caps at about 104 bytes. A space costs nothing there and a directory name
  // that holds one is exactly the kind of path that is also long.
  it('holds the dev-server lock, reads it back, and stops the server through it', async () => {
    const projectRoot = await copyFixtureIntoAsync(
      'go-app',
      path.join(await temporaryDirWithSpaceAsync(), 'my app')
    );

    const detached = await executeExagentAsync(projectRoot, ['dev', '--detach', '--yes', '--json'], {
      env: { STUB_EXPO_DEV_SERVER_PORT: '8099', STUB_EXPO_DELAY_MS: '15000' },
    });
    expect(detached.exitCode).toBe(0);

    try {
      const lock = await waitForDevLockAsync(projectRoot, 5_000);
      expect(lock).toMatchObject({ port: 8099, projectRoot });

      const logs = await executeExagentAsync(projectRoot, ['dev:logs', '--tail', '3']);
      expect(logs.exitCode).toBe(0);
      // The log path is inside the project, so it carries the space too.
      expect(logs.all).toContain('my app');
    } finally {
      const stopped = await executeExagentAsync(projectRoot, ['dev:stop', '--json'], {
        reject: false,
      });
      expect(stopped.exitCode).toBe(0);
      expect(JSON.parse(stopped.stdout).stopped).toBe(true);
    }

    expect(await readDevLockAsync(projectRoot, 500)).toBeNull();
  });
});

describe('a project inside a workspace', () => {
  // The `find-up` walk stops at the *nearest* `package.json`, and a monorepo has two. A walk that
  // went one directory too far would report the workspace root as the project, and every command
  // after it would be about the wrong thing.
  it('resolves the app rather than the workspace root', async () => {
    const workspace = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-workspace-'))
    );
    await fs.promises.writeFile(
      path.join(workspace, 'package.json'),
      JSON.stringify({ name: 'monorepo', private: true, workspaces: ['apps/*'] }, null, 2)
    );
    await fs.promises.writeFile(
      path.join(workspace, 'pnpm-workspace.yaml'),
      "packages:\n  - 'apps/*'\n"
    );
    const projectRoot = await copyFixtureIntoAsync(
      'go-app',
      path.join(workspace, 'apps', 'mobile')
    );

    const result = await executeExagentAsync(projectRoot, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.root).toBe(projectRoot);
    expect(report.project.root).not.toBe(workspace);
    expect(report.project.sdkVersion).toBe('54.0.0');
  });

  // A command run from a directory *below* the app still means the app: an agent's shell is very
  // often in `src/` or `app/`.
  it('resolves the app from a directory inside it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const nested = path.join(projectRoot, 'src', 'components');
    await fs.promises.mkdir(nested, { recursive: true });

    const result = await executeExagentAsync(nested, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).project.root).toBe(
      await fs.promises.realpath(projectRoot)
    );
  });
});

describe('a directory with no project in it', () => {
  // @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
  // The most common wrong-directory failure there is. It used to be one clause — "Project root
  // directory not found" — with a null `suggestedCommand`, so an agent that ran a command in the
  // wrong place got a dead end on the one line it reads for a recovery.
  it('says what, why and how, and puts a command on the Try line', async () => {
    const empty = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-empty-'))
    );

    const result = await executeExagentAsync(empty, ['status', '--json'], { reject: false });

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('NO_PROJECT');
    expect(report.error.message).toContain('Why:');
    expect(report.error.message).toContain('How:');
    expect(report.error.suggestedCommand).toBe('npx exagent new my-app');
  });

  it('answers the same way for every command that needs a project', async () => {
    const empty = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-empty-'))
    );

    for (const argv of [
      ['status', '--json'],
      ['dev', '--plan', '--json'],
      ['typecheck', '--json'],
      ['smoke', '--json'],
    ]) {
      const result = await executeExagentAsync(empty, argv, { reject: false });
      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout).error.code).toBe('NO_PROJECT');
    }
  });

  // The auth commands are the exception, and it is deliberate: they act on `~/.expo`, which exists
  // whether or not this directory has an app in it (`src/passthrough/auth.ts`).
  it('does not refuse the commands that act on the machine rather than the project', async () => {
    const empty = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-empty-'))
    );

    const result = await executeExagentAsync(empty, ['whoami', '--help'], { reject: false });

    // Whatever it answers, it is not "there is no project here".
    expect(result.all).not.toContain('NO_PROJECT');
  });
});

// @ref llp/0020-not-an-expo-app.rfc.md
// The wrong-directory failure the `NO_PROJECT` one cannot catch: there *is* a package.json here,
// it is just not an app. Every row below is about one of the two answers that document settles —
// a command that acts on the app stops, a command that describes the directory answers and says
// what the directory is.
describe('a package.json that is not an Expo app', () => {
  /** A plain Node package: a `package.json`, and nothing that makes it an Expo project. */
  async function plainPackageAsync(): Promise<string> {
    const directory = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-plain-'))
    );
    await fs.promises.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify({ name: 'plain', version: '1.0.0' }, null, 2)
    );
    return directory;
  }

  // What it does today, pinned so a change to it is visible.
  it('reports a null SDK version rather than failing', async () => {
    const directory = await plainPackageAsync();

    const result = await executeExagentAsync(directory, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.sdkVersion).toBeNull();
  });

  it('says there is nothing to type-check rather than inventing a result', async () => {
    const directory = await plainPackageAsync();

    const result = await executeExagentAsync(directory, ['typecheck', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.checked).toBe(false);
    expect(report.reason).toContain('no TypeScript');
  });

  // The trap this whole section exists for: the decision table used to read "no `expo` dependency"
  // as "lacks a dev client", so an agent that ran `dev` one directory too high — at a repository or
  // workspace root — was handed a plan to install packages into the *wrong repository* and then
  // build it.
  it('refuses to plan a build for a directory that is not an Expo app', async () => {
    const directory = await plainPackageAsync();

    const result = await executeExagentAsync(directory, ['dev', '--plan', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).not.toContain('expo install expo-dev-client');
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('NOT_EXPO_APP');
    expect(report.error.message).toContain('Why:');
    expect(report.error.message).toContain('How:');
    expect(report.error.suggestedCommand).toBe('npx exagent new my-app');
  });

  // One answer for every command that acts on the app, because an agent that learns the answer
  // from `dev` must not have to learn it again from `smoke`.
  it('answers the same way for every command that acts on the app', async () => {
    const directory = await plainPackageAsync();

    for (const argv of [
      ['dev', '--plan', '--json'],
      ['start', '--json'],
      ['smoke', '--json'],
      ['navigate', '/', '--json'],
      ['deploy', '--web', '--json'],
      ['doctor', '--json'],
    ]) {
      const result = await executeExagentAsync(directory, argv, { reject: false });
      expect({ argv, exitCode: result.exitCode }).toEqual({ argv, exitCode: 1 });
      expect({ argv, code: JSON.parse(result.stdout).error.code }).toEqual({
        argv,
        code: 'NOT_EXPO_APP',
      });
    }
  });

  // `status` is how a caller *finds out* it is in the wrong place, so refusing it would take away
  // the answer. It reports instead — and stops naming `exagent dev`, which is the same trap one
  // hop later.
  it('lets status report, and stops it recommending a build here', async () => {
    const directory = await plainPackageAsync();

    const result = await executeExagentAsync(directory, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.isExpoApp).toBe(false);
    expect(report.next.rule).toBe('not-expo-app');
    expect(report.next.command).not.toBe('exagent dev');
    expect(report.next.steps).toEqual([]);
    expect(report.followups.map((followup: { command: string }) => followup.command)).not.toContain(
      'npx exagent install expo-dev-client'
    );
    expect(result.all).not.toContain('expo install expo-dev-client');
  });

  it('says so on the project line of the text report', async () => {
    const directory = await plainPackageAsync();

    const result = await executeExagentAsync(directory, ['status']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('not an Expo app');
  });

  // The escape hatch has to stay open: adding Expo to this package is the one thing that makes it
  // an Expo app, and a guard that refused it would leave no way out of the state it reports.
  it('does not refuse the commands that would make this an Expo app', async () => {
    const directory = await plainPackageAsync();

    for (const argv of [['install', 'expo', '--check'], ['new', '--help']]) {
      const result = await executeExagentAsync(directory, argv, { reject: false });
      expect({ argv, all: result.all.includes('NOT_EXPO_APP') }).toEqual({ argv, all: false });
    }
  });

  // The dev-server commands act on this project's lock file rather than on the app, so they answer
  // for the same reason the auth commands do: what they read exists whether or not there is an app.
  it('does not refuse the dev-server commands, which act on the lock rather than the app', async () => {
    const directory = await plainPackageAsync();

    for (const argv of [
      ['dev:stop', '--json'],
      ['dev:logs', '--json'],
    ]) {
      const result = await executeExagentAsync(directory, argv, { reject: false });
      expect({ argv, all: result.all.includes('NOT_EXPO_APP') }).toEqual({ argv, all: false });
    }
  });
});

describe('an Expo app whose dependencies are not installed', () => {
  // The rule is *declared*, not installed: `expo` in package.json makes this an Expo app, and a
  // fresh clone with no node_modules is the most ordinary state a real project is ever in. Reading
  // the installed package instead would have refused every one of them.
  it('is planned for, rather than refused as not an Expo app', async () => {
    const directory = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-uninstalled-'))
    );
    await fs.promises.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify(
        { name: 'cloned', version: '1.0.0', dependencies: { expo: '~54.0.0' } },
        null,
        2
      )
    );

    const result = await executeExagentAsync(directory, ['dev', '--plan', '--json'], {
      reject: false,
    });

    expect(result.all).not.toContain('NOT_EXPO_APP');
    expect(JSON.parse(result.stdout).rule).not.toBe('not-expo-app');
  });
});
