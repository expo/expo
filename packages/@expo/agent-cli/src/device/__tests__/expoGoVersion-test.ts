// @ref llp/0005-runtime-loop-tools.rfc.md §The Expo Go on the device is not the Expo Go the SDK wants
//
// Expo Go being *installed* is not Expo Go being the *right* Expo Go. Its runtime is versioned with
// the SDK, so the copy on a simulator is only the app under test when it comes from the same SDK
// line as the project — and a simulator that has not been opened in months holds one that does not.
//
// The two failure modes are deliberately not one. A different SDK line cannot run the bundle at
// all; an older patch of the same line almost always can, and failing that would be the false red
// that mirrors the false green this whole area is about.

import type { spawnCaptureAsync } from '../../utils/spawnCapture';
import {
  checkExpoGoVersionAsync,
  compareExpoGoVersion,
  expoGoVersionFromUrl,
  readInstalledExpoGoVersionAsync,
  resolveExpectedExpoGoVersionAsync,
} from '../expoGoVersion';

describe(expoGoVersionFromUrl, () => {
  // The `expo-go` CLI answers with a download URL, and the version is in it. Reading it there is
  // what keeps this off `@expo/cli`'s internals (llp/0001 constraint 5).
  it(`reads the version out of a release URL`, () => {
    expect(
      expoGoVersionFromUrl(
        'https://github.com/expo/expo-go-releases/releases/download/Expo-Go-57.0.9/Expo-Go-57.0.9.tar.gz'
      )
    ).toBe('57.0.9');
  });

  it(`reads it from an Android release URL too`, () => {
    expect(
      expoGoVersionFromUrl(
        'https://github.com/expo/expo-go-releases/releases/download/Expo-Go-55.0.34/Expo-Go-55.0.34.apk'
      )
    ).toBe('55.0.34');
  });

  // A URL shape this does not recognise is null rather than a guess: a wrong "expected version"
  // would invent a mismatch, and inventing one is worse than reporting that nothing was read.
  it.each([
    ['a URL with no version in it', 'https://example.com/expo-go.tar.gz'],
    ['an empty string', ''],
  ])(`answers null for %s`, (_name, url) => {
    expect(expoGoVersionFromUrl(url)).toBeNull();
  });
});

describe(compareExpoGoVersion, () => {
  it(`matches an installed version that is the expected one`, () => {
    expect(compareExpoGoVersion('57.0.9', '57.0.9')).toMatchObject({ verdict: 'match' });
  });

  // The one that cannot run the project: Expo Go's runtime is versioned with the SDK, so a copy
  // from another SDK line has neither this project's native modules nor its JS runtime contract.
  it(`calls a different SDK line a mismatch`, () => {
    const result = compareExpoGoVersion('56.0.4', '57.0.9');

    expect(result.verdict).toBe('sdk-mismatch');
    expect(result.reason).toContain('56.0.4');
    expect(result.reason).toContain('57.0.9');
  });

  // The softer one, and it must stay softer. An older patch of the same line runs the app in almost
  // every case, so this is worth saying and not worth failing.
  it(`calls an older patch of the same line outdated`, () => {
    expect(compareExpoGoVersion('57.0.3', '57.0.9')).toMatchObject({ verdict: 'outdated' });
  });

  // Newer than expected is not a problem to report. It happens to anyone who updated Expo Go from
  // the App Store ahead of this SDK's pinned release, and their app runs.
  it(`accepts an installed version newer than the expected one`, () => {
    expect(compareExpoGoVersion('57.0.12', '57.0.9')).toMatchObject({ verdict: 'match' });
  });

  // Either side missing is `unknown`, never a mismatch. Offline, no `expo-go` on the machine, or an
  // unreadable Info.plist all land here, and a check that could not run must not become a refusal.
  it.each([
    ['nothing was read from the device', null, '57.0.9'],
    ['nothing was resolved for the SDK', '57.0.9', null],
    ['neither side is known', null, null],
  ])(`answers unknown when %s`, (_name, installed, expected) => {
    const result = compareExpoGoVersion(installed, expected);

    expect(result.verdict).toBe('unknown');
    expect(result.reason).not.toBeNull();
  });

  // A version string neither side can parse is also unknown rather than a mismatch, for the same
  // reason: this function's job is to be sure before it says anything.
  it(`answers unknown for a version it cannot parse`, () => {
    expect(compareExpoGoVersion('not-a-version', '57.0.9').verdict).toBe('unknown');
  });

  // The facts travel with the verdict, so a report never has to re-derive them (llp/0021).
  it(`carries both versions whatever the verdict`, () => {
    expect(compareExpoGoVersion('56.0.4', '57.0.9')).toMatchObject({
      installed: '56.0.4',
      expected: '57.0.9',
    });
  });
});

