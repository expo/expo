import { vol } from 'memfs';

import { fetch } from '../../../../utils/fetch';
import { filterDependenciesBlockedByPackageManagerAgeGateAsync } from '../packageManagerReleaseAge';

jest.mock('../../../../utils/fetch', () => ({
  fetch: jest.fn(),
}));

const projectRoot = '/test-project';

function mockRegistryTimes(times: Record<string, string>) {
  jest.mocked(fetch).mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ time: times }),
  } as any);
}

describe(filterDependenciesBlockedByPackageManagerAgeGateAsync, () => {
  beforeEach(() => {
    vol.reset();
    jest.mocked(fetch).mockReset();
  });

  it('skips warnings when Yarn npmMinimalAgeGate still blocks the expected version', async () => {
    vol.fromJSON(
      {
        '.yarnrc.yml': 'npmMinimalAgeGate: 1440\n',
      },
      projectRoot
    );
    mockRegistryTimes({ '1.2.3': '2026-05-24T00:00:00.000Z' });

    await expect(
      filterDependenciesBlockedByPackageManagerAgeGateAsync(
        projectRoot,
        [
          {
            packageName: 'expo-splash-screen',
            packageType: 'dependencies',
            expectedVersionOrRange: '~1.2.3',
            actualVersion: '1.2.2',
          },
        ],
        new Date('2026-05-24T12:00:00.000Z')
      )
    ).resolves.toEqual([]);
  });

  it('keeps warnings when the expected version is older than the configured age gate', async () => {
    vol.fromJSON(
      {
        '.npmrc': 'minimumReleaseAge=60\n',
      },
      projectRoot
    );
    mockRegistryTimes({ '1.2.3': '2026-05-24T00:00:00.000Z' });

    const deps = [
      {
        packageName: 'expo-updates',
        packageType: 'dependencies' as const,
        expectedVersionOrRange: '~1.2.3',
        actualVersion: '1.2.2',
      },
    ];

    await expect(
      filterDependenciesBlockedByPackageManagerAgeGateAsync(
        projectRoot,
        deps,
        new Date('2026-05-24T02:00:00.000Z')
      )
    ).resolves.toEqual(deps);
  });

  it('respects package manager exclusion lists', async () => {
    vol.fromJSON(
      {
        'pnpm-workspace.yaml': 'minimumReleaseAge: 1440\nminimumReleaseAgeExclude:\n  - expo-*\n',
      },
      projectRoot
    );
    mockRegistryTimes({ '1.2.3': '2026-05-24T00:00:00.000Z' });

    const deps = [
      {
        packageName: 'expo-splash-screen',
        packageType: 'dependencies' as const,
        expectedVersionOrRange: '~1.2.3',
        actualVersion: '1.2.2',
      },
    ];

    await expect(
      filterDependenciesBlockedByPackageManagerAgeGateAsync(
        projectRoot,
        deps,
        new Date('2026-05-24T12:00:00.000Z')
      )
    ).resolves.toEqual(deps);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('supports Bun minimumReleaseAge seconds and fail-opens when registry metadata is unavailable', async () => {
    vol.fromJSON(
      {
        'bunfig.toml': 'minimumReleaseAge = 86400\n',
      },
      projectRoot
    );
    jest.mocked(fetch).mockResolvedValue({ ok: false } as any);

    const deps = [
      {
        packageName: 'expo-updates',
        packageType: 'dependencies' as const,
        expectedVersionOrRange: '~1.2.3',
        actualVersion: '1.2.2',
      },
    ];

    await expect(
      filterDependenciesBlockedByPackageManagerAgeGateAsync(
        projectRoot,
        deps,
        new Date('2026-05-24T12:00:00.000Z')
      )
    ).resolves.toEqual(deps);
  });
});
