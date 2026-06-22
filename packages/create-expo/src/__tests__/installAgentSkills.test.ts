import type { SpawnResult } from '@expo/spawn-async';
import spawnAsync from '@expo/spawn-async';
import prompts from 'prompts';

import {
  installAgentSkillsAsync,
  maybeInstallAgentSkillsAsync,
  shouldInstallAgentSkillsAsync,
} from '../installAgentSkills';
import type { PackageManagerName } from '../resolvePackageManager';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

const originalConsoleError = console.error;
const originalEnv = process.env;

jest.mock('@expo/spawn-async');
jest.mock('prompts');

beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  process.env = originalEnv;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
});

describe(shouldInstallAgentSkillsAsync, () => {
  it('uses the explicit agent skills option when provided', async () => {
    await expect(shouldInstallAgentSkillsAsync({ agentSkills: true, yes: true })).resolves.toBe(
      true
    );
    await expect(shouldInstallAgentSkillsAsync({ agentSkills: false, yes: false })).resolves.toBe(
      false
    );
    expect(prompts).not.toHaveBeenCalled();
  });

  it('does not prompt or install in yes mode by default', async () => {
    await expect(shouldInstallAgentSkillsAsync({ yes: true })).resolves.toBe(false);
    expect(prompts).not.toHaveBeenCalled();
  });

  it('does not prompt or install in CI by default', async () => {
    process.env.CI = '1';

    await expect(shouldInstallAgentSkillsAsync({ yes: false })).resolves.toBe(false);
    expect(prompts).not.toHaveBeenCalled();
  });

  it('prompts in interactive mode', async () => {
    asMock(prompts).mockResolvedValueOnce({ answer: true });

    await expect(shouldInstallAgentSkillsAsync({ yes: false })).resolves.toBe(true);
    expect(prompts).toHaveBeenCalledWith({
      type: 'confirm',
      name: 'answer',
      message: 'Add Expo agent skills to this project?',
      initial: false,
    });
  });
});

describe(installAgentSkillsAsync, () => {
  it.each<[PackageManagerName, string, string[]]>([
    ['npm', 'npx', ['--yes', 'skills', 'add', 'expo/skills', '--copy']],
    ['yarn', 'yarn', ['dlx', 'skills', 'add', 'expo/skills', '--copy']],
    ['pnpm', 'pnpm', ['dlx', 'skills', 'add', 'expo/skills', '--copy']],
    ['bun', 'bunx', ['skills', 'add', 'expo/skills', '--copy']],
  ])('runs the skills CLI with %s', async (packageManager, command, args) => {
    asMock(spawnAsync).mockResolvedValueOnce({} as SpawnResult);

    await expect(installAgentSkillsAsync('/tmp/my-app', packageManager)).resolves.toBe(true);
    expect(spawnAsync).toHaveBeenCalledWith(command, args, {
      cwd: '/tmp/my-app',
      stdio: 'inherit',
    });
  });

  it('returns false when skills installation fails', async () => {
    asMock(spawnAsync).mockRejectedValueOnce(new Error('failed'));

    await expect(installAgentSkillsAsync('/tmp/my-app', 'npm')).resolves.toBe(false);
  });
});

describe(maybeInstallAgentSkillsAsync, () => {
  it('skips installation when agent skills are not selected', async () => {
    await maybeInstallAgentSkillsAsync('/tmp/my-app', { agentSkills: false, yes: false }, 'npm');

    expect(spawnAsync).not.toHaveBeenCalled();
  });

  it('installs when agent skills are selected', async () => {
    asMock(spawnAsync).mockResolvedValueOnce({} as SpawnResult);

    await maybeInstallAgentSkillsAsync('/tmp/my-app', { agentSkills: true, yes: true }, 'npm');

    expect(spawnAsync).toHaveBeenCalledWith(
      'npx',
      ['--yes', 'skills', 'add', 'expo/skills', '--copy'],
      {
        cwd: '/tmp/my-app',
        stdio: 'inherit',
      }
    );
  });
});
