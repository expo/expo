import { stripAnsi } from '../../utils/ansi';
import { resolvePackageManagerForHints } from '../../utils/expoCommand';
import { checkDependencies, getDependencyCheckMessage } from '../checkDependenciesOnStart';
import { getVersionedDependenciesAsync } from '../doctor/dependencies/validateDependenciesVersions';

jest.mock('../doctor/dependencies/validateDependenciesVersions', () => ({
  getVersionedDependenciesAsync: jest.fn(),
}));

jest.mock('../../utils/expoCommand', () => ({
  ...jest.requireActual('../../utils/expoCommand'),
  resolvePackageManagerForHints: jest.fn(() => 'pnpm'),
}));

function getMessage(...args: Parameters<typeof getDependencyCheckMessage>) {
  return getDependencyCheckMessage(...args).map(stripAnsi);
}

describe(checkDependencies, () => {
  it('resolves the package manager used for the check command hint', async () => {
    jest.mocked(getVersionedDependenciesAsync).mockResolvedValue([
      {
        packageName: 'expo',
        packageType: 'dependencies',
        actualVersion: '55.0.0',
        expectedVersionOrRange: '~55.0.1',
      },
      {
        packageName: 'expo-router',
        packageType: 'dependencies',
        actualVersion: '5.0.0',
        expectedVersionOrRange: '~5.1.0',
      },
    ]);

    const ref = checkDependencies('/project', { sdkVersion: '55.0.0' }, {});

    await expect(ref.promise).resolves.toEqual({
      expo: { actualVersion: '55.0.0', expectedVersionOrRange: '~55.0.1' },
      otherCount: 1,
      packageManager: 'pnpm',
    });
    expect(resolvePackageManagerForHints).toHaveBeenCalledWith('/project');
  });
});

describe(getDependencyCheckMessage, () => {
  it('returns no lines when everything is up-to-date', () => {
    expect(getMessage(null)).toEqual([]);
    expect(getMessage({ otherCount: 0, packageManager: 'npm' })).toEqual([]);
  });

  it('suggests the expo update and the check command', () => {
    expect(
      getMessage({
        expo: { actualVersion: '55.0.0', expectedVersionOrRange: '~55.0.1' },
        otherCount: 2,
        packageManager: 'npm',
      })
    ).toEqual([
      'An update for expo is available: 55.0.0 → ~55.0.1',
      '2 other packages may need updating. Run npx expo install --check for details.',
    ]);
  });

  it.each([
    ['npm', 'npx expo install --check'],
    ['yarn', 'yarn expo install --check'],
    ['pnpm', 'pnpm expo install --check'],
    ['bun', 'bun expo install --check'],
    ['nub', 'nub expo install --check'],
  ] as const)('formats the check command for %s', (packageManager, command) => {
    expect(getMessage({ otherCount: 1, packageManager })).toEqual([
      `1 package may need updating. Run ${command} for details.`,
    ]);
    expect(
      getMessage({
        expo: { actualVersion: '55.0.0', expectedVersionOrRange: '~55.0.1' },
        otherCount: 3,
        packageManager,
      })[1]
    ).toBe(`3 other packages may need updating. Run ${command} for details.`);
  });
});
