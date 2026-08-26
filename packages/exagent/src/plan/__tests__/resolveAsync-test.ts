/* eslint-env jest */
// @ref llp/0015-backend-selection-and-config.rfc.md §The selection
// The order the four inputs are read in — flag, config, host, probe — and the plan that comes out
// of each. The probe is stubbed; which probe answers what is `detect-test.ts`'s subject, and which
// answer wins is `selectBackend-test.ts`'s.
import { vol } from 'memfs';

import type { ProjectState } from '../../project/types';
import { resetSettingsCache } from '../../settings';
import { detectToolchainAsync } from '../../toolchain';
import type { ToolchainProbe, ToolchainStatus } from '../../toolchain/types';
import { resolveStartPlanAsync } from '../resolveAsync';

jest.mock('../../toolchain', () => {
  const actual = jest.requireActual('../../toolchain');
  return { ...actual, detectToolchainAsync: jest.fn() };
});

const projectRoot = '/project';

function stubToolchain(status: ToolchainStatus, { impossible = false } = {}): void {
  jest.mocked(detectToolchainAsync).mockImplementation(
    async (platform): Promise<ToolchainProbe> => ({
      platform,
      status,
      detail: `The ${platform} toolchain is ${status}, for this test.`,
      requirement: `the ${platform} toolchain on this machine`,
      caveats: [],
      impossible,
    })
  );
}

/** A managed project that needs a development build, so every plan of it contains a build. */
function devClientState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot,
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: true,
    hasWeb: false,
    expoGo: { compatible: false, reasons: [] },
    fingerprint: { hash: 'abc123def4567890' },
    ...overrides,
  };
}

/** A project Expo Go can run, whose plan builds nothing. */
function expoGoState(): ProjectState {
  return devClientState({ usesDevClient: false, expoGo: { compatible: true, reasons: [] } });
}

function writeProject(files: Record<string, unknown> = {}): void {
  vol.fromJSON(
    Object.fromEntries(
      Object.entries({ 'package.json': { name: 'app' }, ...files }).map(([name, contents]) => [
        `${projectRoot}/${name}`,
        typeof contents === 'string' ? contents : JSON.stringify(contents),
      ])
    )
  );
}

function argvOf(plan: { steps: { argv: string[] }[] }): string[][] {
  return plan.steps.map((step) => step.argv);
}

beforeEach(() => {
  resetSettingsCache();
  vol.reset();
  stubToolchain('present');
});

describe('a plan that builds nothing', () => {
  it(`asks the machine nothing at all`, async () => {
    writeProject();
    const plan = await resolveStartPlanAsync(projectRoot, expoGoState(), { platform: 'ios' });

    expect(plan.rule).toBe('expo-go');
    expect(detectToolchainAsync).not.toHaveBeenCalled();
  });
});

describe('detection', () => {
  it(`builds here when this machine has the toolchain`, async () => {
    writeProject();
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    expect(argvOf(plan)).toEqual([
      ['expo', 'prebuild', '--platform', 'ios'],
      ['expo', 'run:ios'],
    ]);
    expect(plan.buildLocation).toMatchObject({ runsOn: 'local' });
  });

  it(`builds on EAS when this machine does not`, async () => {
    writeProject({ 'eas.json': { build: {} } });
    stubToolchain('missing');
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    expect(argvOf(plan)).toEqual([
      ['eas', 'build', '--platform', 'ios', '--profile', 'development'],
      ['expo', 'start', '--dev-client'],
    ]);
    expect(plan.buildLocation).toMatchObject({ runsOn: 'eas', selection: { source: 'toolchain' } });
  });

  it(`blames the host, not the install, when no install could help`, async () => {
    writeProject({ 'eas.json': { build: {} } });
    stubToolchain('missing', { impossible: true });
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), {
      platform: 'ios',
      hostPlatform: 'linux',
    });

    expect(plan.buildLocation).toMatchObject({ runsOn: 'eas', selection: { source: 'host' } });
    expect(plan.buildLocation!.selection!.why).toContain('this host runs linux');
  });

  it(`keeps the local plan when the probe established nothing`, async () => {
    writeProject();
    stubToolchain('unknown');
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    expect(plan.buildLocation).toMatchObject({ runsOn: 'local' });
  });

  it(`configures eas.json first when the cloud route is taken and the project has none`, async () => {
    writeProject();
    stubToolchain('missing');
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    expect(argvOf(plan)[0]).toEqual(['eas', 'build:configure']);
  });

  it(`skips that step when the project already has an eas.json`, async () => {
    writeProject({ 'eas.json': { build: {} } });
    stubToolchain('missing');
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    expect(argvOf(plan)[0]).toEqual([
      'eas',
      'build',
      '--platform',
      'ios',
      '--profile',
      'development',
    ]);
  });

  it(`carries the probe's caveats into a plan that still builds here`, async () => {
    writeProject();
    jest.mocked(detectToolchainAsync).mockResolvedValue({
      platform: 'android',
      status: 'present',
      detail: 'Android SDK at /sdk.',
      requirement: 'the Android SDK on this machine',
      caveats: ['adb is not on PATH, though it is at /sdk/platform-tools.'],
      impossible: false,
    });
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), {
      platform: 'android',
    });

    expect(plan.reasons).toContain('adb is not on PATH, though it is at /sdk/platform-tools.');
  });
});

