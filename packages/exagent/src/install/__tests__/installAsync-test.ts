import { checkpointBeforeAsync } from '../../checkpoint/integration';
import * as Log from '../../log';
import type { InstallImpactReport } from '../../project/types';
import {
  autoSyncSkillsAsync,
  listSkillPackagesAsync,
  printSkillsForAgentAsync,
} from '../../skills/skillsAsync';
import { runExpoAsync } from '../../utils/expoCli';
import { reportInstallImpactAsync } from '../impactReport';
import { installAsync } from '../installAsync';
import { resolveInstallPlan } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../checkpoint/integration', () => ({ checkpointBeforeAsync: jest.fn() }));
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));
jest.mock('../impactReport', () => ({ reportInstallImpactAsync: jest.fn() }));
jest.mock('../../skills/skillsAsync', () => ({
  autoSyncSkillsAsync: jest.fn(),
  listSkillPackagesAsync: jest.fn(),
  printSkillsForAgentAsync: jest.fn(),
}));

const projectRoot = '/project';

function report(overrides: Partial<InstallImpactReport> = {}): InstallImpactReport {
  return {
    packageName: 'expo-sqlite',
    impact: 'js-only',
    expoGoBundled: false,
    action: 'reload',
    reasons: [],
    ...overrides,
  };
}

/** Everything the command printed, joined into one string. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

beforeEach(() => {
  jest.mocked(runExpoAsync).mockResolvedValue(0);
  jest.mocked(reportInstallImpactAsync).mockResolvedValue([report()]);
  jest.mocked(listSkillPackagesAsync).mockResolvedValue([]);
});

describe(installAsync, () => {
  it(`should snapshot the project before expo install runs`, async () => {
    const order: string[] = [];
    jest.mocked(checkpointBeforeAsync).mockImplementation(async () => {
      order.push('checkpoint');
      return { record: null, files: 0, skipped: 'not-a-git-repo', detail: '' };
    });
    jest.mocked(runExpoAsync).mockImplementation(async () => {
      order.push('install');
      return 0;
    });

    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']));

    expect(checkpointBeforeAsync).toHaveBeenCalledWith(projectRoot, {
      label: 'exagent install',
      enabled: true,
    });
    expect(order).toEqual(['checkpoint', 'install']);
  });

  it(`should skip the snapshot with --no-checkpoint`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-checkpoint']));

    expect(checkpointBeforeAsync).toHaveBeenCalledWith(projectRoot, {
      label: 'exagent install',
      enabled: false,
    });
  });

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

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `install`.
  describe('follow-ups', () => {
    it(`should say a reload is enough after a JavaScript only install`, async () => {
      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']));

      expect(printed()).toContain('Next (optional):');
      expect(printed()).toContain('npx exagent runtime:errors');
      expect(printed()).toContain('reload');
    });

    it(`should warn that the running app cannot load a new native module`, async () => {
      jest.mocked(reportInstallImpactAsync).mockResolvedValue([
        report({
          packageName: 'react-native-fancy',
          impact: 'native-module',
          action: 'prebuild-and-build',
        }),
      ]);

      await installAsync(projectRoot, resolveInstallPlan(['react-native-fancy']));

      expect(printed()).toContain('npx exagent dev');
      expect(printed()).toContain('react-native-fancy');
    });

    it(`should point at the skill of a package that ships one`, async () => {
      jest.mocked(listSkillPackagesAsync).mockResolvedValue(['@expo/ui']);

      await installAsync(projectRoot, resolveInstallPlan(['@expo/ui@~1.0.0']));

      expect(listSkillPackagesAsync).toHaveBeenCalledWith(projectRoot, ['@expo/ui@~1.0.0']);
      expect(printed()).toContain('npx exagent skills:show @expo/ui');
    });

    it(`should not look for skills when the skill sync is off`, async () => {
      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-agent-skills']));

      expect(listSkillPackagesAsync).not.toHaveBeenCalled();
      // The impact report is independent of the skill flags, so it still drives a follow-up.
      expect(printed()).toContain('Next (optional):');
    });

    it(`should print nothing with --no-followups`, async () => {
      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-followups']));

      expect(printed()).not.toContain('Next (optional):');
      expect(listSkillPackagesAsync).not.toHaveBeenCalled();
    });

    it(`should print nothing when there was no impact to classify`, async () => {
      jest.mocked(reportInstallImpactAsync).mockResolvedValue([]);

      await installAsync(projectRoot, resolveInstallPlan(['--fix']));

      expect(printed()).not.toContain('Next (optional):');
    });

    it(`should print nothing when the install itself failed`, async () => {
      jest.mocked(runExpoAsync).mockResolvedValue(1);

      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']));

      expect(printed()).not.toContain('Next (optional):');
    });
  });
});
