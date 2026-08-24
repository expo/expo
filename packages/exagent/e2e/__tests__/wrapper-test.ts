/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import {
  collectOutput,
  executeExagentAsync,
  killAsync,
  readDevLockAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
  spawnExagent,
  waitForAsync,
  waitForDevLockAsync,
  waitForExitAsync,
  writeAgentSelectionAsync,
} from '../utils';

/**
 * These tests exercise the subprocess boundary of the `expo` wrappers. The fixture ships a stub
 * `expo` bin (`node_modules/expo/bin/cli`), so no network access, no install and no Metro is
 * involved. The stub records every invocation, which is how forwarded arguments are asserted.
 */

const CLAUDE_SKILLS_DIR = path.join('.claude', 'skills');

describe('exagent install', () => {
  let projectRoot: string;
  let skillLink: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
    skillLink = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage');
  });

  it('prints usage with `install --help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['install', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('install');
    expect(result.all).toContain('--no-agent-skills');
  });

  it('forwards the packages to the expo CLI', async () => {
    const result = await executeExagentAsync(projectRoot, [
      'install',
      'expo-camera',
      '--no-agent-skills',
    ]);

    expect(result.exitCode).toBe(0);

    const invocations = readStubExpoInvocations(projectRoot);
    expect(invocations).toHaveLength(1);
    expect(invocations[0]?.args).toEqual(['install', 'expo-camera']);
    // The wrapper's own flag is not part of the expo CLI surface.
    expect(invocations[0]?.args).not.toContain('--no-agent-skills');
  });

  it('skips the skill sync with `--no-agent-skills`', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    await executeExagentAsync(projectRoot, ['install', 'expo-camera', '--no-agent-skills']);

    // The sync would run after the subprocess exits, give it time to wrongly happen.
    await waitForAsync(() => fs.existsSync(skillLink), 5000);
    expect(fs.existsSync(skillLink)).toBe(false);
  });

  it('syncs the skills of the project after installing', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    await executeExagentAsync(projectRoot, ['install', 'fake-module-with-skills']);

    expect(fs.existsSync(skillLink)).toBe(true);
  });

  it('does not sync without a cached agent selection', async () => {
    await executeExagentAsync(projectRoot, ['install', 'fake-module-with-skills']);

    expect(fs.existsSync(skillLink)).toBe(false);
  });

  it('forwards the exit code of the expo CLI', async () => {
    const result = await executeExagentAsync(projectRoot, ['install', 'expo-camera'], {
      env: { STUB_EXPO_EXIT_CODE: '42' },
      reject: false,
    });

    expect(result.exitCode).toBe(42);
  });

  // `expo add` is `expo install`, so `exagent add` is this wrapper and not a bare forward: it
  // spawns `expo install` and syncs the skills of what it installed.
  it('runs `add` as the install wrapper, skill sync included', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    const result = await executeExagentAsync(projectRoot, ['add', 'fake-module-with-skills']);

    expect(result.exitCode).toBe(0);
    expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual([
      'install',
      'fake-module-with-skills',
    ]);
    expect(fs.existsSync(skillLink)).toBe(true);
  });
});

