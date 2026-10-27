# Contributing to the Expo SDK

- [📦 Download and Setup](#-download-and-setup)
- [✍️ Editing SDK Packages](#%EF%B8%8F-editing-sdk-packages)
  - [Style](#style)
  - [Extra Credit](#extra-credit)
- [⏱ Testing Your Changes](#-testing-your-changes)
  - [✅ Unit Testing](#-unit-testing)
  - [🏁 E2E Testing](#-e2e-testing)
- [📚 Updating Documentation](#-updating-documentation)
- [🦋 Recording Package Changes](#-recording-package-changes)
- [📝 Writing a Commit Message](#-writing-a-commit-message)
- [📬 Opening a pull request](#-opening-a-pull-request)
- [🔎 Before Submitting](#-before-submitting)
  - [Extra Credit](#extra-credit-1)

Thanks for your interest in contributing! We currently review PRs for `packages/`, `docs/`, `templates/`, `guides/`, `apps/`, and markdown files.

Coding agents must read [AGENTS.md](./AGENTS.md) before they edit. Pull request size and wording are in [Opening a pull request](#-opening-a-pull-request).

We recommend that folks interested in contributing to the SDK use the `apps/bare-expo` project in their SDK development workflow instead of Expo Go (in `apps/expo-go`). The Expo Go app is difficult to set up and requires API tokens.

The `bare-expo` project includes most of the Expo SDK. It runs the JavaScript code from `apps/test-suite` and `apps/native-component-list`. That allows you to browse the Expo SDK components and APIs and easily write and run E2E tests for iOS, and Android for any given SDK package. Unit tests can be written within the SDK package itself. When pushed to the remote, CI will run this project with tests for Android/iOS and report the results on your pull request. The iOS jobs and the Android e2e and instrumentation tests run only when the pull request is ready for review, not while it is a draft.

Manual smoke tests are included in `apps/native-component-list`, which is a good fit for demos or tests that require physical interactions. This is particularly useful if you are testing interactions with UI components, or if there is something very difficult to test in an automated way but would be easy to verify through manual interaction.

> 💡 How does `bare-expo` relate to `test-suite`?
>
> `bare-expo` is a bare React Native app that links all of the Expo SDK dependencies in the `packages/` directory in order to be able to run projects in the `apps/` directory. It currently runs `test-suite` (an Expo app with some custom code to turn it into a test runner), and `native-component-list`. If you run `expo start` in the `test-suite` directory you can load the project in Expo Go. `bare-expo` imports the `test-suite` app root component and uses it as its own root component.

## 📦 Download and Setup

> 💽 The development environment for this repository does not support Windows; WSL is required to contribute from Windows.

1. If you are an Expo team member, clone the repository. If you are an external contributor, [fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device. (`git remote add upstream git@github.com:expo/expo.git` 😉). You can use `git clone --depth 1 --single-branch --branch main git@github.com:expo/expo.git`, skipping most of the branches and history to clone it faster.
2. Install [direnv](https://direnv.net/). On macOS: `brew install direnv`. Don't forget to install the [shell hook](https://direnv.net/docs/hook.html) to your shell profile.
3. Install Ruby 3.4 or later. On macOS: `brew install ruby@3.4`
4. Install [Node LTS](https://nodejs.org/).
5. Some of the scripts in this repository require Bun. You won't need it for most tasks, but can install it via [these options](https://bun.com/docs/installation).

### Set up documentation

If you plan to contribute to the documentation, see [Updating Documentation](#-updating-documentation) section below.

### Set up Android

If you plan to contribute to Android, run `pnpm run setup:native`. This command does the following for you:

- Downloads submodules (like `react-native`) with `git submodule update --init`
- Ensures pnpm is installed
- Ensures your computer is set up for React Native (will install the Android NDK if it's not present)
- Downloads the Node packages (`pnpm install`)

We recommend JDK 17 (eg. zulu17). Run the following commands in a terminal window to install it:

```sh
brew tap homebrew/cask-versions
brew install --cask zulu@17
```

After you install the JDK, add the JAVA_HOME environment variable in ~/.bash_profile (or ~/.zshrc if you use ZSH):

```sh
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

`ANDROID_SDK_ROOT` environmental variable should be set or configured via `local.properties` file in `android` folder of the native project you're working with.

### (Optional) Speed up Android native builds with ccache

[ccache](https://ccache.dev/) caches C/C++ compilation results so rebuilds of native code are nearly instant when source files haven't changed.

1. Install ccache: `brew install ccache`
2. Add to your `~/.zshrc` (or `~/.bashrc`):
   ```sh
   export CMAKE_C_COMPILER_LAUNCHER="ccache"
   export CMAKE_CXX_COMPILER_LAUNCHER="ccache"
   ```
3. Enable precompiled header support (required by some modules like `expo-modules-core`):
   ```sh
   ccache -o sloppiness=pch_defines,time_macros
   ```

The repo's `.envrc` automatically sets `CCACHE_BASEDIR` via direnv, so cache is shared across git worktrees with no extra setup.

### Set up iOS

If you will be working with the iOS project, ensure **ruby 3.4** is installed on your machine. macOS comes with ruby 2.6, which is not supported in this repository; if you use Homebrew you can just run `brew install ruby@3.4`. You will also need to have the latest stable version of Xcode installed, along with Xcode command line tools.

### Verify native installation is successful

1. Navigate to the bare sandbox project `cd apps/bare-expo`
2. Run the project on any native platform:
   - iOS: `pnpm ios`
   - Android: `pnpm android`
   - If you are working on Linux, make sure to set the `TERMINAL` environment variable to your preferred terminal application. (e.g. `export TERMINAL="konsole"`)

3. You are now running the `test-suite` app via the `bare-expo` project. The next section explains how you can begin to make changes to SDK packages.

> If this didn't work for you as described, please [open an issue.](https://github.com/expo/expo/issues/new/choose)

## ✍️ Editing SDK Packages

All Expo SDK packages can be found in the `packages/` directory. These packages are automatically linked to the projects in the `apps/` directory, so you can edit them in-place and see the changes in the running app.

1. Navigate to a package you want to edit. Ex: `cd packages/expo-constants`
2. Compile the package's TypeScript after editing: `pnpm build` (skip this if such script is not present)
3. Edit code in that package's `src/` directory
4. Play with your changes on a simulator or device through `bare-expo`:
   - Add or modify a file named after the API you're working on. Ex: `apps/test-suite/tests/Constants.js`
   - To see native changes, you will need to run the `test-suite` with the `apps/bare-expo` project using `pnpm <android | ios>`.
   - If you are only making JavaScript changes, you can run `test-suite` from the `apps/test-suite` project using `expo start`.
   - To run the full test suite, you can run the tests `pnpm test:<android | ios>`.
5. You can edit a package's native code directly from its respective folder in the `packages/` directory or by opening `bare-expo` in a native editor:
   - Navigate to the `bare-expo` app directory: `cd apps/bare-expo`
   - Android Studio: `pnpm edit:android`
   - Xcode: `pnpm edit:ios`
   - Remember to **rebuild** the native project whenever you make a native change
6. (optional) Package docs are partially generated from sources. Run `et generate-docs-api-data -p <package-name>` to generate the package docs [read more](#-updating-documentation).

### Common package scripts

Almost every package in `packages/` exposes the same set of npm scripts, orchestrated across the monorepo by [Turborepo](https://turborepo.com/). The compiled `build/` output is not committed to Git (it is in `.gitignore`); Turborepo builds it on demand and caches the result, locally and in a shared remote cache, so a `git pull` or `git checkout` doesn't force you to rebuild every package.

| Script      | What it does                                                        |
|-------------|---------------------------------------------------------------------|
| `build`     | Compiles `src/` → `build/`.                                         |
| `typecheck` | Type-checks the package with `tsc`.                                 |
| `test`      | Runs the package's Jest unit tests.                                 |
| `lint`      | Lints the package. Pass `--fix` to autofix.                         |
| `format`    | Formats the package. Pass `--check` to check without modifying.     |
| `depscheck` | Verifies the package's declared dependencies match what it imports. |

Run them two ways:

- **From the repo root** with `pnpm <script>` (e.g. `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`, `pnpm typecheck`). This invokes `turbo <task>` and runs the script across every workspace package — respecting the cache and dependency graph
- **From a single package directory** with `pnpm run <script>` (e.g. `cd packages/expo-constants && pnpm run test`) to run just that package's script.

For a one-shot "did my change build, typecheck, lint, and pass tests?" check across the packages you touched, use `et check-packages <...packages>`, which runs the same Turborepo task graph as CI.

### Finding a task to work on

If you don't have something in mind already, the best way to find something to help with is ["Issue accepted" label](https://github.com/expo/expo/issues?q=is%3Aissue+is%3Aopen+label%3A%22Issue+accepted%22).

Note that we generally do not accept PRs that bump versions of native dependencies. The Expo team handles bumping these dependencies as part of our release process for each Expo SDK. The process for pulling in a new version requires a fair amount of context on how Expo Go works.

### Style

All modules should adhere to the style guides which can be found here:

- [Expo Module Infrastructure](guides/Expo%20Module%20Infrastructure.md)
- [Expo JS Style Guide](guides/Expo%20JavaScript%20Style%20Guide.md) (also mostly applies to TypeScript)
- [Expo Swift Style Guide](guides/Swift%20Style%20Guide.md)
- [Updating Changelogs](guides/contributing/Updating%20Changelogs.md)

### Extra Credit

- The React Native dev tools are currently disabled in our fork [#5602](https://github.com/expo/expo/issues/5602). You can hack around this by cloning React Native outside this repo, then copying the contents `react-native/React/DevSupport` into `expo/react-native-lab/react-native/React/DevSupport` (this will only enable the shake gesture, CMD+R won't work yet).
- We use a fork of `react-native` in this repo; this fork is located at `react-native-lab/react-native` (you can make changes or cherry-picks from here if you want). It diverges the minimal amount necessary from the `react-native` version in its `package.json`.
- We use a unified set of basic Bash scripts and configs called `@expo/internal-scripts` to ensure everything runs smoothly (TypeScript, Babel, Jest, etc...).

## 🦋 Recording Package Changes

Changes to a published package need a Changesets entry. Run `pnpm changeset`, select every affected
public package, and choose `patch` for a fix, `minor` for a compatible feature, or `major` for a
breaking change. Do not use `major` on an `sdk-*` release branch.

Write a short summary for package users and edit the generated `.changeset/*.md` file instead of a
package's `CHANGELOG.md`. Changes that only affect documentation, tests, apps, CI, or private tooling
do not need a changeset.

See [Updating Changelogs](guides/contributing/Updating%20Changelogs.md) for examples and formatting
options.

## ⏱ Testing Your Changes

> You'll need write about how you tested your changes in the PR under the **Test Plan** section.

A test belongs in the diff when it fails before the change and passes after it. We have three kinds of tests: unit tests, automated end-to-end tests, and demos. A test for behavior that is missing today is welcome when it fails on the current code.

### ✅ Unit Testing

Add a unit test when it fails before your change and passes after it. Do not add a test that already passes. Do not add a test that only checks a mock of the code you changed.

1. Create a test for your feature in the appropriate package's `src/__tests__` directory (if the file doesn't exist already, create it with the `*-test.ts` or `*-test.tsx` extension).
2. Any new bridged native functions have to be added to the [jest-expo](https://github.com/expo/expo/blob/main/packages/jest-expo/src/preset/expoModules.js) package to ensure they are mocked. To help you do this more easily, we've written a tool and a guide on how to do this. Check out [Generating Jest Mocks](https://github.com/expo/expo/blob/main/guides/Generating%20Jest%20Mocks.md)!
3. Run the test with `pnpm test` and ensure it handles all platforms (iOS, Android, and web). If the feature doesn't support a platform, then you can exclude it by putting your test in a file with a platform extension like: `.test.ios.ts`, `.test.native.ts`, `.test.web.ts`...
4. You can also test platforms one at a time by pressing <kbd>X</kbd> and selecting the platform you want to test!

### 🏁 E2E Testing

1. Write your tests in `apps/test-suite/tests`
   - These tests are written with a non-feature-complete version of Jasmine that runs on the Android and iOS clients, so no special features like snapshot testing will be available.
   - If you created a new test file, be sure to add it in `apps/test-suite/TestUtils.js`.
   - If the new test file could be running automatically from the `bare-expo` testing, add it in `apps/bare-expo/e2e/TestSuite-test.native.js`.
2. Run your tests locally from the `bare-expo` directory with `pnpm test:android`, or `pnpm test:ios`.
   - It's important you test locally because native CI tests can be fragile, take a while to finish, and be frustrating when they fail.
3. Remember to try and get your feature running on as many platforms as possible.

Thanks again for helping to make sure that Expo is stable for everyone!

## 📚 Updating Documentation

Our docs are made with [Next.js](https://github.com/vercel/next.js). They're located in the **docs** directory. For more information look at the [**docs/README.md**](/docs/README.md).

**TL;DR:**

Note: Running docs pnpm commands requires a specific version of Node. You can find this version under the `volta` section in [./docs/package.json](./docs/package.json).

1. Navigate to the **docs** directory and run `pnpm install`.
2. Start the project with `pnpm dev` (make sure you don't have another server running on port `3002`). Note: Requires Node `22.13.1` or higher.
3. Navigate to the docs you want to edit: `cd docs/pages/`.
4. If you update an older version, ensure the relevant changes are copied into `docs/pages/versions/unversioned/` for API docs.
5. Package API docs are generated from sources. To regenerate the docs, run `et generate-docs-api-data -p <package-name>` (for the next SDK version) or `et generate-docs-api-data -p <package-name> -s <number>` (for a specific SDK version).

## 📝 Writing a Commit Message

> If this is your first time committing to a large public repo, you could look through this neat tutorial: ["How to Write a Git Commit Message"](https://chris.beams.io/posts/git-commit/)

Commit messages are most useful when formatted like so: `[platform][api] Title`. For example, if you fix a bug in the package `expo-video` for iOS, you could write: `[ios][video] Fixed black screen bug that appears on older devices`.

## 📬 Opening a pull request

Use [.github/PULL_REQUEST_TEMPLATE](./.github/PULL_REQUEST_TEMPLATE). Keep the headings `Why`, `How`, `Test Plan`, `Screenshots`, and `Checklist`. Delete the HTML comments when you fill them in.

Open the pull request as a draft while you work on it. CI does not run the slow and paid jobs on drafts: the iOS unit tests, the iOS and Android builds and e2e tests, and the Android instrumentation tests. Mark the pull request ready for review when you want them to run.

Keep the pull request small enough to read in one pass. Limit a code change to one published package, plus its changeset. Put a documentation change that can land alone in its own pull request. CI also finishes faster when docs are separate. See [Before Submitting](#-before-submitting).

If the change has more than one reason, split it into a stack:

1. Each pull request in the stack does one thing.
2. Set the base branch of each pull request to the branch of the previous one.
3. In `How`, list the stack in order and say which pull request this one is.
4. After a pull request merges, retarget the next one to `main`.

### Title

Use `[package] Do this thing`. A platform tag is not required.

Write the title in Simplified Technical English. You do not need the ASD-STE100 specification. Follow these rules:

- One short line.
- Start with a verb, such as `Fix`, `Add`, or `Stop`.
- Say the result.
- Use the same words in the title and the body.

Example: `[camera] Reapply the preview scale when the stream starts`

Use the same sentence rules in `Why`, `How`, and `Test Plan`. Use short sentences. Put one fact in each sentence. Use active voice. Use one word for one thing.

### Why

State the problem. Then state the root cause.

- The problem is what a user or a caller sees.
- The root cause is the code path that causes the problem.

### How

Answer this question: how did you build this feature or fix this bug, and why?

- Describe each solution you considered. Use one or two sentences for each.
- For each solution, state the performance impact.
- Say why you believe this is the right fix, and why you did not pick the others.
- Say what the diff changes.
- If the report is about some devices only, limit the change to those devices. If every device must get the change, say why.

### Test Plan

Say what you ran, where you ran it, and the result.

- Give the command, or the device or simulator, and the result.
- If there is no automated test, give the steps a reviewer can repeat.
- If you did not run a test, say that and open the pull request as a draft. CI runs the iOS and e2e tests after you mark it ready for review.

### Screenshots

If the change affects what a person sees, add a `Before` heading and an `After` heading for each platform it affects: Android, iOS, or web. An Android-only change needs Android screenshots. Do the same for an iOS-only or web-only change. Shared code needs a pair for every platform that runs it. Do not use an iOS Simulator screenshot for a platform you did not run. Take the before screenshot first. Then make the change. Then take the after screenshot. Put each image under its heading, at full width. Do not put the images in a table. Name the device, simulator, or browser on the line after each image. If you cannot run an affected platform, name it and say why. If nothing visible changes, write `No UI change.`

### Comments in the diff

Do not add a comment that repeats the code. Keep a comment only when the code cannot show the constraint. A platform bug, a required call order, or a value you must not change are examples. Put the history of the bug in `Why`, not in a comment. Delete a comment that your change makes false.

### Example

```md
# Why

getDocumentAsync stays pending when the document picker fails to open.

The module stores the promise before startActivityForResult. That call throws, and nothing rejects the promise.

# How

How did you build this feature or fix this bug and why?

Two solutions were possible.

1. Store the promise after startActivityForResult returns. This adds no timer and no extra work on the success path.
2. Add a timeout that rejects the promise. The timeout runs for every open picker, and it can reject a picker that is still open.

This pull request uses solution 1. The failure is synchronous, so the extra timeout is not needed. That is the right fix.

The diff moves the pendingPromise write to after a successful startActivityForResult call.

# Test Plan

Android emulator, API 34. No unit test covers this path.

1. Call getDocumentAsync when no activity can handle ACTION_OPEN_DOCUMENT.
2. Confirm the promise rejects.
3. Call getDocumentAsync again and confirm the picker opens.

Before this change, the second call did nothing. After this change, the promise rejects and the next call opens the picker.

# Screenshots

This change is Android only. iOS and web do not run this path.

### Android

#### Before

![The document picker does not open](https://github.com/user-attachments/assets/11111111-1111-4111-8111-111111111111)

Android emulator, API 34. The second call does not open the picker.

#### After

![The document picker opens](https://github.com/user-attachments/assets/22222222-2222-4222-8222-222222222222)

Android emulator, API 34. The promise rejects, and the next call opens the picker.

# Checklist

- [x] I added a changeset and followed [this short guide](https://github.com/expo/expo/blob/main/CONTRIBUTING.md#-before-submitting)
- [ ] This diff will work correctly for `npx expo prebuild` & EAS Build (eg: updated a module plugin).
- [ ] Conforms with the [Documentation Writing Style Guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md)
```

## 🔎 Before Submitting

- Write the pull request with [Opening a pull request](#-opening-a-pull-request).
- Remember to add a changeset containing a concise description of any user-facing changes using `pnpm changeset` for the packages you've changed. This is especially helpful for breaking changes!

To keep CI green, please make sure of the following:

### If you modified anything in `packages/`:

- Run `et check-packages <...packages>` (or `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` and `pnpm format`) for the packages you changed. See [Common package scripts](#common-package-scripts).
- Run `pnpm lint --fix` and `pnpm format` to fix the formatting of the code. Ensure that both commands succeed without errors or warnings.
- (optional) Package docs are partially generated from sources. Run `et generate-docs-api-data -p <package-name>` to generate the package docs [read more](#-updating-documentation).
- All `console.log`s or commented out code blocks are removed!

### If you edited the docs directory:

- Any changes to docs for the current SDK version should also be applied to the unversioned copy. The current docs SDK version is defined in [`docs/package.json`](./docs/package.json), and the versioning workflow is described in [docs/README.md](./docs/README.md#update-latest-version-of-api-reference-docs). Example:
  - You fixed a typo in `docs/pages/versions/vXX.0.0/sdk/app-auth.md`
  - Ensure you copy that change to: `docs/pages/versions/unversioned/sdk/app-auth.md`
- You don't need to run the docs tests locally. Just ensure the links you include aren't broken, the format is correct, and the changes are following our [writing style guide](/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

### Extra Credit

- Our CI tests will finish early if you don't make changes to certain directories. If you want to **get results faster** then you should make changes to **docs** directory in one PR, and changes to anything else in another!
