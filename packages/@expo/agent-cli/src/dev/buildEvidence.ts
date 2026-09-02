// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// Whether a `expo run:*` step got as far as putting the app it built on a device.
//
// `expo run:ios` and `expo run:android` are one subprocess that **builds, installs and then
// launches**, so their exit code says nothing about which of the three got that far. That is F121:
// a run whose compiler finished and whose app is on the simulator, and whose launch step then hit
// a macOS Automation refusal, exited non-zero — and the build record was written only after a step
// exited 0, so the next plan asked for another fifteen minutes of Xcode
// [observed — wave 29, `wave29-devclient/evidence/07-dev-build-ios-2.log` and
// `08-plan-after-successful-build.txt`].
//
// **The install line is the one that is read, not the compiler's.** The record answers "does the
// app *on a device* match this project" — that is why `resolveBuildPlatform` refuses to record an
// `eas build`, whose artifact no device has. `› Build Succeeded` on its own is a claim about a
// directory, so a step that compiled and died before the install is recorded as nothing. The
// install always follows a build that worked, so reading it asserts both facts at once.
//
// The lines belong to `@expo/cli`, not to this CLI, so they are pinned against the source that
// prints them [observed — `@expo/cli` 0.24, SDK 57]:
//
//   `run/ios/launchApp.ts`      — ``Log.log(chalk.gray`› Installing ${binaryPath}`)`` and
//                                 ``XcodeBuild.logPrettyItem(chalk`{bold Installing} on ${name}`)``
//   `run/android/runAndroidAsync.ts` — the same ``› Installing ${binaryPath}``, and
//                                 `› Failed to locate binary file, installing with Gradle...`
//                                 for the APK it could not name.
//
// Every one of them is an Expo CLI *item*, prefixed with `›`. That prefix is the whole guard
// against the other sentence in these logs — `Installing Android SDK Build-Tools 36 in …`, which
// the Gradle toolchain download prints and which says nothing about this project at all.

/** An Expo CLI item line about an app being installed: `› Installing …`, in either shape. */
const INSTALLING_ITEM = /^\s*›\s*Installing\b/m;

/** The Gradle fallback of `installAppAsync`, which has no binary path to name. */
const GRADLE_INSTALL_FALLBACK = /installing with Gradle/i;

/**
 * Whether this step's output shows the app it built reaching a device.
 *
 * @param output the step's stdout and stderr, together. Empty in `inherit` mode, where nothing is
 * captured — and then this is false, which keeps the old behaviour for the one output mode that
 * has a person watching the build happen.
 */
export function appReachedDevice(output: string): boolean {
  return INSTALLING_ITEM.test(output) || GRADLE_INSTALL_FALLBACK.test(output);
}
