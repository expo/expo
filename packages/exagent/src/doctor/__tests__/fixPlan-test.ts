/* eslint-env jest */
// @ref llp/0013-doctor-fix.rfc.md §Planning
// The planner over memfs fixtures: a CNG project with no native directories, a bare one with both,
// a project with no caches at all, and each of the three tiers. The ordering rules are asserted on
// every plan rather than on one, because a rule that holds for the plan somebody wrote the test
// for is not a rule.
import { vol } from 'memfs';

import { planFixAsync } from '../fixPlan';
import { metroFileMapPrefixes } from '../fixSteps';
import type { FixTier } from '../fixTypes';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  tmpdir: () => '/tmp/T',
  homedir: () => '/home/dev',
}));
jest.mock('../../checkpoint/git', () => ({ dirtyTrackedPathsAsync: jest.fn(async () => []) }));
jest.mock('../../utils/subprocess', () => ({ findExecutableOnPath: jest.fn(() => '/bin/watchman') }));

const { dirtyTrackedPathsAsync } = jest.requireMock('../../checkpoint/git');
const { findExecutableOnPath } = jest.requireMock('../../utils/subprocess');

const PROJECT = '/home/dev/app';
const FILE_MAP = `/tmp/T/${metroFileMapPrefixes(PROJECT)[0]}deadbeef`;

/** A project with every cache planted, plus whatever else the case needs. */
function plantProject(extra: Record<string, string> = {}) {
  vol.fromJSON({
    [`${PROJECT}/package.json`]: '{}',
    [`${PROJECT}/pnpm-lock.yaml`]: '',
    [`${PROJECT}/node_modules/.cache/babel/x`]: 'x'.repeat(10),
    [`${PROJECT}/node_modules/expo/index.js`]: 'y',
    [`${PROJECT}/.expo/web/cache/index.html`]: 'z',
    [`${PROJECT}/.expo/dev/logs/start.log`]: 'l',
    [FILE_MAP]: 'map',
    '/tmp/T/metro-cache/transform': 't',
    ...extra,
  });
}

/** A bare project: native directories checked in, with a Podfile and an Xcode project. */
function plantBare() {
  plantProject({
    [`${PROJECT}/ios/Podfile`]: '',
    [`${PROJECT}/ios/Podfile.lock`]: '',
    [`${PROJECT}/ios/Pods/Manifest.lock`]: '',
    [`${PROJECT}/ios/MyApp.xcodeproj/project.pbxproj`]: '',
    [`${PROJECT}/android/build/outputs/x`]: 'x',
    [`${PROJECT}/android/.gradle/x`]: 'x',
    [`${PROJECT}/android/app/build/x`]: 'x',
    [`${HOME_DERIVED}/MyApp-abcdef/Build/x`]: 'x',
  });
}

const HOME_DERIVED = '/home/dev/Library/Developer/Xcode/DerivedData';

const OPTIONS = { tier: 'safe' as FixTier, platforms: null, allowMachineWide: false };

let platform: PropertyDescriptor;

beforeEach(() => {
  vol.reset();
  platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  dirtyTrackedPathsAsync.mockResolvedValue([]);
  findExecutableOnPath.mockReturnValue('/bin/watchman');
});

afterEach(() => Object.defineProperty(process, 'platform', platform));

