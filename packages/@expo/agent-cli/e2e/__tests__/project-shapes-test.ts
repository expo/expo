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
  executeAgentCliAsync,
  installStubBinAsync,
  readDevLockAsync,
  setupFixtureAsync,
  waitForDevLockAsync,
} from '../utils';

/** A fresh temporary directory whose own name holds a space. */
async function temporaryDirWithSpaceAsync(): Promise<string> {
  return await fs.promises.realpath(
    await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli e2e '))
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

    const result = await executeAgentCliAsync(projectRoot, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.root).toBe(projectRoot);
    expect(report.next.command).toBe('npx @expo/agent-cli dev');
  });

  // The dev-server lock is a unix socket **inside the project**, so the project path is part of an
  // address the kernel caps at about 104 bytes. A space costs nothing there and a directory name
  // that holds one is exactly the kind of path that is also long.
  it('holds the dev-server lock, reads it back, and stops the server through it', async () => {
    const projectRoot = await copyFixtureIntoAsync(
      'go-app',
      path.join(await temporaryDirWithSpaceAsync(), 'my app')
    );

    const detached = await executeAgentCliAsync(projectRoot, ['dev', '--detach', '--yes', '--json'], {
      env: { STUB_EXPO_DEV_SERVER_PORT: '8099', STUB_EXPO_DELAY_MS: '15000' },
    });
    expect(detached.exitCode).toBe(0);

    try {
      const lock = await waitForDevLockAsync(projectRoot, 5_000);
      expect(lock).toMatchObject({ port: 8099, projectRoot });

      const logs = await executeAgentCliAsync(projectRoot, ['dev:logs', '--tail', '3']);
      expect(logs.exitCode).toBe(0);
      // The log path is inside the project, so it carries the space too.
      expect(logs.all).toContain('my app');
    } finally {
      const stopped = await executeAgentCliAsync(projectRoot, ['dev:stop', '--json'], {
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
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-workspace-'))
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

    const result = await executeAgentCliAsync(projectRoot, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.root).toBe(projectRoot);
    expect(report.project.root).not.toBe(workspace);
    expect(report.project.sdkVersion).toBe('54.0.0');
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §Resolving a project-local bin
  // The shape F113 was found in: `workspaces: ["apps/*"]` plus a plain `npm install`, which hoists
  // so completely that `apps/mobile/node_modules` does not exist at all. Every resolver that built
  // the literal path `<projectRoot>/node_modules/.bin/<name>` reported its tool missing in a
  // repository where the install had just succeeded [observed — 2026-08-27, wave 27 live pass].
  //
  // The stub bins go where npm puts them here: the **workspace root's** `node_modules/.bin`.
  describe('with its dependencies hoisted to the workspace root', () => {
    /**
     * A hoisted npm workspace holding one app, built by moving the fixture's own `node_modules` up.
     *
     * Moving rather than copying is the point: the app is left without one, which is what makes
     * this shape different from the workspace above and is the whole of what F113 was about.
     */
    async function hoistedWorkspaceAsync(): Promise<{ workspace: string; projectRoot: string }> {
      const workspace = await fs.promises.realpath(
        await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-hoisted-'))
      );
      await fs.promises.writeFile(
        path.join(workspace, 'package.json'),
        JSON.stringify({ name: 'monorepo', private: true, workspaces: ['apps/*'] }, null, 2)
      );

      const projectRoot = path.join(workspace, 'apps', 'mobile');
      await fs.promises.mkdir(projectRoot, { recursive: true });
      await fs.promises.cp(
        path.resolve(__dirname, '..', 'fixtures', 'dev-client-fresh-app'),
        projectRoot,
        { recursive: true, verbatimSymlinks: true }
      );

      const hoisted = path.join(workspace, 'node_modules');
      await fs.promises.rename(path.join(projectRoot, 'node_modules'), hoisted);

      const binDir = path.join(hoisted, '.bin');
      await installStubBinAsync(binDir, 'expo', path.join(hoisted, 'expo', 'bin', 'cli'));
      await installStubBinAsync(
        binDir,
        'fingerprint',
        path.join(hoisted, '@expo', 'fingerprint', 'bin', 'cli')
      );
      // The PATH stub stays beside the app, because `spawnAgentCli` builds it from the `cwd`.
      await installStubBinAsync(
        path.join(projectRoot, '.stub-bin'),
        'expo',
        path.join(hoisted, 'expo', 'bin', 'cli')
      );

      return { workspace, projectRoot };
    }

    /** A `tsc` that answers the way a clean project's does: nothing on stdout, exit 0. */
    async function installStubTypeScriptAsync(workspace: string): Promise<void> {
      const packageDir = path.join(workspace, 'node_modules', 'typescript', 'bin');
      await fs.promises.mkdir(packageDir, { recursive: true });
      const script = path.join(packageDir, 'tsc');
      await fs.promises.writeFile(script, '#!/usr/bin/env node\nprocess.exit(0);\n');
      await installStubBinAsync(path.join(workspace, 'node_modules', '.bin'), 'tsc', script);
    }

    it('type-checks with the compiler the workspace installed', async () => {
      const { workspace, projectRoot } = await hoistedWorkspaceAsync();
      await installStubTypeScriptAsync(workspace);
      await fs.promises.writeFile(path.join(projectRoot, 'tsconfig.json'), '{}');
      await fs.promises.writeFile(path.join(projectRoot, 'app.ts'), 'export const a = 1;\n');

      const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
        reject: false,
      });

      // The failure this replaces was exit 1 `TYPECHECK_CLI_MISSING` — a tool error, not a verdict.
      expect(result.all).not.toContain('TYPECHECK_CLI_MISSING');
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).checked).toBe(true);
    });

    // The compiler really is absent here, and the message must say what it searched instead of
    // telling a reader with a full node_modules to install their dependencies.
    it('says what it searched when no ancestor has a compiler', async () => {
      const { projectRoot } = await hoistedWorkspaceAsync();
      await fs.promises.writeFile(path.join(projectRoot, 'tsconfig.json'), '{}');

      const result = await executeAgentCliAsync(projectRoot, ['typecheck', '--json'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      const { error } = JSON.parse(result.stdout);
      expect(error.code).toBe('TYPECHECK_CLI_MISSING');
      expect(error.message).toContain('every directory above it');
      expect(error.message).not.toContain(`install the project's dependencies`);
    });

    it('hashes the native surface with the fingerprint CLI the workspace installed', async () => {
      const { projectRoot } = await hoistedWorkspaceAsync();

      const result = await executeAgentCliAsync(projectRoot, ['status', '--json']);

      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.freshness.hash).toEqual(expect.any(String));
      expect(report.freshness.error).toBeUndefined();
      expect(result.all).not.toContain('no fingerprint tool');
    });

    // `status` reported `auth unknown (nothing could answer)` in a directory where `@expo/agent-cli whoami`
    // answers, because the project's own `expo` was one directory up (F113).
    it('answers the auth section from the expo the workspace installed', async () => {
      const { projectRoot } = await hoistedWorkspaceAsync();

      const result = await executeAgentCliAsync(projectRoot, ['status', '--json']);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).auth).toMatchObject({
        loggedIn: true,
        source: 'expo whoami',
      });
    });
  });

  // A command run from a directory *below* the app still means the app: an agent's shell is very
  // often in `src/` or `app/`.
  it('resolves the app from a directory inside it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const nested = path.join(projectRoot, 'src', 'components');
    await fs.promises.mkdir(nested, { recursive: true });

    const result = await executeAgentCliAsync(nested, ['status', '--json']);

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
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-empty-'))
    );

    const result = await executeAgentCliAsync(empty, ['status', '--json'], { reject: false });

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('NO_PROJECT');
    expect(report.error.message).toContain('Why:');
    expect(report.error.message).toContain('How:');
    expect(report.error.suggestedCommand).toBe('npx @expo/agent-cli new my-app');
  });

  it('answers the same way for every command that needs a project', async () => {
    const empty = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-empty-'))
    );

    for (const argv of [
      ['status', '--json'],
      ['dev', '--plan', '--json'],
      ['typecheck', '--json'],
      ['smoke', '--json'],
    ]) {
      const result = await executeAgentCliAsync(empty, argv, { reject: false });
      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout).error.code).toBe('NO_PROJECT');
    }
  });

  // The auth commands are the exception, and it is deliberate: they act on `~/.expo`, which exists
  // whether or not this directory has an app in it (`src/passthrough/auth.ts`).
  it('does not refuse the commands that act on the machine rather than the project', async () => {
    const empty = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-empty-'))
    );

    const result = await executeAgentCliAsync(empty, ['whoami', '--help'], { reject: false });

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
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-plain-'))
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

    const result = await executeAgentCliAsync(directory, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.sdkVersion).toBeNull();
  });

  it('says there is nothing to type-check rather than inventing a result', async () => {
    const directory = await plainPackageAsync();

    const result = await executeAgentCliAsync(directory, ['typecheck', '--json']);

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

    const result = await executeAgentCliAsync(directory, ['dev', '--plan', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).not.toContain('expo install expo-dev-client');
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('NOT_EXPO_APP');
    expect(report.error.message).toContain('Why:');
    expect(report.error.message).toContain('How:');
    expect(report.error.suggestedCommand).toBe('npx @expo/agent-cli new my-app');
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
      const result = await executeAgentCliAsync(directory, argv, { reject: false });
      expect({ argv, exitCode: result.exitCode }).toEqual({ argv, exitCode: 1 });
      expect({ argv, code: JSON.parse(result.stdout).error.code }).toEqual({
        argv,
        code: 'NOT_EXPO_APP',
      });
    }
  });

  // `status` is how a caller *finds out* it is in the wrong place, so refusing it would take away
  // the answer. It reports instead — and stops naming `@expo/agent-cli dev`, which is the same trap one
  // hop later.
  it('lets status report, and stops it recommending a build here', async () => {
    const directory = await plainPackageAsync();

    const result = await executeAgentCliAsync(directory, ['status', '--json']);

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.project.isExpoApp).toBe(false);
    expect(report.next.rule).toBe('not-expo-app');
    expect(report.next.command).not.toBe('npx @expo/agent-cli dev');
    expect(report.next.steps).toEqual([]);
    expect(report.followups.map((followup: { command: string }) => followup.command)).not.toContain(
      'npx @expo/agent-cli install expo-dev-client'
    );
    expect(result.all).not.toContain('expo install expo-dev-client');
  });

  it('says so on the project line of the text report', async () => {
    const directory = await plainPackageAsync();

    const result = await executeAgentCliAsync(directory, ['status']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('not an Expo app');
  });

  // The escape hatch has to stay open: adding Expo to this package is the one thing that makes it
  // an Expo app, and a guard that refused it would leave no way out of the state it reports.
  it('does not refuse the commands that would make this an Expo app', async () => {
    const directory = await plainPackageAsync();

    for (const argv of [['install', 'expo', '--check'], ['new', '--help']]) {
      const result = await executeAgentCliAsync(directory, argv, { reject: false });
      expect({ argv, all: result.all.includes('NOT_EXPO_APP') }).toEqual({ argv, all: false });
    }
  });

  // The agent-setup commands read the skills the installed Expo packages ship and write links into
  // this directory, so they act on the app too — and without `expo` they used to fail on the module
  // resolution itself and print a raw Node stack trace with a `Require stack:` in it.
  it('answers with the guard rather than a stack trace for the agent-setup commands', async () => {
    const directory = await plainPackageAsync();

    for (const argv of [
      ['agents:setup', '--json'],
      ['skills:sync', '--json'],
      ['skills:list', '--json'],
    ]) {
      const result = await executeAgentCliAsync(directory, argv, { reject: false });
      expect({ argv, exitCode: result.exitCode }).toEqual({ argv, exitCode: 1 });
      expect({ argv, code: JSON.parse(result.stdout).error.code }).toEqual({
        argv,
        code: 'NOT_EXPO_APP',
      });
      expect(result.all).not.toContain('Require stack:');
    }
  });

  // `skills:clean` removes what an earlier run linked here, which is cleanup rather than action on
  // an app — the same reason `dev:stop` stays open.
  it('does not refuse skills:clean, which removes what an earlier run left', async () => {
    const directory = await plainPackageAsync();

    const result = await executeAgentCliAsync(directory, ['skills:clean', '--json']);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).removed).toEqual([]);
  });

  // The dev-server commands act on this project's lock file rather than on the app, so they answer
  // for the same reason the auth commands do: what they read exists whether or not there is an app.
  it('does not refuse the dev-server commands, which act on the lock rather than the app', async () => {
    const directory = await plainPackageAsync();

    for (const argv of [
      ['dev:stop', '--json'],
      ['dev:logs', '--json'],
    ]) {
      const result = await executeAgentCliAsync(directory, argv, { reject: false });
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
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-cli-uninstalled-'))
    );
    await fs.promises.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify(
        { name: 'cloned', version: '1.0.0', dependencies: { expo: '~54.0.0' } },
        null,
        2
      )
    );

    const result = await executeAgentCliAsync(directory, ['dev', '--plan', '--json'], {
      reject: false,
    });

    expect(result.all).not.toContain('NOT_EXPO_APP');
    expect(JSON.parse(result.stdout).rule).not.toBe('not-expo-app');
  });
});
