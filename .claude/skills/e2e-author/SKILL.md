---
name: e2e-author
description: Author an agent-device e2e test (.ad script) for an Expo module against its native-component-list screen in bare-expo. Use when asked to add, extend, or fix an e2e test for a module, or when a scenario for a module should be covered end to end on a simulator.
argument-hint: "<package-name> <scenario in one sentence>"
---

# Author an e2e test with agent-device

You write a deterministic `.ad` script that deep links into the module's NCL screen in
bare-expo, drives it, and asserts on visible text. You use `agent-device` both to explore
the screen and to run the finished script. Use whatever agent-device supports; assertions
are text based, and screenshots are evidence.

## Inputs

`$ARGUMENTS` holds a package name, such as `expo-clipboard`, and a one-sentence scenario.
If the scenario is missing, read the package API in `packages/<package>/src/` and the
existing NCL screen, then propose 3 to 5 scenarios and ask the user to pick.

## Rules

- **No test-only screens.** Humans and agents use the same screens. Edit the existing
  screen for the feature you test in `apps/native-component-list/src/screens/`. Any size of
  edit is fine: expose state, refactor, or add coverage for API features the screen lacks.
  Large modules already split their demos into one screen per feature, such as
  `screens/Video/` and `screens/Audio/`. A new screen is fine when it demos a feature that
  has no screen yet and a human would use it. It is not fine when it exists only to give a
  test something to assert on.
- **No duplicate controls.** Do not add parallel "E2E" buttons or state next to existing
  demos. Use the existing controls. If they are not testable, fix the shared component so
  every screen that uses it benefits.
- **State must be visible as text.** `FunctionDemo` already renders each result as
  `<function> = <value>` and keeps it until dismissed. Its action buttons carry the
  accessibility label `<function>: <action>`, for example `getStringAsync: RUN` or
  `hasXAsync: hasStringAsync`. `SimpleActionDemo` buttons carry their title as the label and
  render results as `<title> = <json>`. For state outside those components, use
  `E2EKeyValueBox` (`apps/native-component-list/src/components/E2EKeyValueBox.tsx`), which
  renders `key = value` lines, or render the existing status text as one `label = value`
  node. Keep values short and deterministic.
- **Deterministic.** Prefer bundled assets. Network is allowed when the endpoint is stable
  and the assertion does not depend on nondeterministic payload contents or timing; use a local fixture
  server when you need control over responses. No permission prompts, no time-of-day
  values, no device-only features. Every script must work when it starts from a fresh app launch.
- **Few interactions.** Deep link, assert, tap a button, assert. Do not scroll or navigate
  when a deep link gets there directly.
- **Screen layout.** Both platforms expose only on-screen nodes, and `find` and `wait text`
  do not scroll. Lay a screen out so every asserted text is above the fold on the smallest
  CI device, Pixel 8a and iPhone 17 Pro:
  - Root the screen in a `ScrollView` with `contentInsetAdjustmentBehavior="automatic"`,
    not a `View` with `flex: 1`. bare-expo uses native tabs, and only a scroll view gets the
    bottom inset. A fixed view ends under the tab bar. `ImageEventsScreen` is the reference.
  - Order content by importance to assertions: demo view, controls, `E2EKeyValueBox`,
    then free-form output such as a `ConsoleBox` log. Everything a script asserts on lives
    in the key-value box, so only that box must be visible without scrolling. Logs and long
    JSON may extend under the tab bar.
  - Keep the asserted region compact. Cap the demo view at about 200 points and keep the
    key-value box to about a dozen short rows.
  - When state does not fit, scroll on purpose in the script with `scroll down <fraction>`
    or a `SectionIndex` "Jump to" chip. Do not shrink the demo to avoid one scroll.
  - A failed `wait text` lists the visible texts, so an off-screen assertion shows up as
    "text missing, these texts are visible".
- **Android before iOS** in any prose you write.

## Where things live

- Scripts: `apps/bare-expo/e2e/<module>/<scenario>.ad`, for example
  `apps/bare-expo/e2e/expo-clipboard/string-roundtrip.ad`. A script runs on both platforms
  unless its name ends in `.ios.ad` or `.android.ad`. Do not write a `context platform=`
  header; the runner selects the device. Open the app with `open ${APP_ID} --relaunch`. The
  runner passes the platform's app id, `dev.expo.Payments` on iOS and `dev.expo.payments` on
  Android. When a demo is declared for one platform only, such as `platforms: ['ios']` in a
  `FunctionDemo`, put its steps in a platform-suffixed script.
- Runner: `apps/bare-expo/e2e/run-agent-device.sh <ios|android> "<device name>" [artifacts
  dir] [script or dir...]`. It picks the scripts for the platform, stops stale daemons, sets
  `APP_ID`, and writes JUnit XML plus `run.log` into the artifacts dir.
