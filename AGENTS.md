# Agent instructions

Coding agents that change this repository follow this file. Human contributors follow the same pull request rules in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Read first

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md). It is the source for setup, package scripts, tests, documentation, and changesets. Do not copy those steps into a new guide.
2. If the directory you will edit contains `AGENTS.md`, read that file too. The closer file wins.
3. Read the code and the tests around the lines you will change. Then edit.

## Internal and external contributors

The code rules and the pull request rules are the same.

- An Expo team member clones this repository. An external contributor forks it and opens the pull request from the fork. See [Download and Setup](./CONTRIBUTING.md#-download-and-setup).
- Do SDK work in `apps/bare-expo`. Do not use Expo Go. Expo Go needs API tokens and is hard to set up.
- This repository does not support Windows. Use WSL.
- Do not bump native dependency versions. The Expo team does that for each SDK. See [Finding a task to work on](./CONTRIBUTING.md#finding-a-task-to-work-on).

## expotools

Call the repo CLI as `et`. Do not call it through `npx`, `bunx`, or `pnpm run`.

`direnv` adds `bin/` to `PATH`. Run `direnv allow` once in the repo root if `et` is not found. If `direnv` is not available, run `node ./tools/bin/expotools.js <command>`.

Run `et --help` to list the other commands.

## Make the change

- Change only the lines the problem needs. Do not reformat untouched code. Do not mix in a second fix.
- One published package per pull request, plus its changeset. A documentation change that can land alone goes in its own pull request.
- Follow the style guides linked from [Style](./CONTRIBUTING.md#style). Changelog entries follow [Updating Changelogs](./guides/contributing/Updating%20Changelogs.md). Documentation prose follows the [Documentation Writing Style Guide](./guides/Expo%20Documentation%20Writing%20Style%20Guide.md).
- Run `et check-packages <package>` for each package you changed. That runs the same checks as CI. You can also run one task with `turbo run <task>` for `build`, `typecheck`, `depscheck`, `test`, or `lint`. See [Common package scripts](./CONTRIBUTING.md#common-package-scripts).
- Add a changeset for a user-facing package change. Do not edit `CHANGELOG.md`. See [Recording Package Changes](./CONTRIBUTING.md#-recording-package-changes). `pnpm changeset` is interactive, so write the `.changeset/*.md` file directly. Do not add a pull request link or an author line. The changelog script adds both.
- If you change a config plugin, the pull request must work with `npx expo prebuild` and EAS Build.
- If you edit versioned docs, copy the change to `docs/pages/versions/unversioned/`. See [Updating Documentation](./CONTRIBUTING.md#-updating-documentation).

## Comments

Do not add a comment the change does not need.

- Do not add a comment that repeats the next line.
- Do not put the history of the bug in a comment. Put that history in the pull request `Why` section.
- Keep a comment only when the code cannot show the constraint. A platform bug, a required call order, or a value you must not change are examples.
- Delete a comment that your change makes false.

## Tests

Do not add a unit test the change does not need.

- Add a unit test only when it fails before your change and passes after it.
- When you add that test, write it first and watch it fail. Then change the code until it passes.
- Do not add a test that already passes on the old code.
- Do not add a test that mocks the function you changed and then asserts on that mock.
- Do not add a snapshot or a large fixture for a one-line fix.
- A native change with no unit-test seam needs steps in the Test Plan. Do not add a test file that cannot run the native code.
- Test layout, Jest mocks, and end-to-end tests are in [Testing Your Changes](./CONTRIBUTING.md#-testing-your-changes).

JavaScript and TypeScript unit tests use Jest. Put them in `src/__tests__/` and name them `*-test.ts` or `*-test.tsx`. They run as part of `et check-packages`.

Swift and Kotlin unit tests live in `packages/<pkg>/ios/Tests/` and in the package `android/` tree. Run them with `et native-unit-tests`. Pass `--packages <name>` to limit the run. Example: `et native-unit-tests -p ios --packages @expo/ui`.

iOS unit tests run against `apps/bare-expo`. Run `pod install` in `apps/bare-expo/ios` before those tests or an iOS build, and again after you add or change an iOS `test_spec`. If you are working in another app, run `pod install` in that app's `ios` or `macos` directory. Android tests do not need pods. `et pod-install` also installs pods for other apps, including Expo Go.

## Run the app

`et check-packages` does not show UI, native behavior at runtime, the dev menu, the dev launcher, or error overlays. Run those changes in `apps/bare-expo` on a simulator or an emulator. A JavaScript, tooling, or config change that unit tests cover does not need a simulator.

From `apps/bare-expo`:

- iOS: `pnpm ios`. The script prepares the project, then runs `npx expo run:ios`. Run `pod install` in `apps/bare-expo/ios` first when native code or native dependencies changed.
- Android: `pnpm android`. The script prepares the project, then runs `npx expo run:android`.

Check Metro with `curl http://localhost:8081/status`. A running packager returns `packager-status:running`.

The iOS bundle id is `dev.expo.Payments`. The Android application id is `dev.expo.payments`. The URL scheme is `bareexpo`.

On Android, `adb devices` lists emulators. `adb shell input keyevent <code>` and `adb shell input tap <x> <y>` send input. `adb exec-out screencap -p > shot.png` saves a screenshot. `adb logcat` shows native logs.

On iOS, `xcrun simctl list devices booted` lists the booted simulator. `xcrun simctl openurl booted bareexpo://<path>` opens a deep link. `xcrun simctl io booted screenshot shot.png` saves a screenshot.

Reproduce the bug first. Run the same steps after the fix. Put the command result in the Test Plan. If the change affects what a person sees, take a before screenshot and an after screenshot for each platform it affects: Android, iOS, or web. An Android-only change needs Android screenshots. Shared code needs a pair for every platform that runs it. Do not use an iOS Simulator screenshot for a platform you did not run. Put each image at full width under a platform heading, then a `Before` or `After` heading, in `Screenshots`. Do not put the images in a table. If you cannot run an affected platform, name it and say why. If nothing visible changes, write `No UI change.`

For `expo-router`, follow [packages/expo-router/AGENTS.md](./packages/expo-router/AGENTS.md).

## Pull requests

Follow [Opening a pull request](./CONTRIBUTING.md#-opening-a-pull-request) and keep the headings in [.github/PULL_REQUEST_TEMPLATE](./.github/PULL_REQUEST_TEMPLATE): `Why`, `How`, `Test Plan`, `Screenshots`, and `Checklist`.

- Keep the diff small enough to read in one pass. If the change has more than one reason, split it into a stack. Each pull request does one thing. Set its base branch to the previous pull request. After one merges, retarget the next to `main`.
- List the stack order in `How`, and say which pull request this one is.
- Write the title and the body in Simplified Technical English: short sentences, one fact in each sentence, active voice, and one word for one thing. You do not need the ASD-STE100 specification.
- `Why` states the problem, then the root cause.
- `How` answers how you built the feature or fixed the bug, and why. Describe each solution, its performance impact, and why you believe this is the right fix. Then say what the diff changes.
- `Test Plan` says what you ran, where you ran it, and the result. If you did not run a test, say that and open the pull request as a draft.
- `Screenshots` has a `Before` and `After` pair for each platform the change affects: Android, iOS, or web. Each image is full width. Take the before image first. Do not substitute an iOS Simulator shot for a platform you did not run. If nothing visible changes, write `No UI change.`
- A fix that the report limits to some devices must stay limited to those devices. If every device must get the change, say why in `How`.
- Delete the template's HTML comments when you fill the body.
- Do not open a pull request you cannot explain in a review reply. Answer questions on that pull request.
- Format the commit subject as `[platform][api] Title`. See [Writing a Commit Message](./CONTRIBUTING.md#-writing-a-commit-message). The pull request title still uses `[package]`.

## Error messages

An error message tells a developer what failed, why it failed, and what to do next.

- State what failed.
- State the likely cause at the caller's level.
- State the next step. That can be a fix, a workaround, a debug step, or when to contact support.

Be specific. Add a diagnostic detail only when it helps, and label it.

Example: The JavaScript bundler could not bundle the code because it depends on a Node.js native addon (`node_modules/example/example.node`). Use a package implemented in JavaScript, or see https://metrobundler.dev/docs/resolution/ when the package already provides one and the bundler may not resolve it.

## Do not

- Do not commit `build/` output, debug logs, `console.log`, or commented-out code.
- Do not open a stack of unrelated fixes.