describe('planFixAsync', () => {
  it('plans the safe tier over the caches that exist, and nothing else', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, OPTIONS);

    expect(plan.steps.map((step) => step.id)).toEqual([
      'expo-web-cache',
      'expo-dev-logs',
      'node-modules-cache',
      'metro-file-map',
      'watchman-project',
    ]);
    // The one target outside the project directory is still this project's alone.
    expect(plan.steps.find((step) => step.id === 'metro-file-map')!.targets).toEqual([FILE_MAP]);
    expect(plan.steps.every((step) => step.scope === 'project')).toBe(true);
  });

  it('skips a cache that is not there, and says which path it looked for', async () => {
    vol.fromJSON({ [`${PROJECT}/package.json`]: '{}' });

    const plan = await planFixAsync(PROJECT, OPTIONS);

    expect(plan.steps.map((step) => step.id)).toEqual(['watchman-project']);
    const skipped = plan.skipped.find((entry) => entry.id === 'expo-web-cache');
    expect(skipped!.reason).toContain(`${PROJECT}/.expo/web/cache`);
    expect(skipped!.reason).toMatch(/Nothing to delete/);
  });

  it('measures what each step would delete', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, OPTIONS);

    expect(plan.steps.find((step) => step.id === 'node-modules-cache')!.bytes).toBe(10);
    // A command deletes no path, so it has no size.
    expect(plan.steps.find((step) => step.id === 'watchman-project')!.bytes).toBe(0);
  });

  it('reads the package manager off the lockfile', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, OPTIONS);

    expect(plan.packageManager).toEqual({ name: 'pnpm', lockfile: `${PROJECT}/pnpm-lock.yaml` });
  });

  // The whole guardrail on a machine-wide step is the flag, so a run without it must not plan one.
  it('skips the machine-wide steps without --allow-machine-wide, naming the flag', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, { ...OPTIONS, tier: 'moderate' });

    expect(plan.steps.map((step) => step.id)).not.toContain('metro-transform-cache');
    expect(plan.skipped.find((entry) => entry.id === 'metro-transform-cache')!.reason).toContain(
      '--allow-machine-wide'
    );
  });

  it('includes them with the flag, last, and marks their scope', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, {
      ...OPTIONS,
      tier: 'moderate',
      allowMachineWide: true,
    });

    const machine = plan.steps.find((step) => step.id === 'metro-transform-cache')!;
    expect(machine.scope).toBe('machine');
    expect(machine.targets).toEqual(['/tmp/T/metro-cache']);
    expect(plan.steps.at(-1)!.id).toBe('metro-transform-cache');
  });

  it('reinstalls node_modules at moderate, after every deletion', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, { ...OPTIONS, tier: 'moderate' });
    const ids = plan.steps.map((step) => step.id);

    expect(ids).toContain('node-modules');
    const install = plan.steps.find((step) => step.id === 'node-modules')!;
    expect(install).toMatchObject({
      kind: 'delete-and-reinstall',
      argv: ['pnpm', 'install'],
      cwd: null,
      targets: [`${PROJECT}/node_modules`],
    });
    expect(ids.indexOf('node-modules')).toBeGreaterThan(ids.indexOf('node-modules-cache'));
  });

  // The four ordering rules, on every plan this file can build.
  it.each(['safe', 'moderate', 'aggressive'] as FixTier[])(
    'holds the ordering rules for a bare project at tier %s',
    async (tier) => {
      plantBare();

      const plan = await planFixAsync(PROJECT, { tier, platforms: null, allowMachineWide: true });
      const ids = plan.steps.map((step) => step.id);
      const at = (id: string) => ids.indexOf(id);

      if (at('node-modules') !== -1 && at('ios-pods') !== -1) {
        expect(at('node-modules')).toBeLessThan(at('ios-pods'));
      }
      const firstMachine = plan.steps.findIndex((step) => step.scope === 'machine');
      if (firstMachine !== -1) {
        expect(plan.steps.slice(firstMachine).every((step) => step.scope === 'machine')).toBe(true);
      }
      const project = plan.steps.filter((step) => step.scope === 'project');
      const firstInstall = project.findIndex((step) => step.kind !== 'delete');
      if (firstInstall !== -1) {
        expect(project.slice(0, firstInstall).every((step) => step.kind === 'delete')).toBe(true);
      }
    }
  );

  it('plans pods for a bare ios project, in ios/', async () => {
    plantBare();

    const plan = await planFixAsync(PROJECT, { ...OPTIONS, tier: 'moderate' });
    const pods = plan.steps.find((step) => step.id === 'ios-pods')!;

    expect(pods).toMatchObject({
      argv: ['pod', 'install'],
      cwd: `${PROJECT}/ios`,
      targets: [`${PROJECT}/ios/Pods`, `${PROJECT}/ios/Podfile.lock`],
    });
  });

  it('skips pods and prebuild the way a CNG project needs', async () => {
    plantProject();

    const plan = await planFixAsync(PROJECT, { ...OPTIONS, tier: 'aggressive' });

    expect(plan.skipped.find((entry) => entry.id === 'ios-pods')!.reason).toMatch(/CNG/);
    // The reverse: a CNG project is the only one prebuild --clean is planned for.
    expect(plan.steps.map((step) => step.id)).toContain('prebuild-clean');
  });

  it('refuses prebuild-clean on a bare project and keeps the rest of the tier', async () => {
    plantBare();

    const plan = await planFixAsync(PROJECT, {
      tier: 'aggressive',
      platforms: null,
      allowMachineWide: true,
    });

    expect(plan.skipped.find((entry) => entry.id === 'prebuild-clean')!.reason).toMatch(
      /checked into/
    );
    expect(plan.steps.map((step) => step.id)).toContain('derived-data');
  });

  it('names the DerivedData directory from the .xcodeproj on disk', async () => {
    plantBare();

    const plan = await planFixAsync(PROJECT, {
      tier: 'aggressive',
      platforms: null,
      allowMachineWide: true,
    });

    expect(plan.steps.find((step) => step.id === 'derived-data')!.targets).toEqual([
      `${HOME_DERIVED}/MyApp-abcdef`,
    ]);
  });

  it('honours --platform', async () => {
    plantBare();

    const plan = await planFixAsync(PROJECT, {
      ...OPTIONS,
      tier: 'moderate',
      platforms: ['android'],
    });

    expect(plan.platforms).toEqual(['android']);
    expect(plan.skipped.find((entry) => entry.id === 'ios-pods')!.reason).toMatch(/--platform/);
    expect(plan.steps.map((step) => step.id)).toContain('android-build');
  });

  it('drops the watchman steps on a machine without watchman', async () => {
    findExecutableOnPath.mockReturnValue(null);
    plantProject();

    const plan = await planFixAsync(PROJECT, OPTIONS);

    expect(plan.steps.map((step) => step.id)).not.toContain('watchman-project');
    expect(plan.skipped.find((entry) => entry.id === 'watchman-project')!.reason).toMatch(
      /not installed/
    );
  });

  it('drops the macOS-only steps on win32', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    plantBare();

    const plan = await planFixAsync(PROJECT, {
      tier: 'aggressive',
      platforms: null,
      allowMachineWide: true,
    });
    const named = [...plan.steps, ...plan.skipped].map((entry) => entry.id);

    expect(named).not.toContain('ios-pods');
    expect(named).not.toContain('derived-data');
    expect(plan.steps.map((step) => step.id)).toContain('android-build');
  });

  describe('a dirty native directory', () => {
    it('refuses the whole plan with DOCTOR_FIX_DIRTY_NATIVE', async () => {
      plantBare();
      dirtyTrackedPathsAsync.mockResolvedValue(['ios/MyApp/AppDelegate.swift']);

      await expect(planFixAsync(PROJECT, { ...OPTIONS, tier: 'moderate' })).rejects.toMatchObject({
        code: 'DOCTOR_FIX_DIRTY_NATIVE',
        suggestedCommand: 'npx exagent doctor:fix --tier safe',
      });
    });

    it('names the files and the way out', async () => {
      plantBare();
      dirtyTrackedPathsAsync.mockResolvedValue(['ios/MyApp/AppDelegate.swift']);

      const error = await planFixAsync(PROJECT, { ...OPTIONS, tier: 'moderate' }).catch((e) => e);

      expect(error.message).toContain('ios/MyApp/AppDelegate.swift');
      expect(error.message).toContain('--tier safe');
      expect(error.message).toContain('holds only tracked files');
    });

    // The safe tier deletes nothing inside a native directory, so it is never refused for one.
    it('does not reach the safe tier', async () => {
      plantBare();
      dirtyTrackedPathsAsync.mockResolvedValue(['ios/MyApp/AppDelegate.swift']);

      const plan = await planFixAsync(PROJECT, OPTIONS);

      expect(plan.steps.length).toBeGreaterThan(0);
      // Nothing in the safe tier deletes inside a native directory, so git is never asked.
      expect(dirtyTrackedPathsAsync).not.toHaveBeenCalled();
    });

    // A CNG project's `ios/` is generated, so there is nothing tracked in it to lose.
    it('asks only about the native directories that are checked in', async () => {
      plantProject();

      await planFixAsync(PROJECT, { ...OPTIONS, tier: 'aggressive' });

      expect(dirtyTrackedPathsAsync).not.toHaveBeenCalled();
    });
  });

  describe('the safety predicate', () => {
    it('refuses a target that turned out to be a symlink', async () => {
      plantProject();
      vol.rmSync(`${PROJECT}/.expo/web/cache`, { recursive: true });
      vol.symlinkSync('/home/dev', `${PROJECT}/.expo/web/cache`);

      await expect(planFixAsync(PROJECT, OPTIONS)).rejects.toMatchObject({
        code: 'DOCTOR_FIX_UNSAFE_PATH',
      });
    });
  });
});
