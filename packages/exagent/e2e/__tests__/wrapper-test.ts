/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import {
  collectOutput,
  executeExagentAsync,
  killAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
  spawnExagent,
  waitForAsync,
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
});

// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher
// Every command `exagent` does not implement is one of the `expo` CLI's own, forwarded verbatim.
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

  it('forwards a command neither CLI knows, letting expo report it', async () => {
    const result = await executeExagentAsync(projectRoot, ['totally-unknown'], { reject: false });

    // No "Unknown command" from exagent: the stub `expo` bin is what answers.
    expect(result.all).not.toContain('Unknown command');
    expect(readStubExpoInvocations(projectRoot)[0]?.args).toEqual(['totally-unknown']);
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

    expect(result.all).not.toContain('Next:');
    // The sync of `start` runs a few seconds in, give it time to wrongly happen here.
    await waitForAsync(() => fs.existsSync(skillLink), 5000);
    expect(fs.existsSync(skillLink)).toBe(false);
  });

  // A name with a colon is one of exagent's own groups, whatever comes after it, so an unknown one
  // is an error here instead of an `expo` invocation that could not mean anything.
  it('never forwards a colon command, known group or not', async () => {
    const known = await executeExagentAsync(projectRoot, ['skills:nope'], { reject: false });
    const unknown = await executeExagentAsync(projectRoot, ['export:web'], { reject: false });

    expect(known.exitCode).not.toBe(0);
    expect(unknown.exitCode).not.toBe(0);
    expect(unknown.all).toContain('export');
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });

  it('names the forwarding rule in the top-level help', async () => {
    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('forwarded to expo <command>');
    expect(readStubExpoInvocations(projectRoot)).toEqual([]);
  });
});