// The subprocess half. `expo-go` answers one JSON object either way — `{"url":…}` at exit 0 and
// `{"error":…}` at exit 1 — so every branch here is a shape that CLI really produces, and none of
// them may throw: a `smoke` whose app is otherwise readable must not be ended by a version lookup.
describe(resolveExpectedExpoGoVersionAsync, () => {
  const capture =
    (over: Partial<Awaited<ReturnType<typeof spawnCaptureAsync>>> = {}) =>
    async () => ({ stdout: '', stderr: '', exitCode: 0, ...over });

  it(`reads the version out of the URL the CLI answers`, async () => {
    const result = await resolveExpectedExpoGoVersionAsync('ios', '57.0.19', {
      spawn: capture({
        stdout:
          '{"url":"https://github.com/expo/expo-go-releases/releases/download/Expo-Go-57.0.9/Expo-Go-57.0.9.tar.gz"}',
      }),
      offline: false,
    });

    expect(result).toEqual({ version: '57.0.9', reason: null });
  });

  it(`passes the platform and the SDK version to the CLI`, async () => {
    const spawn = jest.fn(capture({ stdout: '{"url":"Expo-Go-55.0.34"}' }));
    await resolveExpectedExpoGoVersionAsync('android', '55.0.0', { spawn, offline: false });

    expect(spawn).toHaveBeenCalledWith(
      'npx',
      ['--yes', 'expo-go', 'url', 'android', '55.0.0', '--json'],
      expect.anything()
    );
  });

  // The CLI's own sentence is quoted rather than replaced: it names the SDK it has no release for,
  // which is more than "could not be resolved" says.
  it(`quotes the CLI's error rather than inventing one`, async () => {
    const result = await resolveExpectedExpoGoVersionAsync('ios', '99.0.0', {
      spawn: capture({
        stdout: '{"error":"Unable to find a version of Expo Go for SDK 99.0.0"}',
        exitCode: 1,
      }),
      offline: false,
    });

    expect(result.version).toBeNull();
    expect(result.reason).toContain('Unable to find a version of Expo Go for SDK 99.0.0');
  });

  // A machine with no `npx`, or no route out. Both are ordinary and neither is this command's
  // failure, so both are a null version with a reason.
  it(`reports a CLI that could not be run`, async () => {
    const enoent: NodeJS.ErrnoException = Object.assign(new Error('spawn npx ENOENT'), {
      code: 'ENOENT',
    });
    const result = await resolveExpectedExpoGoVersionAsync('ios', '57.0.0', {
      spawn: capture({ exitCode: null, spawnError: enoent }),
      offline: false,
    });

    expect(result.version).toBeNull();
    expect(result.reason).toContain('ENOENT');
  });

  it(`reports output it cannot parse`, async () => {
    const result = await resolveExpectedExpoGoVersionAsync('ios', '57.0.0', {
      spawn: capture({ stdout: 'not json at all', exitCode: 1 }),
      offline: false,
    });

    expect(result.version).toBeNull();
    expect(result.reason).toContain('nothing this could read');
  });

  // The same courtesy `@expo/cli` extends: skip the check rather than fail, because the
  // alternative is a tool that stops working on a train. And nothing is spawned.
  it(`looks nothing up when EXPO_OFFLINE is set`, async () => {
    const spawn = jest.fn(capture());
    const result = await resolveExpectedExpoGoVersionAsync('ios', '57.0.0', {
      spawn,
      offline: true,
    });

    expect(spawn).not.toHaveBeenCalled();
    expect(result).toEqual({ version: null, reason: expect.stringContaining('EXPO_OFFLINE') });
  });

  // A project with no SDK version has nothing to ask about, and asking anyway would spawn a
  // subprocess to be told so.
  it(`looks nothing up for a project with no SDK version`, async () => {
    const spawn = jest.fn(capture());
    const result = await resolveExpectedExpoGoVersionAsync('ios', null, { spawn, offline: false });

    expect(spawn).not.toHaveBeenCalled();
    expect(result.version).toBeNull();
  });
});

