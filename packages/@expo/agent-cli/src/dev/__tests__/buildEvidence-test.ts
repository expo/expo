import { appReachedDevice } from '../buildEvidence';

describe(appReachedDevice, () => {
  // The line that stopped `05-dev-build-ios.log` before the compiler ever ran. Nothing was built
  // and nothing was installed, so nothing may be recorded.
  it(`should be false for a step that failed before it built anything`, () => {
    expect(
      appReachedDevice(
        [
          '› Planning build',
          "CommandError: 'pod install' failed.",
          'Unicode Normalization not appropriate for ASCII-8BIT',
        ].join('\n')
      )
    ).toBe(false);
  });

  it(`should be false for a build that succeeded and installed nothing`, () => {
    // The compiler finished and the step died before the install. The record is a claim about the
    // app **on a device**, so a binary that never left the build directory is not one.
    expect(
      appReachedDevice(['› Build Succeeded', '› 0 error(s), and 1 warning(s)'].join('\n'))
    ).toBe(false);
  });

  // @ref `wave29-devclient/evidence/07-dev-build-ios-2.log` — F121's own log, verbatim from
  // `› Build Succeeded` to the `osascript` refusal that ended the step.
  it(`should be true for the iOS run that built, installed, and died at the launch`, () => {
    expect(
      appReachedDevice(
        [
          '› Build Succeeded',
          '',
          'Starting Metro Bundler',
          '› Installing /Users/me/Library/Developer/Xcode/DerivedData/dcapp-ffj/Build/Products/Debug-iphonesimulator/dcapp.app',
          '› Installing on iPhone 17 Pro',
          '› Opening on iPhone 17 Pro (com.example.dcapp)',
          'Error: osascript -e tell app "System Events" to count processes exited with non-zero code: 1',
        ].join('\n')
      )
    ).toBe(true);
  });

  // `runAndroidAsync` logs the same `› Installing <binary>` line for the APK it resolved.
  it(`should be true for the Android run that installed the APK it built`, () => {
    expect(
      appReachedDevice(
        [
          'BUILD SUCCESSFUL in 4m 11s',
          '› Installing /project/android/app/build/outputs/apk/debug/app-debug.apk',
          'Error: adb: failed to start activity',
        ].join('\n')
      )
    ).toBe(true);
  });

  // The fallback path of `installAppAsync`, for a build whose APK this CLI could not name.
  it(`should be true for the Gradle install fallback`, () => {
    expect(appReachedDevice('› Failed to locate binary file, installing with Gradle...\n')).toBe(
      true
    );
  });

  it(`should be false for output that was never captured`, () => {
    expect(appReachedDevice('')).toBe(false);
  });

  // The word is not the sentence: `expo install` and every npm-shaped tool print "Installing"
  // constantly, and the marker is the Expo CLI's own `›`-prefixed item.
  it(`should not read a package installer's line as an app reaching a device`, () => {
    expect(
      appReachedDevice(
        ['Installing NDK (Side by side) 27.1.12297006 in /Users/me/Library/Android/sdk/ndk'].join(
          '\n'
        )
      )
    ).toBe(false);
  });
});
