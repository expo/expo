import { autoSyncSkillsAsync, printSkillsForAgentAsync } from '../../skills/skillsAsync';
import { runExpoAsync } from '../../utils/expoCli';
import { reportInstallImpactAsync } from '../impactReport';
import { installAsync } from '../installAsync';
import { resolveInstallPlan } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../impactReport', () => ({ reportInstallImpactAsync: jest.fn() }));
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

  it(`should report the impact of the installed packages`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']));

    expect(reportInstallImpactAsync).toHaveBeenCalledWith(projectRoot, ['expo-sqlite']);
  });

  it(`should report the impact even when the skill sync is off`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-agent-skills']));

    expect(reportInstallImpactAsync).toHaveBeenCalledWith(projectRoot, ['expo-sqlite']);
    expect(autoSyncSkillsAsync).not.toHaveBeenCalled();
  });

  it(`should skip the impact report with --no-impact`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-impact']));

    expect(reportInstallImpactAsync).not.toHaveBeenCalled();
    expect(autoSyncSkillsAsync).toHaveBeenCalled();
  });

  it(`should skip the impact report when the install fails`, async () => {
    jest.mocked(runExpoAsync).mockResolvedValue(1);

    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']));

    expect(reportInstallImpactAsync).not.toHaveBeenCalled();
  });

  it(`should return the exit code of a successful install`, async () => {
    await expect(installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']))).resolves.toBe(0);
  });
});
