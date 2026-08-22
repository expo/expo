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

// `exagent start` plans by default (see `smart-test.ts`); `--passthrough` is the wrapper around
// `expo start` that this file covers, and its argument forwarding must stay what the default was.
describe('exagent start --passthrough', () => {
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
    expect(result.all).toContain('--passthrough');
  });

  it('starts the expo CLI and syncs the skills in the background', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    // The stub dev server stays alive, like `expo start` does.
    const child = spawnExagent(projectRoot, ['start', '--passthrough'], {
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
    const child = spawnExagent(
      projectRoot,
      ['start', '--passthrough', '--port', '8082', '--', '--web'],
      { env: { STUB_EXPO_DELAY_MS: '15000' } }
    );
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
      expect(output.all).not.toContain('--passthrough');
    } finally {
      await killAsync(child);
    }
  });

  it('skips the skill sync with `--no-agent-skills`', async () => {
    await writeAgentSelectionAsync(projectRoot, ['claude-code']);

    const child = spawnExagent(projectRoot, ['start', '--passthrough', '--no-agent-skills'], {
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
    const child = spawnExagent(projectRoot, ['start', '--passthrough'], {
      env: { STUB_EXPO_EXIT_CODE: '7' },
    });
    const result = await waitForExitAsync(child, collectOutput(child));

    expect(result.exitCode).toBe(7);
  });
});