// Finding the bundle by reading each one's own `CFBundleIdentifier`, the way `./installedApps.ts`
// does — never by trusting a container directory name, which is the container's and says nothing
// about which app is inside it.
describe(readInstalledExpoGoVersionAsync, () => {
  it(`reads the version of the bundle whose id is Expo Go`, async () => {
    const version = await readInstalledExpoGoVersionAsync('UDID', {
      bundleDirs: () => ['/other.app', '/expo.app'],
      readBundleIdAsync: async (dir) =>
        dir === '/expo.app' ? 'host.exp.Exponent' : 'com.example.other',
      readShortVersionAsync: async (dir) => (dir === '/expo.app' ? '57.0.9' : '1.0.0'),
    });

    expect(version).toBe('57.0.9');
  });

  it(`answers null when no bundle on the device is Expo Go`, async () => {
    expect(
      await readInstalledExpoGoVersionAsync('UDID', {
        bundleDirs: () => ['/other.app'],
        readBundleIdAsync: async () => 'com.example.other',
        readShortVersionAsync: async () => '1.0.0',
      })
    ).toBeNull();
  });

  // Both spellings are Expo Go's, and the ids module owns that list rather than this one.
  it(`accepts the lower-case Expo Go id`, async () => {
    expect(
      await readInstalledExpoGoVersionAsync('UDID', {
        bundleDirs: () => ['/expo.app'],
        readBundleIdAsync: async () => 'host.exp.exponent',
        readShortVersionAsync: async () => '57.0.9',
      })
    ).toBe('57.0.9');
  });
});

// @ref ./expoGoVersion §checkExpoGoVersionAsync — the local read gates the network one.
describe(checkExpoGoVersionAsync, () => {
  const bundles = () => ['/expo.app'];
  const isExpoGo = async () => 'host.exp.Exponent';

  // Nothing installed, so nothing to compare with — and no subprocess spent finding out what it
  // would have been compared to. This is also what keeps the e2e tier off the network.
  it(`resolves no release when the device has no Expo Go to compare`, async () => {
    const check = await checkExpoGoVersionAsync('UDID', 'ios', '57.0.0', {
      bundleDirs: () => [],
      readBundleIdAsync: isExpoGo,
      readShortVersionAsync: async () => null,
    });

    expect(check.verdict).toBe('unknown');
    expect(check.expected).toBeNull();
  });

  it(`compares the two when both are known`, async () => {
    const check = await checkExpoGoVersionAsync('UDID', 'ios', '57.0.0', {
      bundleDirs: bundles,
      readBundleIdAsync: isExpoGo,
      readShortVersionAsync: async () => '56.0.1',
      resolveExpectedAsync: async () => ({ version: '57.0.9', reason: null }),
    });

    expect(check).toMatchObject({
      verdict: 'sdk-mismatch',
      installed: '56.0.1',
      expected: '57.0.9',
    });
  });

  // The gate itself, asserted rather than assumed: an unreadable device costs no subprocess.
  it(`spends no release lookup when there is nothing installed to compare`, async () => {
    const resolveExpectedAsync = jest.fn(async () => ({ version: '57.0.9', reason: null }));
    await checkExpoGoVersionAsync('UDID', 'ios', '57.0.0', {
      bundleDirs: () => [],
      readBundleIdAsync: isExpoGo,
      readShortVersionAsync: async () => null,
      resolveExpectedAsync,
    });

    expect(resolveExpectedAsync).not.toHaveBeenCalled();
  });

  // And the CLI's own sentence wins when it is the reason nothing was compared, rather than this
  // module saying "could not be resolved" over the top of it.
  it(`keeps the release lookup's own reason for an unknown`, async () => {
    const check = await checkExpoGoVersionAsync('UDID', 'ios', '99.0.0', {
      bundleDirs: bundles,
      readBundleIdAsync: isExpoGo,
      readShortVersionAsync: async () => '57.0.9',
      resolveExpectedAsync: async () => ({
        version: null,
        reason: 'the expo-go CLI said: Unable to find a version of Expo Go for SDK 99.0.0',
      }),
    });

    expect(check.verdict).toBe('unknown');
    expect(check.reason).toContain('Unable to find a version of Expo Go for SDK 99.0.0');
  });
});