// `exagent start` is the wrapper around `expo start`: it plans nothing (that is `exagent dev`, see
// `dev-test.ts`) and forwards every argument it does not own.
describe('exagent start', () => {
  let projectRoot: string;
  let skillLink: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
    skillLink = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage');
  });

  it('prints usage with `start --help`', async () => {
    const result = await executeExagentAsync(projectRoot, ['start', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('start');
    expect(result.all).toContain('--no-agent-skills');
    // The plan engine is `exagent dev` now, and this help text points at it.
    expect(result.all).toContain('npx exagent dev');
    expect(result.all).not.toContain('--passthrough');
    expect(result.all).not.toContain('--smart');
  });

  it('starts the expo CLI and syncs the skills in the background', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    // The stub dev server stays alive, like `expo start` does.
    const child = spawnExagent(projectRoot, ['start'], {
      env: { STUB_EXPO_DELAY_MS: '15000' },
    });
    const output = collectOutput(child);
    try {
      expect(await waitForAsync(() => fs.existsSync(skillLink), 30_000)).toBe(true);
      expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual(['start']);
      expect(output.all).toContain('stub_expo_dev_server_ready');
      // No probe, no decision table: the dev server is started, not planned for.
      expect(output.all).not.toContain('Smart start plan');
    } finally {
      await killAsync(child);
    }
  });

  it('forwards every other argument to expo start, separator included', async () => {
    const child = spawnExagent(projectRoot, ['start', '--port', '8082', '--', '--web'], {
      env: { STUB_EXPO_DELAY_MS: '15000' },
    });
    const output = collectOutput(child);
    try {
      expect(
        await waitForAsync(() => readStubExpoInvocations(projectRoot).length > 0, 30_000)
      ).toBe(true);
      expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual([
        'start',
        '--port',
        '8082',
        '--',
        '--web',
      ]);
      expect(output.all).not.toContain('Smart start plan');
    } finally {
      await killAsync(child);
    }
  });

  it('skips the skill sync with `--no-agent-skills`', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    const child = spawnExagent(projectRoot, ['start', '--no-agent-skills'], {
      env: { STUB_EXPO_DELAY_MS: '15000' },
    });
    try {
      // The sync starts shortly after the subprocess, give it time to wrongly happen.
      await waitForAsync(() => fs.existsSync(skillLink), 5000);
      expect(fs.existsSync(skillLink)).toBe(false);
      expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual(['start']);
    } finally {
      await killAsync(child);
    }
  });

  it('forwards the exit code of the expo CLI', async () => {
    const child = spawnExagent(projectRoot, ['start'], {
      env: { STUB_EXPO_EXIT_CODE: '7' },
    });
    const result = await waitForExitAsync(child, collectOutput(child));

    expect(result.exitCode).toBe(7);
  });

  // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
  // While the dev server runs, the wrapper holds a socket that answers where it listens. The test
  // connects to it from the outside, like another `exagent` command would.
  describe('the dev server lock', () => {
    it('answers with the port the dev server reported, and stops when it exits', async () => {
      const eventsFile = path.join(projectRoot, 'events.jsonl');
      const child = spawnExagent(projectRoot, ['start'], {
        env: {
          STUB_EXPO_DELAY_MS: '30000',
          STUB_EXPO_DEV_SERVER_PORT: '8087',
          LOG_EVENTS: eventsFile,
        },
      });
      collectOutput(child);
      try {
        const lock = await waitForDevLockAsync(projectRoot);

        expect(lock).toMatchObject({
          url: 'http://127.0.0.1:8087',
          port: 8087,
          pid: child.pid,
        });
        expect(fs.realpathSync(lock!.projectRoot)).toBe(fs.realpathSync(projectRoot));

        // The port came out of the dev server's own log, not off the command line.
        const events = fs
          .readFileSync(eventsFile, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line));
        expect(events.find((entry) => entry._e === 'cli:dev_lock_acquired')).toMatchObject({
          port: 8087,
          portSource: 'log',
        });
      } finally {
        await killAsync(child);
      }

      // Nothing holds the address any more, so there is no stale answer to read.
      expect(await readDevLockAsync(projectRoot)).toBeNull();
    });

    it('falls back to the requested port when the dev server logs none', async () => {
      // The stub writes no `metro:instantiate` event without `STUB_EXPO_DEV_SERVER_PORT`, which is
      // the case of an `expo` CLI too old to log one.
      const child = spawnExagent(projectRoot, ['start', '--port', '8092'], {
        env: { STUB_EXPO_DELAY_MS: '60000' },
      });
      try {
        const lock = await waitForDevLockAsync(projectRoot, 40_000);

        expect(lock).toMatchObject({ url: 'http://127.0.0.1:8092', port: 8092 });
      } finally {
        await killAsync(child);
      }
    });

    it('answers nothing before a dev server runs', async () => {
      expect(await readDevLockAsync(projectRoot)).toBeNull();
    });
  });
});

// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher
// A fixed set of `expo` commands is forwarded verbatim. Everything outside that set, and outside
// exagent's own commands, is a command neither CLI has, and fails saying so.
describe('expo passthrough', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('forwards the command and its arguments to expo', async () => {
    const result = await executeExagentAsync(projectRoot, ['export', '--platform', 'web']);

    expect(result.exitCode).toBe(0);
    expect(readStubExpoInvocations(projectRoot)).toHaveLength(1);
    expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual(['export', '--platform', 'web']);
  });

  it('forwards a colon-named expo command of the set', async () => {
    const result = await executeExagentAsync(projectRoot, ['export:web'], { reject: false });

    expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual(['export:web']);
    expect(result.all).not.toContain('not a command');
  });

  it('fails on a command neither CLI has, instead of forwarding it', async () => {
    const result = await executeExagentAsync(projectRoot, ['totally-unknown'], { reject: false });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('"exagent totally-unknown" is not a command');
    expect(result.all).toContain('Try: npx exagent --help');
    // The point of the fixed set: nothing was handed to `expo` to report for us.
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });

  it('forwards the exit code of the expo CLI', async () => {
    const result = await executeExagentAsync(projectRoot, ['prebuild', '--clean'], {
      env: { STUB_EXPO_EXIT_CODE: '17' },
      reject: false,
    });

    expect(result.exitCode).toBe(17);
    expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual(['prebuild', '--clean']);
  });

  it('emits one cli:expo_passthrough event naming the forwarded command', async () => {
    const eventsFile = path.join(projectRoot, 'events.jsonl');
    await executeExagentAsync(projectRoot, ['export', '--platform', 'web'], {
      env: { LOG_EVENTS: eventsFile },
    });

    // `2g` names the event in the `_e` field of every JSONL line.
    const events = fs
      .readFileSync(eventsFile, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const forwarded = events.filter((entry) => entry._e === 'cli:expo_passthrough');
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0]).toMatchObject({ command: 'export', args: ['--platform', 'web'] });
  });

  it('adds nothing of its own: no skill sync, no follow-ups', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);
    const skillLink = path.join(projectRoot, CLAUDE_SKILLS_DIR, 'usage');

    const result = await executeExagentAsync(projectRoot, ['prebuild']);

    expect(result.all).not.toContain('Suggested next:');
    // The sync of `start` runs a few seconds in, give it time to wrongly happen here.
    await waitForAsync(() => fs.existsSync(skillLink), 5000);
    expect(fs.existsSync(skillLink)).toBe(false);
  });

  // An action of a group exagent owns is never forwarded, whether or not the group has it.
  it('never forwards an action of one of its own groups', async () => {
    const known = await executeExagentAsync(projectRoot, ['skills:nope'], { reject: false });
    const unknown = await executeExagentAsync(projectRoot, ['bogus:thing'], { reject: false });

    expect(known.exitCode).not.toBe(0);
    expect(unknown.exitCode).not.toBe(0);
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });

  it('lists the forwarded expo commands in the top-level help', async () => {
    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('Expo CLI (fallback to npx expo <command>)');
    expect(result.all).toContain('Expo CLI (fallback to npx expo <command>)');
    expect(result.all).toContain('prebuild');
    expect(result.all).toContain('whoami');
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });

  // Agents copy the stated type. `--timeout <ms>` is a lie of omission — the flags have accepted
  // `90s` and `2h` since the units existed — so every command that waits has to say so in the
  // option line itself, not only in the message it prints when a value is rejected.
  // The action, not the group: `<group> --help` is the listing (llp/0010 §Registry rules), and the
  // option block of the `runtime:*` actions lives one hop down.
  it.each([['dev:wait'], ['build:wait'], ['runtime:eval'], ['runtime:errors']])(
    'documents that %s durations take units, not only milliseconds',
    async (command) => {
      const result = await executeExagentAsync(projectRoot, [command, '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.all).toContain('<duration>');
      expect(result.all).toContain('Durations are milliseconds, or a number with a unit');
      expect(result.all).not.toContain('<ms>');
    }
  );
});

// The resolution rules of llp/0010 §Registry rules, at the process boundary: what the exit code
// and the last line of output actually are, which is all a driving agent sees.
describe('command registry', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await setupFixtureAsync('skills-app');
  });

  it('fails on a group given options but no action', async () => {
    const result = await executeExagentAsync(projectRoot, ['runtime', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.all).toContain('names no action');
    // The listing comes first, so the actions those options belong to are on screen.
    expect(result.all).toContain('runtime:eval');
    expect(result.all).toContain('Try: npx exagent runtime --help');
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });

  // The other half of the rule — a group *with* a default action still gets its options — is
  // `exagent checkpoint --label ...` in `checkpoint-test.ts`, which needs a git repository.
  it('still lists the actions of a bare group, and exits 0', async () => {
    const result = await executeExagentAsync(projectRoot, ['runtime']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('runtime:eval');
  });
});
