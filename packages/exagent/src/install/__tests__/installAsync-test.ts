import { autoSyncSkillsAsync, printSkillsForAgentAsync } from '../../skills/skillsAsync';
import { runExpoAsync } from '../../utils/expoCli';
import { installAsync } from '../installAsync';
import { resolveInstallPlan } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../../skills/skillsAsync', () => ({
  autoSyncSkillsAsync: jest.fn(),
  printSkillsForAgentAsync: jest.fn(),
}));

const projectRoot = '/project';

beforeEach(() => {
  jest.mocked(runExpoAsync).mockResolvedValue(0);
});

describe(installAsync, () => {
  it(`should run expo install with the forwarded arguments`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--dev']));

    expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['install', 'expo-sqlite', '--dev']);
  });

  it(`should sync only the installed packages and dump their skills`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '@expo/ui@~1.0.0']));

    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot, {
      packages: ['expo-sqlite', '@expo/ui@~1.0.0'],
    });
    expect(printSkillsForAgentAsync).toHaveBeenCalledWith(projectRoot, {
      packages: ['expo-sqlite', '@expo/ui@~1.0.0'],
    });
  });

  it(`should run a full sync when no package is named`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['--fix']));

    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot, {});
    expect(printSkillsForAgentAsync).not.toHaveBeenCalled();
  });

  it(`should skip the sync with --no-agent-skills`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-agent-skills']));

    expect(runExpoAsync).toHaveBeenCalled();
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();
    expect(printSkillsForAgentAsync).not.toHaveBeenCalled();
  });

  it(`should sync but not dump skills with --no-skill-context`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-skill-context']));

    expect(autoSyncSkillsAsync).toHaveBeenCalled();
    expect(printSkillsForAgentAsync).not.toHaveBeenCalled();
  });

  it(`should skip the sync when expo install fails and forward the exit code`, async () => {
    jest.mocked(runExpoAsync).mockResolvedValue(1);

    await expect(installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']))).resolves.toBe(1);
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();
  });

  it(`should return the exit code of a successful install`, async () => {
    await expect(installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']))).resolves.toBe(0);
  });
});
