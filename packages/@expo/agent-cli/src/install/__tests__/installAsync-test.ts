import * as Log from '../../log';
import type { InstallImpactReport } from '../../project/types';
import {
  autoSyncSkillsAsync,
  listSkillPackagesAsync,
  printSkillsForAgentAsync,
} from '../../skills/skillsAsync';
import { runExpoAsync, spawnExpoAsync } from '../../utils/expoCli';
import { reportInstallImpactAsync } from '../impactReport';
import { installAsync } from '../installAsync';
import { resolveInstallPlan } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn(), spawnExpoAsync: jest.fn() }));
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
  // `clearMocks` empties the call log but keeps implementations, so every mock whose *answer*
  // matters is given its default back here — otherwise one test's answer leaks into the next.
  jest.mocked(runExpoAsync).mockResolvedValue(0);
  jest.mocked(spawnExpoAsync).mockResolvedValue({
    cli: { command: 'expo', args: [] },
    result: { exitCode: 0, stdout: '', stderr: '' },
  });
  jest.mocked(reportInstallImpactAsync).mockResolvedValue([report()]);
  jest.mocked(listSkillPackagesAsync).mockResolvedValue([]);
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
      silent: false,
    });
    expect(printSkillsForAgentAsync).toHaveBeenCalledWith(projectRoot, {
      packages: ['expo-sqlite', '@expo/ui@~1.0.0'],
    });
  });

  it(`should run a full sync when no package is named`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['--fix']));

    expect(autoSyncSkillsAsync).toHaveBeenCalledWith(projectRoot, { silent: false });
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

    expect(reportInstallImpactAsync).toHaveBeenCalledWith(projectRoot, ['expo-sqlite'], {
      silent: false,
    });
  });

  it(`should report the impact even when the skill sync is off`, async () => {
    await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-agent-skills']));

    expect(reportInstallImpactAsync).toHaveBeenCalledWith(projectRoot, ['expo-sqlite'], {
      silent: false,
    });
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

      expect(printed()).toContain('Suggested next:');
      expect(printed()).toContain('npx exagent runtime:reload');
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
      expect(printed()).toContain('Suggested next:');
    });

    it(`should print nothing with --no-followups`, async () => {
      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--no-followups']));

      expect(printed()).not.toContain('Suggested next:');
      expect(listSkillPackagesAsync).not.toHaveBeenCalled();
    });

    it(`should print nothing when there was no impact to classify`, async () => {
      jest.mocked(reportInstallImpactAsync).mockResolvedValue([]);

      await installAsync(projectRoot, resolveInstallPlan(['--fix']));

      expect(printed()).not.toContain('Suggested next:');
    });

    it(`should print nothing when the install itself failed`, async () => {
      jest.mocked(runExpoAsync).mockResolvedValue(1);

      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite']));

      expect(printed()).not.toContain('Suggested next:');
    });
  });

  // @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
  // The one machine-readable answer this command never had. Everything the human output knows
  // travels in it, and nothing else reaches stdout.
  describe('--json', () => {
    /** The one object the command printed on stdout. */
    function payload(): any {
      const calls = jest.mocked(Log.log).mock.calls;
      expect(calls).toHaveLength(1);
      return JSON.parse(calls[0]![0]!);
    }

    it(`should print one object carrying what the human output knows`, async () => {
      jest.mocked(listSkillPackagesAsync).mockResolvedValue(['@expo/ui']);

      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--json']));

      expect(payload()).toEqual({
        projectRoot,
        packages: ['expo-sqlite'],
        installed: true,
        exitCode: 0,
        impact: [report()],
        skillPackages: ['@expo/ui'],
        check: null,
        followups: expect.any(Array),
      });
    });

    it(`should keep every other line off stdout`, async () => {
      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--json']));

      // The impact table and the skill sync notice each stay away by asking the thing that
      // prints them not to.
      expect(reportInstallImpactAsync).toHaveBeenCalledWith(projectRoot, ['expo-sqlite'], {
        silent: true,
      });
      expect(autoSyncSkillsAsync).toHaveBeenCalledWith(
        projectRoot,
        expect.objectContaining({ silent: true })
      );
      expect(printSkillsForAgentAsync).not.toHaveBeenCalled();
      expect(printed()).not.toContain('Suggested next:');
    });

    it(`should capture the subprocess instead of letting it write into the object`, async () => {
      jest.mocked(spawnExpoAsync).mockResolvedValue({
        cli: { command: 'expo', args: [] },
        result: { exitCode: 0, stdout: 'added 3 packages\n', stderr: '' },
      });

      await installAsync(projectRoot, resolveInstallPlan(['expo-sqlite', '--json']));

      expect(runExpoAsync).not.toHaveBeenCalled();
      expect(spawnExpoAsync).toHaveBeenCalledWith(projectRoot, ['install', 'expo-sqlite'], {
        output: 'capture',
      });
      // What the tool printed is a person's answer, so it goes where nothing is parsing.
      expect(jest.mocked(Log.error).mock.calls.flat().join('\n')).toContain('added 3 packages');
      expect(payload().installed).toBe(true);
    });

    it(`should print one object for a failed install too`, async () => {
      jest.mocked(spawnExpoAsync).mockResolvedValue({
        cli: { command: 'expo', args: [] },
        result: { exitCode: 4, stdout: '', stderr: 'no such package\n' },
      });

      await expect(
        installAsync(projectRoot, resolveInstallPlan(['nope', '--json']))
      ).resolves.toBe(4);
      expect(payload()).toMatchObject({ installed: false, exitCode: 4, impact: [] });
    });

    // The `--check` report belongs to the Expo CLI, so it is carried rather than restated.
    it(`should carry the Expo CLI's own report for a --check run`, async () => {
      jest.mocked(spawnExpoAsync).mockResolvedValue({
        cli: { command: 'expo', args: [] },
        result: { exitCode: 0, stdout: '{"dependencies":[],"upToDate":true}\n', stderr: '' },
      });

      await installAsync(projectRoot, resolveInstallPlan(['--check', '--json']));

      expect(payload()).toMatchObject({
        installed: false,
        check: {
          ok: true,
          report: { dependencies: [], upToDate: true },
          output: null,
          notes: [],
        },
      });
      // A passing check has nothing to add, and the CLI's own report is the answer, so its stdout
      // does not also arrive on stderr.
      expect(jest.mocked(Log.error)).not.toHaveBeenCalled();
    });

    // F130 [live, wave 31]: the Expo CLI prints the *passing* report on one line and the *failing*
    // one pretty-printed — `JSON.stringify({dependencies: [], upToDate: true})` against
    // `JSON.stringify({dependencies, upToDate: false}, null, 2)` [observed —
    // `@expo/cli` `src/install/checkPackages.ts`, SDK 57]. A parse that reads one line at a time
    // therefore carried the report that says nothing and dropped the only one with content in it:
    // live on a project pinned to `expo-haptics@14.0.1`, `check.report` was null and the answer —
    // which package, which version, which range — survived only as a string in `check.output`
    // [`wave31-open-cells/evidence/10-install-check-mismatch.out`].
    it(`should carry the Expo CLI's report when it is pretty-printed over several lines`, async () => {
      const stdout = `${JSON.stringify(
        {
          dependencies: [
            {
              packageName: 'expo-haptics',
              packageType: 'dependencies',
              expectedVersionOrRange: '~57.0.2',
              actualVersion: '14.0.1',
            },
          ],
          upToDate: false,
        },
        null,
        2
      )}\n`;
      jest.mocked(spawnExpoAsync).mockResolvedValue({
        cli: { command: 'expo', args: [] },
        result: { exitCode: 1, stdout, stderr: '' },
      });

      await expect(
        installAsync(projectRoot, resolveInstallPlan(['--check', '--json']))
      ).resolves.toBe(1);

      const check = payload().check;
      expect(check.ok).toBe(false);
      expect(check.report).toEqual({
        dependencies: [
          {
            packageName: 'expo-haptics',
            packageType: 'dependencies',
            expectedVersionOrRange: '~57.0.2',
            actualVersion: '14.0.1',
          },
        ],
        upToDate: false,
      });
      // A report that was carried is not also echoed as prose, the same as the passing case.
      expect(check.output).toBeNull();
      expect(jest.mocked(Log.error)).not.toHaveBeenCalled();
    });

    // F29: the Expo CLI throws `PACKAGE_NOT_FOUND` before it prints its report, so stdout is empty
    // and the whole diagnosis is in what it wrote to stderr — which this command used to suppress,
    // leaving an agent with exit 1, a success-shaped object and zero bytes anywhere.
    it(`should carry the diagnosis when the check failed before printing a report`, async () => {
      jest.mocked(spawnExpoAsync).mockResolvedValue({
        cli: { command: 'expo', args: [] },
        result: {
          exitCode: 1,
          stdout: '',
          stderr:
            '"@react-native-async-storage/async-storage" is added as a dependency in your project\'s package.json but it doesn\'t seem to be installed.\n',
        },
      });

      await expect(
        installAsync(
          projectRoot,
          resolveInstallPlan(['--check', '--json', '@react-native-async-storage/async-storage'])
        )
      ).resolves.toBe(1);

      const check = payload().check;
      expect(check.ok).toBe(false);
      expect(check.report).toBeNull();
      expect(check.output).toContain('doesn\'t seem to be installed');
      // And the Expo CLI's claim about package.json is corrected, because this command read it.
      expect(check.notes).toHaveLength(1);
      expect(check.notes[0]).toContain(
        `"@react-native-async-storage/async-storage" is not in this project's package.json`
      );
      expect(check.notes[0]).toContain('npx exagent install');
      // The verdict is never only in a key the caller might not read.
      expect(jest.mocked(Log.error).mock.calls.flat().join('\n')).toContain(
        'doesn\'t seem to be installed'
      );
    });
  });

  // The same correction reaches the terminal, where the Expo CLI printed the claim itself.
  it(`should correct the Expo CLI's package.json claim in a human --check run`, async () => {
    jest.mocked(runExpoAsync).mockResolvedValue(1);

    await expect(
      installAsync(projectRoot, resolveInstallPlan(['--check', 'expo-camera']))
    ).resolves.toBe(1);

    expect(jest.mocked(Log.error).mock.calls.flat().join('\n')).toContain(
      `"expo-camera" is not in this project's package.json`
    );
  });

  it(`should stay quiet about a check that passed`, async () => {
    jest.mocked(runExpoAsync).mockResolvedValue(0);

    await installAsync(projectRoot, resolveInstallPlan(['--check', 'expo-camera']));

    expect(jest.mocked(Log.error)).not.toHaveBeenCalled();
  });
});
