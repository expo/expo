/* eslint-env jest */
// @ref llp/0013-doctor-fix.rfc.md §The tier table
import {
  EXCLUDED_STEPS,
  FIX_STEPS,
  metroFileMapPrefixes,
  planOrder,
  stepsForTier,
  tierIncludes,
  type FixStepContext,
} from '../fixSteps';
import { FIX_TIERS } from '../fixTypes';

function context(overrides: Partial<FixStepContext> = {}): FixStepContext {
  return {
    projectRoot: '/home/dev/app',
    tmpDir: '/tmp/T',
    homeDir: '/home/dev',
    platform: 'darwin',
    platforms: ['ios', 'android'],
    nativeDirs: { ios: true, android: true },
    hasPodfile: true,
    xcodeProjectNames: ['MyApp'],
    hasWatchman: true,
    packageManager: { name: 'pnpm', installCwd: '/home/dev/app' },
    ...overrides,
  };
}

describe('the table itself', () => {
  it('has a unique id per step', () => {
    const ids = FIX_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every step exactly one way to act', () => {
    for (const step of FIX_STEPS) {
      if (step.kind === 'delete') {
        expect(`${step.id}: ${!!step.targets}`).toBe(`${step.id}: true`);
        expect(`${step.id}: ${!!step.argv}`).toBe(`${step.id}: false`);
      } else if (step.kind === 'command') {
        expect(`${step.id}: ${!!step.argv}`).toBe(`${step.id}: true`);
        expect(`${step.id}: ${!!step.targets}`).toBe(`${step.id}: false`);
      } else {
        expect(`${step.id}: ${!!step.argv && !!step.targets}`).toBe(`${step.id}: true`);
      }
    }
  });

  // A step whose reason and recovery are empty leaves an agent with a path and no way to weigh it.
  it('says why each step is worth taking and what puts it back', () => {
    for (const step of FIX_STEPS) {
      expect(`${step.id}: ${step.reason.length > 20}`).toBe(`${step.id}: true`);
      expect(`${step.id}: ${step.recoverable.length > 5}`).toBe(`${step.id}: true`);
    }
  });

  // The flag is the whole guardrail on a machine-wide step, so nothing may be `machine` by
  // accident: these three are the list, and adding a fourth is a decision somebody has to make.
  it('scopes exactly three steps as machine-wide', () => {
    expect(FIX_STEPS.filter((step) => step.scope === 'machine').map((step) => step.id)).toEqual([
      'metro-transform-cache',
      'derived-data',
      'watchman-all',
    ]);
  });

  it('names the excluded steps rather than dropping them silently', () => {
    expect(EXCLUDED_STEPS.map((excluded) => excluded.command)).toEqual([
      'npm cache clean --force',
      'yarn cache clean',
    ]);
  });
});

describe('tierIncludes', () => {
  it('is cumulative', () => {
    expect(tierIncludes('safe', 'safe')).toBe(true);
    expect(tierIncludes('safe', 'moderate')).toBe(false);
    expect(tierIncludes('moderate', 'safe')).toBe(true);
    expect(tierIncludes('aggressive', 'moderate')).toBe(true);
    expect(tierIncludes('aggressive', 'aggressive')).toBe(true);
  });
});

describe('planOrder', () => {
  // The four rules of llp/0013, asserted on every tier rather than on one hand-picked plan.
  it.each(FIX_TIERS)('holds the ordering rules for tier %s', (tier) => {
    const ids = stepsForTier(tier, 'darwin').map((step) => step.id);
    const at = (id: string) => ids.indexOf(id);
    const steps = stepsForTier(tier, 'darwin');

    // 1. every deletion before any reinstall (among the project-scoped steps).
    const project = steps.filter((step) => step.scope === 'project');
    const lastClean = project.map((step) => step.phase).lastIndexOf('clean');
    const firstInstall = project.map((step) => step.phase).indexOf('install');
    if (firstInstall !== -1) {
      expect(lastClean).toBeLessThan(firstInstall);
    }

    // 2 and 3.
    if (at('ios-pods') !== -1) {
      expect(at('node-modules')).toBeLessThan(at('ios-pods'));
    }
    if (at('prebuild-clean') !== -1) {
      expect(at('node-modules')).toBeLessThan(at('prebuild-clean'));
    }

    // 4. machine-wide last.
    const firstMachine = steps.findIndex((step) => step.scope === 'machine');
    if (firstMachine !== -1) {
      expect(steps.slice(firstMachine).every((step) => step.scope === 'machine')).toBe(true);
    }
  });

  it('ranks a machine-wide deletion after a project reinstall', () => {
    const machine = FIX_STEPS.find((step) => step.id === 'metro-transform-cache')!;
    const install = FIX_STEPS.find((step) => step.id === 'node-modules')!;
    expect(planOrder(machine)).toBeGreaterThan(planOrder(install));
  });
});