- Deep links: `bareexpo://components/<id>` for screens in
  `apps/native-component-list/src/navigation/componentScreens.ts` and
  `bareexpo://apis/<id>` for `apiScreens.ts`. The id is the screen's `route` field, or its
  `name` lowercased with spaces turned into hyphens. See
  `apps/test-suite/screens/getScreenIdForLinking.ts`.
- App ids: `dev.expo.Payments` on iOS, `dev.expo.payments` on Android. Debug and Release
  builds share them, so the same scripts run against both.
- **Development build for authoring.** Screens are JavaScript, so iterate against a debug
  build with Metro. Run `pnpm ios` or `pnpm android` once in `apps/bare-expo`. It builds the
  debug app, starts Metro, and opens the app. After that, a saved edit to an NCL screen
  reaches the app through Fast Refresh, and `open ${APP_ID} --relaunch` reloads the bundle.
  No rebuild. Keep Metro running while you author.
- **Release build for the final verification.** CI runs the Release app, which has no dev
  overlays and different timing. Build it once at the end with
  `cd apps/bare-expo && bun ./scripts/start-ios-e2e-test.ts --build` for iOS and
  `bun ./scripts/start-android-e2e-test.ts --build` for Android. Each takes 10 to 15
  minutes, so start them in the background. If the iOS build fails with "The sandbox is not
  in sync with the Podfile.lock" or "Build input file cannot be found", run `pod install` in
  `apps/bare-expo/ios` and build again, then `git checkout apps/bare-expo/ios/Podfile.lock`
  only after the build succeeds. Outputs: `apps/bare-expo/ios/build/BareExpo.app` and
  `apps/bare-expo/android/app/build/outputs/apk/release/app-release.apk`. Install with
  `xcrun simctl install booted <app>` and `adb install -r <apk>`.

## Procedure

0. **Set up the environment yourself.** Nothing here needs the user's hands.
   - `agent-device doctor`. If the CLI is missing, `npm install -g agent-device@latest`.
   - `agent-device devices --platform ios` and `--platform android`. Use a booted device's
     name from this list in every later command. If none is booted, or Metro is not
     running, start the development build in the background and keep it running:
     ```bash
     cd apps/bare-expo && pnpm ios > /tmp/bare-expo-ios.log 2>&1 &
     cd apps/bare-expo && pnpm android > /tmp/bare-expo-android.log 2>&1 &
     ```
     `pnpm ios` boots a simulator, builds the debug app, starts Metro, and opens the app.
     `pnpm android` does the same and creates and boots a `bare-expo` emulator when no
     emulator is running. The first build takes about 10 minutes. Wait until the log shows
     the app opened, then run `agent-device devices` again to get the device names.
   - Android needs `ANDROID_HOME` set and `platform-tools` on PATH for `adb`.
   - The debug app opens the expo-dev-menu sheet at launch and shows its floating button.
     On iOS, turn both off for the simulator before the first launch, with the UDID from
     `xcrun simctl list devices booted`:
     ```bash
     xcrun simctl spawn <udid> defaults write dev.expo.Payments EXDevMenuShowsAtLaunch -bool false
     xcrun simctl spawn <udid> defaults write dev.expo.Payments EXDevMenuIsOnboardingFinished -bool true
     xcrun simctl spawn <udid> defaults write dev.expo.Payments EXDevMenuShowFloatingActionButton -bool false
     ```
     On Android the sheet shows once after install and then stays off; dismiss it with
     `agent-device back`. The Release build has no dev menu.
1. **Read the API and the screen.** List the module's public functions and the state the
   screen already shows. Decide which `key = value` entries and buttons the scenario needs.
2. **Edit the screen only if the scenario is not observable.** Prefer `FunctionDemo` for
   function calls. Give buttons short unique titles. Do not make a button the first child of
   a `ScrollView`: on iOS the scroll area takes the label of its first child, and `press
   label=...` then taps the scroll area's center instead of the button. Keep a text element
   first. With Metro running, a saved screen edit is live in the development build after a
   `open ${APP_ID} --relaunch`. No rebuild while authoring.
3. **Explore with agent-device.** Run every command from the same directory.
   ```bash
   agent-device open dev.expo.Payments --platform ios --device "iPhone 17 Pro (26.4)" --relaunch
   agent-device wait text "Expo Test Suite" 20000
   agent-device open "bareexpo://components/<id>"
   agent-device alert accept          # only if the "Open in BareExpo?" prompt appears
   agent-device snapshot -i
   agent-device press 'label="<Button title>"' --settle
   agent-device wait text "<key> = <value>"
   agent-device close
   ```
   In the shell, wrap a selector in single quotes so the shell keeps the inner double
   quotes. In the `.ad` file, write `press label="<Button title>"` without single quotes.
   Confirm each text you plan to assert on appears in the snapshot with the exact spelling.
