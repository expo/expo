# Contributing to the Expo SDK

- [Contributing to the Expo SDK](#contributing-to-the-expo-sdk)
  - [📦 Download and Setup](#-download-and-setup)
    - [Set up documentation](#set-up-documentation)
    - [Set up Android](#set-up-android)
    - [Set up iOS](#set-up-ios)
    - [Verify native installation is successful](#verify-native-installation-is-successful)
  - [✍️ Editing SDK Packages](#️-editing-sdk-packages)
    - [Finding a task to work on](#finding-a-task-to-work-on)
    - [Style](#style)
    - [Extra Credit](#extra-credit)
  - [⏱ Testing Your Changes](#-testing-your-changes)
    - [✅ Unit Testing](#-unit-testing)
    - [🏁 E2E Testing](#-e2e-testing)
  - [📚 Updating Documentation](#-updating-documentation)
  - [📝 Writing a Commit Message](#-writing-a-commit-message)
  - [🔎 Before Submitting](#-before-submitting)
    - [Extra Credit](#extra-credit-1)

Thanks for the help! We currently review PRs for `packages/`, `docs/`, `templates/`, `guides/`, `apps/`, and markdown files.

We recommend that folks interested in contributing to the SDK use the `apps/bare-expo` project in their SDK development workflow instead of the Expo client. The Expo client itself (in the `android/` and `ios/` directories) is difficult to set up and requires API tokens.

The `bare-expo` project includes most of the Expo SDK and runs the JavaScript code from `apps/test-suite` to allow you to easily write and run E2E tests for iOS, and Android for any given SDK package. Unit tests can be written within the SDK package itself. When pushed to the remote, CI will run this project with tests for Android/iOS and report the results on your pull request.

Manual smoke tests are included in `apps/native-component-list`, this is a good fit for demos or tests that require physical interactions. This is particularly useful if you are testing interactions with UI components, or if there is something very difficult to test in an automated way but would be easy to verify through manual interaction.

> 💡 How does `bare-expo` relate to `test-suite`?
>
> `bare-expo` is a bare workflow app that links all of the Expo SDK dependencies in the `packages/` directory in order to be able to run projects in the `apps/` directory in the bare workflow rather than the Expo client. It currently only runs `test-suite`. `test-suite` is a regular managed workflow Expo app with some custom code to turn it into a test runner. If you run `expo start` in the `test-suite` directory you can load the project in Expo client. `bare-expo` imports the `test-suite` app root component and uses it as its own root component.

## 📦 Download and Setup

> 💽 The development environment for this repository does not support Windows; WSL is required to contribute from Windows.

1. If you are an Expo team member, clone the repository. If you are an external contributor, [fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device. (`git remote add upstream git@github.com:expo/expo.git` 😉). You can use `git clone --depth 1 --single-branch --branch main git@github.com:expo/expo.git`, discarding most of the branches and history to clone it faster.
2. Install [direnv](https://direnv.net/). On macOS: `brew install direnv`. Don't forget to install the [shell hook](https://direnv.net/docs/hook.html) to your shell profile.
3. Install [git-lfs](https://git-lfs.github.com/). On macOS: `brew install git-lfs`.
4. Install [Node LTS](https://nodejs.org/).

### Set up documentation

If you plan to contribute to the documentation, run `npm run setup:docs`.

### Set up Android

If you plan to contribute to Android, run `npm run setup:native`. This command does the following for you:

- Downloads submodules (like `react-native`) with `git submodule update --init`
- Ensures Yarn is installed
- Ensures your computer is set up for React Native (will install the Android NDK if it's not present)
- Downloads the Node packages (`yarn install`)

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

### Set up iOS

If you will be working with the iOS project, ensure **ruby 2.7** is installed on your machine. macOS comes with ruby 2.6, which is not supported in this repository; if you use Homebrew you can just run `brew install ruby@2.7`. You will also need to have the latest stable version of Xcode installed, along with Xcode command line tools.

### Verify native installation is successful

1. Navigate to the bare sandbox project `cd apps/bare-expo`
2. Run the project on any native platform:

   - iOS: `yarn ios`
   - Android: `yarn android`
   - If you are working on Linux, make sure to set the `TERMINAL` environment variable to your preferred terminal application. (e.g. `export TERMINAL="konsole"`)
   - You might also need to open a new terminal window in the same directory and run `yarn start` (you'll need to be logged in with your expo account within the built app to see the projects)

3. You are now running the `test-suite` app via the `bare-expo` project. The next section explains how you can begin to make changes to SDK packages.

> If this didn't work for you as described, please [open an issue.](https://github.com/expo/expo/issues/new/choose)

## ✍️ Editing SDK Packages

All Expo SDK packages can be found in the `packages/` directory. These packages are automatically linked to the projects in the `apps/` directory, so you can edit them in-place and see the changes in the running app.

1. Navigate to a package you want to edit. Ex: `cd packages/expo-constants`
2. Start the TypeScript build in watch mode: `yarn build`
3. Edit code in that package's `src/` directory
4. Play with your changes on a simulator or device through `bare-expo`:
   - Add or modify a file named after the API you're working on. Ex: `apps/test-suite/tests/Constants.js`
   - To see native changes, you will need to run the `test-suite` with the `apps/bare-expo` project using `yarn <android | ios>`.
   - If you are only making JavaScript changes, you can run `test-suite` from the `apps/test-suite` project using `expo start`.
   - To run the full test suite, you can run the tests `yarn test:<android | ios>`.
5. You can edit a package's native code directly from its respective folder in the `packages/` directory or by opening `bare-expo` in a native editor:
   - Navigate to the `bare-expo` app directory: `cd apps/bare-expo`
   - Android Studio: `yarn edit:android`
   - Xcode: `yarn edit:ios`
   - Remember to **rebuild** the native project whenever you make a native change

### Finding a task to work on

If you don't have something in mind already, the best way to find something to help with is ["Issue accepted" label](https://github.com/expo/expo/issues?q=is%3Aissue+is%3Aopen+label%3A%22Issue+accepted%22).

Note that we generally do not accept PRs that bump versions of native dependencies. The Expo team handles bumping these dependencies as part of our release process for each Expo SDK. The process for pulling in a new version and adequately requires a fair amount of context on how Expo Go works.

### Style

All modules should adhere to the style guides which can be found here:

- [Guide to Unimodule Development](guides/Expo%20Universal%20Module%20Infrastructure.md)
- [Expo JS Style Guide](guides/Expo%20JavaScript%20Style%20Guide.md) (also mostly applies to TypeScript)
- [Updating Changelogs](guides/contributing/Updating%20Changelogs.md)

### Extra Credit

- The React Native dev tools are currently disabled in our fork [#5602](https://github.com/expo/expo/issues/5602). You can hack around this by cloning React Native outside this repo, then copying the contents `react-native/React/DevSupport` into `expo/react-native-lab/react-native/React/DevSupport` (this will only enable the shake gesture, CMD+R won't work yet).
- We use a fork of `react-native` in this repo; this fork is located at `react-native-lab/react-native` (you can make changes or cherry-picks from here if you want). It diverges the minimal amount necessary from the `react-native` version in its `package.json`.
- All of the package's `build/` code should be committed. This is because it is simpler to reproduce issues if all contributors are running the same code and so we don't need to rebuild dozens of packages locally on every `git pull` or `git checkout` operation.
- We use a unified set of basic Bash scripts and configs called `expo-module-scripts` to ensure everything runs smoothly (TypeScript, Babel, Jest, etc...).

## ⏱ Testing Your Changes

> You'll need write about how you tested your changes in the PR under the **Test Plan** section.

The best way to get your changes merged is to build good tests for them! We have three different kinds of tests: unit-tests, automated E2E tests, and demos (adding tests that you notice are missing is a great way to become my friend 🥳)!

### ✅ Unit Testing

1. Create a test for your feature in the appropriate package's `src/__tests__` directory (if the file doesn't exist already, create it with the `*-test.ts` or `*-test.tsx` extension).
2. Any new bridged native functions have to be added to the [jest-expo](https://github.com/expo/expo/blob/main/packages/jest-expo/src/preset/expoModules.js) package to ensure they are mocked. To help you do this more easily, we've written a tool and a guide on how to do this. Check out [Generating Jest Mocks](https://github.com/expo/expo/blob/main/guides/Generating%20Jest%20Mocks.md)!
3. Run the test with `yarn test` and ensure it handles all platforms (iOS, Android, and web). If the feature doesn't support a platform, then you can exclude it by putting your test in a file with a platform extension like: `.test.ios.ts`, `.test.native.ts`, `.test.web.ts`...
4. You can also test platforms one at a time by pressing <kbd>X</kbd> and selecting the platform you want to test!

### 🏁 E2E Testing

1. Write your tests in `apps/test-suite/tests`
   - These tests are written with a non-feature-complete version of Jasmine that runs on the Android and iOS clients, so no special features like snapshot testing will be available.
   - If you created a new test file, be sure to add it in `apps/test-suite/TestUtils.js`.
   - If the new test file could be running automatically from the `bare-expo` testing, add it in `apps/bare-expo/e2e/TestSuite-test.native.js`.
2. Run your tests locally from the `bare-expo` directory with `yarn test:android`, or `yarn test:ios`.
   - It's important you test locally because native CI tests can be fragile, take a while to finish, and be frustrating when they fail.
3. Remember to try and get your feature running on as many platforms as possible.

Thanks again for helping to make sure that Expo is stable for everyone!

## 📚 Updating Documentation

Our docs are made with [Next.js](https://github.com/vercel/next.js). They're located in the **docs** directory. For more information look at the [**docs/README.md**](/docs/README.md).

**TL;DR:**

1. Navigate to the **docs** directory and run `yarn`.
2. Start the project with `yarn dev` (make sure you don't have another server running on port `3002`).
3. Navigate to the docs you want to edit: `cd docs/pages/`.
4. If you update an older version, ensure the relevant changes are copied into `docs/pages/versions/unversioned/` for API docs.

## 📝 Writing a Commit Message

> If this is your first time committing to a large public repo, you could look through this neat tutorial: ["How to Write a Git Commit Message"](https://chris.beams.io/posts/git-commit/)

Commit messages are most useful when formatted like so: `[platform][api] Title`. For example, if you fix a bug in the package `expo-video` for iOS, you could write: `[ios][video] Fixed black screen bug that appears on older devices`.

## 🔎 Before Submitting

To help keep CI green, please make sure of the following:

- Remember to add a concise description of any user-facing changes to `CHANGELOG.md` file in the package you've changed or [root's CHANGELOG.md](/CHANGELOG.md) if your changes don't apply to any package. This is especially helpful for breaking changes!
- If you modified anything in `packages/`:
  - You transpiled the TypeScript with `yarn build` in the directory of whichever package you modified.
  - Run `yarn lint --fix` to fix the formatting of the code. Ensure that `yarn lint` succeeds without errors or warnings.
  - Run `yarn test` to ensure all existing tests pass for that package, along with any new tests you would've written.
  - All `console.log`s or commented out code blocks are removed!
- If you edited the **docs** directory:
  - Any change to the current SDK version should also be in the unversioned copy as well. Example:
    - You fixed a typo in `docs/pages/versions/vXX.0.0/sdk/app-auth.md`
    - Ensure you copy that change to: `docs/pages/versions/unversioned/sdk/app-auth.md`
  - You don't need to run the docs tests locally. Just ensure the links you include aren't broken, the format is correct, and the changes are following our [writing style guide](/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

### Extra Credit

- Our CI tests will finish early if you don't make changes to certain directories. If you want to **get results faster** then you should make changes to **docs** directory in one PR, and changes to anything else in another!