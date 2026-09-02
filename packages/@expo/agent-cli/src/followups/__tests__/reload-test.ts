// @ref llp/0009-smart-followups.rfc.md §Examples per command — `reload`.

import { buildReloadFollowUps } from '../reload';

// @ref ../reload — friction run 6, F54. The device is only resolved by the *device* method, so a
// reload over the dev server left `platform` null even for a run told `--android`, and the commands
// it handed back carried no flag — which on a machine with both apps attached reads the other one.
describe(`${buildReloadFollowUps.name} and the session's platform`, () => {
  it(`carries the platform into every command, with no device resolved`, () => {
    const followups = buildReloadFollowUps({ platform: 'android', deviceId: null, route: null });

    expect(followups.map((followup) => followup.command)).toEqual([
      'npx @expo/agent-cli runtime:errors --android --fail-on-error',
      'npx @expo/agent-cli navigate / --android',
    ]);
  });

  it(`names the adb that was actually run, not a bare one`, () => {
    const followups = buildReloadFollowUps({
      platform: 'android',
      deviceId: 'emulator-5554',
      route: '/notes',
      adbPath: '/sdk/platform-tools/adb',
    });

    expect(followups.map((followup) => followup.command)).toContain(
      '/sdk/platform-tools/adb -s emulator-5554 exec-out screencap -p > screen.png'
    );
  });

  // @ref llp/0017-deferred-commands.reference.md §dev:wait. A `Try:` line has to be runnable,
  // and `xcrun simctl io <session-id>` is not: the device is not on this machine.
  it(`never names a platform tool for a cloud session`, () => {
    const followups = buildReloadFollowUps({
      backend: 'cloud',
      platform: 'ios',
      deviceId: 'sess-1',
      route: null,
    });
    const commands = followups.map((followup) => followup.command);

    expect(commands.join('\n')).not.toContain('simctl');
    expect(commands.join('\n')).not.toContain('adb');
    expect(commands).toContain(
      'npx eas simulator:exec npx agent-device@latest screenshot screen.png'
    );
    // The backend is carried on: `navigate /` alone looks for a device on this machine.
    expect(commands).toContain('npx @expo/agent-cli navigate / --ios --cloud');
  });
});