describe('the project config', () => {
  it(`moves a build to EAS on a machine that could do it here`, async () => {
    writeProject({ 'package.json': { name: 'app', expo: { exagent: { buildBackend: 'eas' } } } });
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    expect(plan.buildLocation).toMatchObject({ runsOn: 'eas', selection: { source: 'config' } });
    expect(plan.reasons).toContain(
      'Building in the cloud on EAS: the exagent config asks for it — "expo.exagent" in package.json.'
    );
  });

  it(`asks this machine nothing when it already said "the cloud"`, async () => {
    writeProject({ 'package.json': { name: 'app', expo: { exagent: { buildBackend: 'eas' } } } });
    await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });

    // Two subprocesses that cannot change the answer are two subprocesses not spawned.
    expect(detectToolchainAsync).not.toHaveBeenCalled();
  });

  it(`applies a per-platform choice to that platform only`, async () => {
    writeProject({
      'package.json': {
        name: 'app',
        expo: { exagent: { ios: { buildBackend: 'eas' } } },
      },
    });

    const ios = await resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' });
    const android = await resolveStartPlanAsync(projectRoot, devClientState(), {
      platform: 'android',
    });

    expect(ios.buildLocation).toMatchObject({ runsOn: 'eas' });
    expect(android.buildLocation).toMatchObject({ runsOn: 'local' });
  });

  it(`plans a development build for a project Expo Go could run`, async () => {
    writeProject({ 'package.json': { name: 'app', expo: { exagent: { target: 'dev-build' } } } });
    const plan = await resolveStartPlanAsync(projectRoot, expoGoState(), { platform: 'ios' });

    expect(plan.rule).toBe('needs-dev-client');
    expect(plan.reasons).toContain(
      'The exagent config asks for a development build. Expo Go could run this project, and the plan builds one anyway.'
    );
  });

  it(`refuses a config it cannot read, rather than planning as though it were absent`, async () => {
    writeProject({ 'package.json': { name: 'app', expo: { exagent: { buildBackend: 'cloud' } } } });

    await expect(
      resolveStartPlanAsync(projectRoot, devClientState(), { platform: 'ios' })
    ).rejects.toThrow(/"expo.exagent" in package.json/);
  });
});

describe('a flag on the command line', () => {
  it(`beats a config that says the opposite`, async () => {
    writeProject({ 'package.json': { name: 'app', expo: { exagent: { buildBackend: 'eas' } } } });
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), {
      platform: 'ios',
      requestedBackend: 'local',
    });

    expect(plan.buildLocation).toMatchObject({ runsOn: 'local', selection: { source: 'flag' } });
  });

  it(`beats detection, and is honoured even where it cannot work`, async () => {
    writeProject();
    stubToolchain('missing', { impossible: true });
    const plan = await resolveStartPlanAsync(projectRoot, devClientState(), {
      platform: 'ios',
      hostPlatform: 'win32',
      requestedBackend: 'local',
    });

    expect(argvOf(plan)).toEqual([
      ['expo', 'prebuild', '--platform', 'ios'],
      ['expo', 'run:ios'],
    ]);
    expect(plan.buildLocation!.selection).toMatchObject({ source: 'flag', doomed: true });
    expect(plan.reasons).toContain(
      'That was asked for explicitly, so the plan above is the plan that runs — and its build step will fail, because nothing on this host can perform it. Remove the choice, or pass --eas, to build for ios in the cloud on EAS instead.'
    );
  });

  it(`beats a config that asks for Expo Go`, async () => {
    writeProject({ 'package.json': { name: 'app', expo: { exagent: { target: 'expo-go' } } } });
    const plan = await resolveStartPlanAsync(projectRoot, expoGoState(), {
      platform: 'ios',
      requestedTarget: 'dev-build',
    });

    expect(plan.rule).toBe('needs-dev-client');
    expect(plan.reasons).toContain(
      '--dev-client asked for a development build. Expo Go could run this project, and the plan builds one anyway.'
    );
  });
});
