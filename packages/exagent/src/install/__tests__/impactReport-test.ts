import * as Log from '../../log';
import { classifyInstallImpactAsync } from '../../project/impact';
import type { InstallImpactReport } from '../../project/types';
import { reportInstallImpactAsync } from '../impactReport';

jest.mock('../../log');
jest.mock('../../project/impact', () => ({ classifyInstallImpactAsync: jest.fn() }));

const projectRoot = '/project';

function report(overrides: Partial<InstallImpactReport> = {}): InstallImpactReport {
  return {
    packageName: 'expo-camera',
    impact: 'native-module',
    expoGoBundled: false,
    action: 'prebuild-and-build',
    reasons: ['ships an ios/ directory'],
    ...overrides,
  };
}

/** Everything the report printed, joined into one string. */
function output(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

describe(reportInstallImpactAsync, () => {
  it(`should classify the installed packages and print one line each`, async () => {
    jest
      .mocked(classifyInstallImpactAsync)
      .mockResolvedValue([
        report(),
        report({ packageName: 'zod', impact: 'js-only', action: 'reload', reasons: ['no native'] }),
      ]);

    await reportInstallImpactAsync(projectRoot, ['expo-camera', 'zod']);

    expect(classifyInstallImpactAsync).toHaveBeenCalledWith(projectRoot, ['expo-camera', 'zod']);
    const lines = output().split('\n');
    expect(lines.filter((line) => line.includes('expo-camera'))).toHaveLength(1);
    expect(lines.filter((line) => line.includes('zod'))).toHaveLength(1);
  });

  it(`should explain the action of every classification`, async () => {
    jest
      .mocked(classifyInstallImpactAsync)
      .mockResolvedValue([
        report({ packageName: 'a', action: 'prebuild-and-build' }),
        report({ packageName: 'b', action: 'native-sync' }),
        report({ packageName: 'c', action: 'reload' }),
        report({ packageName: 'd', action: 'none' }),
      ]);

    await reportInstallImpactAsync(projectRoot, ['a', 'b', 'c', 'd']);

    const text = output();
    expect(text).toContain('prebuild');
    expect(text).toContain('pod install');
    expect(text).toContain('reload the app');
    expect(text).toContain('nothing has to rerun');
  });

  it(`should print the reasons of a classification`, async () => {
    jest
      .mocked(classifyInstallImpactAsync)
      .mockResolvedValue([report({ reasons: ['ships an ios/ directory'] })]);

    await reportInstallImpactAsync(projectRoot, ['expo-camera']);

    expect(output()).toContain('ships an ios/ directory');
  });

  it(`should print nothing when there is nothing to classify`, async () => {
    jest.mocked(classifyInstallImpactAsync).mockResolvedValue([]);

    await reportInstallImpactAsync(projectRoot, []);

    expect(Log.log).not.toHaveBeenCalled();
  });

  it(`should warn but never throw when the classification fails`, async () => {
    jest
      .mocked(classifyInstallImpactAsync)
      .mockRejectedValue(new Error('node_modules disappeared'));

    await expect(reportInstallImpactAsync(projectRoot, ['expo-camera'])).resolves.toBeUndefined();
    expect(Log.warn).toHaveBeenCalled();
  });
});