describe('stepsForTier', () => {
  it('grows with the tier', () => {
    const safe = stepsForTier('safe', 'darwin').map((step) => step.id);
    const moderate = stepsForTier('moderate', 'darwin').map((step) => step.id);
    const aggressive = stepsForTier('aggressive', 'darwin').map((step) => step.id);

    expect(safe).toEqual([
      'expo-web-cache',
      'expo-dev-logs',
      'node-modules-cache',
      'metro-file-map',
      'watchman-project',
    ]);
    for (const id of safe) {
      expect(moderate).toContain(id);
    }
    for (const id of moderate) {
      expect(aggressive).toContain(id);
    }
  });

  // Windows has no CocoaPods and no DerivedData, so those steps are not skipped there with a
  // reason — they do not exist at all, and a plan that listed them would be describing another
  // machine.
  it('drops the macOS-only steps on win32 and on linux', () => {
    for (const platform of ['win32', 'linux'] as const) {
      const ids = stepsForTier('aggressive', platform).map((step) => step.id);
      expect(ids).not.toContain('ios-pods');
      expect(ids).not.toContain('derived-data');
      expect(ids).toContain('metro-file-map');
      expect(ids).toContain('node-modules');
      expect(ids).toContain('android-build');
    }
  });
});

describe('metroFileMapPrefixes', () => {
  // The md5 below is of the literal path, and it is what pairs a cache directory in a shared
  // $TMPDIR with one project. Verified live on this machine, 2026-08-24, against four real caches.
  it('is the md5 of the project root, for both runtimes', () => {
    expect(
      metroFileMapPrefixes(
        '/Users/bonsai/.config/tuft/sessions/1787500752.816299/friction/run3/notesapp'
      )
    ).toEqual([
      'metro-file-map-expo-282fd89ff11f8010ca125f6be1bdad16-',
      'metro-file-map-bun-expo-282fd89ff11f8010ca125f6be1bdad16-',
    ]);
  });

  it('changes with the project', () => {
    expect(metroFileMapPrefixes('/a')).not.toEqual(metroFileMapPrefixes('/b'));
  });
});

describe('unavailable', () => {
  const by = (id: string) => FIX_STEPS.find((step) => step.id === id)!;

  it('skips ios-pods on a CNG project, and names prebuild as what resets it there', () => {
    expect(by('ios-pods').unavailable!(context({ hasPodfile: false }))).toMatch(/CNG/);
    expect(by('ios-pods').unavailable!(context())).toBeNull();
  });

  it('skips ios-pods when ios is not in --platform', () => {
    expect(by('ios-pods').unavailable!(context({ platforms: ['android'] }))).toMatch(/--platform/);
  });

  it('skips android-build on a project with no android directory', () => {
    expect(
      by('android-build').unavailable!(context({ nativeDirs: { ios: true, android: false } }))
    ).toMatch(/No android/);
  });

  // A bare project's native directories are hand-written code, and `prebuild --clean` replaces
  // them. No cache reset is worth that.
  it('refuses prebuild-clean on a project with checked-in native directories', () => {
    expect(by('prebuild-clean').unavailable!(context())).toMatch(/checked into/);
    expect(
      by('prebuild-clean').unavailable!(context({ nativeDirs: { ios: false, android: false } }))
    ).toBeNull();
  });

  it('skips derived-data when no .xcodeproj names it', () => {
    expect(by('derived-data').unavailable!(context({ xcodeProjectNames: [] }))).toMatch(
      /xcodeproj/
    );
  });

  it('skips the watchman steps on a machine without watchman', () => {
    for (const id of ['watchman-project', 'watchman-all']) {
      expect(by(id).unavailable!(context({ hasWatchman: false }))).toMatch(/not installed/);
      expect(by(id).unavailable!(context())).toBeNull();
    }
  });
});

describe('targets and argv', () => {
  it('names the caches of this project, and the machine ones of nobody in particular', () => {
    const by = (id: string) => FIX_STEPS.find((step) => step.id === id)!;
    expect(by('expo-web-cache').targets!(context())).toEqual([
      { kind: 'path', path: '/home/dev/app/.expo/web/cache' },
    ]);
    expect(by('metro-transform-cache').targets!(context())).toEqual([
      { kind: 'path', path: '/tmp/T/metro-cache' },
    ]);
    expect(by('metro-file-map').targets!(context())[0]).toMatchObject({
      kind: 'prefix',
      dir: '/tmp/T',
    });
    expect(by('derived-data').targets!(context())).toEqual([
      {
        kind: 'prefix',
        dir: '/home/dev/Library/Developer/Xcode/DerivedData',
        prefix: 'MyApp-',
      },
    ]);
  });

  it('reinstalls with the project’s own package manager, where its lockfile is', () => {
    const step = FIX_STEPS.find((entry) => entry.id === 'node-modules')!;
    const monorepo = context({
      packageManager: { name: 'yarn', installCwd: '/home/dev/monorepo' },
    });
    expect(step.argv!(monorepo)).toEqual(['yarn', 'install']);
    expect(step.cwd!(monorepo)).toBe('/home/dev/monorepo');
  });

  it('prebuilds one platform when the run named one, and all when it named both', () => {
    const step = FIX_STEPS.find((entry) => entry.id === 'prebuild-clean')!;
    expect(step.argv!(context({ platforms: ['ios'] }))).toEqual([
      'expo',
      'prebuild',
      '--clean',
      '--platform',
      'ios',
    ]);
    expect(step.argv!(context())).toEqual(['expo', 'prebuild', '--clean', '--platform', 'all']);
  });
});
