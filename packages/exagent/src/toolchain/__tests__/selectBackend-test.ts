/* eslint-env jest */
// @ref llp/0015-backend-selection-and-config.rfc.md §The selection
// The whole matrix — host × toolchain × config × flag — as a table, because the selection is a
// pure function and there is no reason to test it any other way.
import type { NativePlatform } from '../../plan/types';
import type { BuildBackend } from '../../settings/types';
import { selectBuildBackend, type BackendSource } from '../selectBackend';
import type { ToolchainProbe, ToolchainStatus } from '../types';

/** A probe answer, in the shape `detect.ts` produces for that host. */
function probeOf(
  platform: NativePlatform,
  status: ToolchainStatus | null,
  { impossible = false }: { impossible?: boolean } = {}
): ToolchainProbe | null {
  if (status == null) {
    return null;
  }
  return {
    platform,
    status,
    detail: `probe detail for ${platform}.`,
    requirement: platform === 'ios' ? 'Xcode on this machine' : 'the Android SDK on this machine',
    caveats: [],
    impossible,
  };
}

interface Row {
  name: string;
  platform: NativePlatform;
  hostPlatform: NodeJS.Platform;
  status: ToolchainStatus | null;
  impossible?: boolean;
  requested?: BuildBackend | null;
  configured?: BuildBackend | null;
  expected: { runsOn: 'local' | 'eas'; source: BackendSource; doomed?: boolean };
}

const ROWS: Row[] = [
  // Detection alone.
  {
    name: 'macOS with Xcode builds iOS here',
    platform: 'ios',
    hostPlatform: 'darwin',
    status: 'present',
    expected: { runsOn: 'local', source: 'default' },
  },
  {
    name: 'macOS without Xcode builds iOS on EAS',
    platform: 'ios',
    hostPlatform: 'darwin',
    status: 'missing',
    expected: { runsOn: 'eas', source: 'toolchain' },
  },
  {
    name: 'Linux builds iOS on EAS, and the reason is the host',
    platform: 'ios',
    hostPlatform: 'linux',
    status: 'missing',
    impossible: true,
    expected: { runsOn: 'eas', source: 'host' },
  },
  {
    name: 'Windows builds iOS on EAS, and the reason is the host',
    platform: 'ios',
    hostPlatform: 'win32',
    status: 'missing',
    impossible: true,
    expected: { runsOn: 'eas', source: 'host' },
  },
  {
    name: 'a host with no Android SDK builds Android on EAS',
    platform: 'android',
    hostPlatform: 'darwin',
    status: 'missing',
    expected: { runsOn: 'eas', source: 'toolchain' },
  },
  {
    name: 'Linux with the Android SDK builds Android here',
    platform: 'android',
    hostPlatform: 'linux',
    status: 'present',
    expected: { runsOn: 'local', source: 'default' },
  },
  {
    name: 'a probe that established nothing leaves the build here',
    platform: 'ios',
    hostPlatform: 'darwin',
    status: 'unknown',
    expected: { runsOn: 'local', source: 'default' },
  },
  {
    name: 'nothing probed at all leaves the build here',
    platform: 'ios',
    hostPlatform: 'darwin',
    status: null,
    expected: { runsOn: 'local', source: 'default' },
  },

  // The config, which beats detection.
  {
    name: 'config eas moves a build off a machine that could do it',
    platform: 'ios',
    hostPlatform: 'darwin',
    status: 'present',
    configured: 'eas',
    expected: { runsOn: 'eas', source: 'config' },
  },
  {
    name: 'config local keeps a build here when the toolchain is merely missing',
    platform: 'android',
    hostPlatform: 'darwin',
    status: 'missing',
    configured: 'local',
    expected: { runsOn: 'local', source: 'config' },
  },
  {
    name: 'config local on a host that cannot build is honoured and marked doomed',
    platform: 'ios',
    hostPlatform: 'linux',
    status: 'missing',
    impossible: true,
    configured: 'local',
    expected: { runsOn: 'local', source: 'config', doomed: true },
  },

  // A flag, which beats the config.
  {
    name: 'a flag beats a config that says the opposite',
    platform: 'ios',
    hostPlatform: 'darwin',
    status: 'present',
    configured: 'eas',
    requested: 'local',
    expected: { runsOn: 'local', source: 'flag' },
  },
  {
    name: '--eas beats a config that says local',
    platform: 'android',
    hostPlatform: 'darwin',
    status: 'present',
    configured: 'local',
    requested: 'eas',
    expected: { runsOn: 'eas', source: 'flag' },
  },
  {
    name: '--local on a host that cannot build is honoured and marked doomed',
    platform: 'ios',
    hostPlatform: 'win32',
    status: 'missing',
    impossible: true,
    requested: 'local',
    expected: { runsOn: 'local', source: 'flag', doomed: true },
  },
];

describe('choosing where a build runs', () => {
  it.each(ROWS)('$name', (row) => {
    const choice = selectBuildBackend({
      platform: row.platform,
      hostPlatform: row.hostPlatform,
      requested: row.requested ?? null,
      configured: row.configured ?? null,
      probe: probeOf(row.platform, row.status, { impossible: row.impossible }),
    });

    expect(choice.runsOn).toBe(row.expected.runsOn);
    expect(choice.source).toBe(row.expected.source);
    expect(choice.doomed).toBe(row.expected.doomed ?? false);
    // Every choice explains itself, because the plan prints this sentence verbatim.
    expect(choice.why).not.toBe('');
  });
});

describe('what the reason says', () => {
  it(`names the host when the host is what decided it`, () => {
    const choice = selectBuildBackend({
      platform: 'ios',
      hostPlatform: 'linux',
      requested: null,
      configured: null,
      probe: probeOf('ios', 'missing', { impossible: true }),
    });
    expect(choice.why).toContain('this host runs linux');
    expect(choice.why).toContain('Xcode');
    expect(choice.why).toContain('No install here would change that');
  });

  it(`says how to fix a toolchain that is merely missing`, () => {
    const choice = selectBuildBackend({
      platform: 'android',
      hostPlatform: 'linux',
      requested: null,
      configured: null,
      probe: probeOf('android', 'missing'),
    });
    expect(choice.why).toContain('this machine does not have the Android SDK');
    expect(choice.why).toContain('Install it to build here instead');
  });

  it(`labels a config-driven choice as the config's`, () => {
    const choice = selectBuildBackend({
      platform: 'ios',
      hostPlatform: 'darwin',
      requested: null,
      configured: 'eas',
      probe: probeOf('ios', 'present'),
    });
    expect(choice.why).toContain('per exagent config');
  });

  it(`labels a flag-driven choice as the command line's`, () => {
    const choice = selectBuildBackend({
      platform: 'ios',
      hostPlatform: 'darwin',
      requested: 'eas',
      configured: null,
      probe: probeOf('ios', 'present'),
    });
    expect(choice.why).toContain('--eas was passed on the command line');
  });

  it(`warns inside the reason when an explicit local choice cannot work here`, () => {
    const choice = selectBuildBackend({
      platform: 'ios',
      hostPlatform: 'linux',
      requested: null,
      configured: 'local',
      probe: probeOf('ios', 'missing', { impossible: true }),
    });
    expect(choice.why).toContain('this host cannot build for ios at all');
  });

  it(`offers --eas when the probe could not tell`, () => {
    const choice = selectBuildBackend({
      platform: 'ios',
      hostPlatform: 'darwin',
      requested: null,
      configured: null,
      probe: probeOf('ios', 'unknown'),
    });
    expect(choice.why).toContain('could not be established');
    expect(choice.why).toContain('--eas');
  });
});