4. **Write the script.** Template:
   ```
   # <package>: <scenario>
   open ${APP_ID} --relaunch
   # Wait for the home screen so the deep link is not lost during startup.
   wait text "Expo Test Suite" 20000
   open "bareexpo://components/<id>"
   wait text "<a text near the top of the screen>" 20000
   press label="<function>: RUN"
   wait text "<function> = <expected value>" 10000
   close
   ```
   Only elements on screen are in the accessibility tree, and `find` does not scroll. Before
   pressing a control lower on the page, add `scroll bottom` or `scroll down <fraction>`, for
   example `scroll down 0.3` for a third of the viewport, and `scroll top` to come back. A
   bare `scroll down` moves a full page and lands on different content per device. Remember
   that rendered results push the demos below them further down. On a long screen with many sections, press the screen's
   section index chip, `Jump to <Section name>`, instead of scrolling. If the screen has no
   section index, add one with the `SectionIndex` component. Do not use `wait stable` after
   a relaunch; it stalled for 60 seconds in one of four runs. Real examples live in
   `apps/bare-expo/e2e/expo-clipboard/` and `apps/bare-expo/e2e/expo-crypto/`.
5. **Run it three times on the Release build, on both platforms.** Iterate on the development
   build until the script passes, then build and install the Release apps and run the suite
   there. All three runs must pass. A failure on the first wait right after an install is a
   finding about launch timing, not a warm-up to skip. In CI, `--retries 1` is the lever for
   rare launch stalls. Stop stray daemons first, then run the suite.
   ```bash
   agent-device daemon stop --clean; pkill -f agent-device
   cd apps/bare-expo/e2e
   agent-device test ./<module> --platform ios --device "iPhone 17 Pro (26.4)" \
     --reporter default --reporter junit:<scratch>/ad-junit.xml --artifacts-dir <scratch>/ad-artifacts \
     2>&1 | tee <scratch>/ad-run.log
   ```
   Keep the stdout log. Only the default reporter prints the visible texts on a failure;
   the JUnit file and `failure.txt` do not. Fix the script or the screen, not the timeout,
   unless the wait is for real asynchronous work.
6. **Finish.** Type-check and lint the screen: `cd apps/native-component-list && npx tsc
   --noEmit` and `npx oxlint <file>`. Run `et check-packages native-component-list` before a
   PR. Add a changelog entry only for changes under `packages/`. Summarize the screen edits,
   the script path, and the three run times.

## Patterns from the existing scripts

- A demo that shows a native alert: `press label="Create local file"` then `alert accept`.
- A control below the fold: `scroll down 0.3` then press, `scroll top` to return. Or
  `press label="Jump to <Section>"` on screens with a section index, then `scroll top`
  before the next jump because the index scrolls away with the content.
- A duplicate label, such as a scroll view that inherits its first child's label or native
  media controls: qualify by role, `press "role=button label=\"Play\""`.
- Transient state such as a `didJustFinish` flag: add a counter row to the screen and
  assert on the count.
- Platform behavior differences are findings. Report them; do not paper over them in the
  script. Order steps so both platforms produce the same observable state.
- Screenshots: `screenshot <path>` is a valid script step and saves evidence next to the
  run. It is not an assertion. `diff screenshot --baseline <png>` works only from the CLI,
  not inside a script, and exits 0 even when pixels differ, so pixel comparison is a manual
  check today. The Maestro view shot pipeline in `_nested-flows/` stays with Maestro.

## Script syntax that is verified to work

- One CLI command per line. `#` starts a comment. Header line: `env KEY=VALUE`. Do not add
  `context platform=`; the runner picks the platform by device. Use `${KEY}` and `${KEY:-default}` in values.
- Lines are not shell-tokenized. Single quotes are literal. Write `press label="Play"`.
  A selector with spaces is one double-quoted token with escaped inner quotes:
  `is visible "label=\"isPlaying = false\""`.
- Assert with `wait text "<text>" [timeoutMs]`. It fails with the list of visible texts.
  Matching is a case-insensitive substring match over every text node, so a bare `true`
  matches anywhere. Always assert on a prefixed string such as `getStringAsync = true` or
  `Check exists = {` followed by the JSON fragment. Avoid `is visible label=...` on text:
  iOS exposes duplicate text nodes and it fails with "selector matched multiple elements".
  `is hidden` errors when the element is absent.
- `open "<url>"` is the deep link. It counts as a second `open`, so recording with
  `--save-script` does not work for deep-link flows. Write scripts by hand.
- `--device` takes the simulator or emulator name as printed by `agent-device devices`, not
  the UDID or serial.
- Android appends `accessibilityValue` to the label, so a control with a value would read
  `<label>, <value>` and an exact label match fails. Do not set `accessibilityValue` on
  controls that scripts press.
- `FunctionDemo` parameter pickers cycle to the next value on each press. Their label is
  `<function>: <parameter>`, for example `Full encrypt/decrypt cycle: plaintext`.
- Do not use Maestro YAML through `--maestro`. Its `id:` selectors do not match on iOS.

## Remote device

On EAS Simulator, prefix commands with `eas simulator:exec` from a linked project
directory such as `apps/native-component-list`. `replay` works there. `test` and
`--save-script` do not. Validate with `replay`, then run the suite locally.
