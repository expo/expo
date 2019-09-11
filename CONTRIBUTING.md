# Contributing to Expo

- [📦 Download and Setup](#---download-and-setup)
- [✏️ Editing Packages](#---editing-packages)
  - [⏱ Testing your changes](#--testing-your-changes)
- [📚 Updating Documentation](#---updating-documentation)
- [🔎 Before Submitting](#---before-submitting)
- [Expo client](#expo-client)
- [Code reviews](#code-reviews)
- [Updating the changelog](#updating-the-changelog)
- [Writing a commit message](#writing-a-commit-message)
- [Guidance](#guidance)
  - [On coherent pull requests](#on-coherent-pull-requests)
  - [On maintainable code](#on-maintainable-code)

Thanks so much for coming to help! Currently we accept PRs for `packages/`, `docs/`, `templates/`, `guides/`, `apps/` and markdown files. Because the native clients (`ios/`, `android/`) are so articulate you may not find that much progress can be made externally (but you're always allowed to try!). We've moved most of the fun code out of the client anyways to support the bare-workflow, this means that you'll do the majority of your native testing in a \*regular React Native project.

As you might imagine web code is very easy to test and contribute to, so that's all on the table! You may find that some of the web features you're looking for are actually in the [expo-cli repo](https://github.com/expo/expo-cli).

## 📦 Download and Setup

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device. (`git remote add upstream git@github.com:expo/expo.git` 😉)
2. Run the setup script with: `npm run setup`

   <!-- TODO(Bacon): Split this into 2 scripts so people can contribute to docs without installing React Native -->

   - Download submodules (like `react-native`)
   - Setup _git large-file-system_ which we use for big native libraries like Google Mobile Vision
   - Ensure yarn is installed
   - Ensure your computer is setup for `React Native` (Will install the Android NDK if it's not present)
   - Downloads the node modules (`yarn install`)

3. Navigate to the demo React Native project `cd apps/bare-expo`
4. Run the demo on any platform (Maybe start with web; it's the fastest! 😁)

   - Web: `yarn web`
   - iOS: `yarn ios`
   - Android: `yarn android`

> If this didn't work for you as described, please [open an issue.](https://github.com/expo/expo/issues/new/choose)

## ✏️ Editing Packages

All of our packages (Unimodules) can be found in the `packages/` directory. These packages are universally linked to the projects in the `apps/` directory (meaning any iOS, Android, web, or API changes can be tested from `apps/bare-expo/`). `bare-expo` is a Bare-Workflow React Native app that acts as a runner for the other projects in the `apps/` directory.

- `native-component-list`: This is where you can write demos or tests that require physical interaction (A good playground for testing).
- `test-suite`: You can write your E2E tests in here, when pushed to the remote, CI will run this project in Device Farm for Android, Detox for iOS, and Puppeteer for web!

1. Navigate to a package you want to edit. Ex: `cd packages/expo-constants`
2. Start the TypeScript build in watch mode: `yarn build`
3. Edit code in that package's `src/` directory
4. Play with your changes on a Simulator or device through `bare-expo`:
   - Add or modify a file named after the API you're working on. Ex: `apps/test-suite/tests/Constants.js`
   - Run the code from the `bare-expo` project with `yarn <android | ios | web>` or test the code with `yarn test:<ios | web>`
5. You can edit the native code by opening the projects in their respective editors:
   - Android Studio: `yarn edit:android`
   - Xcode: `yarn edit:ios`
   - Remember to **rebuild** the native project whenever you make a native change

**Extra Credit**

- [Guide to Unimodule Development](guides/Expo%20Universal%20Module%20Infrastructure.md)
- [Expo JS Style Guide](guides/Expo%20JavaScript%20Style%20Guide.md) (also mostly applies to TypeScript)
- The React Native dev tools are currently disabled in our fork [#5602](https://github.com/expo/expo/issues/5602). You can hack around this by cloning React Native outside this repo, then copying the contents `react-native/React/DevSupport` into `expo/react-native-lab/react-native/React/DevSupport` (This will only enable the shake gesture, CMD+R won't work yet).
- We use a fork of `react-native` in this repo, this fork is located at `react-native-lab/react-native` (you can make changes or cherry-picks from here if you want).
- All of the package's `build/` code should be committed. This is because working with native code can make things very unpredictable, we found this is the best way to cut down on confusion.
- We use a unified set of basic bash scripts and configs called `expo-module-scripts` to ensure everything runs smoothly (TypeScript, Flow, Babel, Jest, etc...).

### ⏱ Testing your changes

The best way to get your changes merged is to build good tests for them! We have three different kinds of tests: unit-tests, automated E2E-tests, and demos (Adding tests that you notice are missing is a great way to become my friend 🥳)!

- Unit-testing:
  - Create a test for your feature in the appropriate package's `src/__tests__` (If the file doesn't exist already, create it with the `*-test.ts` or `*-test.tsx` extension).
  - Run the test with `yarn test` and ensure it handles all platforms (iOS, Android, and web). If the feature doesn't support a platform, then you can exclude it by putting your test in a file with a platform extension like: `-test.ios.ts`, `-test.native.ts`, `-test.web.ts`...
  - You can also test platforms one at a time by pressing `"X"` and selecting the platform you want to test!
- E2E-testing:
  - Write your tests in `apps/test-suite/tests`
    - These tests are written with a non-feature complete version of jasmine that runs on native, so no special features like snapshot testing will be available.
    - If you created a new test file, be sure to add it in `apps/test-suite/TestUtils.js`. This is where you can do platform exclusion. Use `global.DETOX` to test for iOS tests, and `ExponentTest.isInCI` to test for Android Device Farm.
  - Run your tests locally from the `bare-expo` directory with `yarn test:ios`, or `yarn test:web`.
    - For the moment Android Detox is not setup, but you can still run the project in an emulator or on a device to test it.
    - It's important you test locally because native CI tests can be fragile, take a while to finish, and be frustrating when they fail.
    - When testing for web, you can set `headless: false` in the `apps/bare-expo/jest-puppeteer.config.js` to watch the tests live. You can also execute `await jestPuppeteer.debug();` in `apps/bare-expo/e2e/TestSuite-test.web.js` to pause the tests and debug them!
  - Remember to try and get your feature running on as many platforms as possible.

Thanks again for helping to make sure that Expo is stable for everyone!

## 📚 Updating Documentation

Our docs are made with [Next.js](https://github.com/zeit/next.js). They're located in the `docs/` directory. For more information look at the [`docs/readme.md`](/docs/README.md).

**TL;DR:**

1. Navigate to the `docs/` directory and run `yarn`.
2. Start the project with `yarn dev` (make sure you don't have another server running on port `3000`).
3. Navigate to the docs you want to edit: `cd docs/pages/versions/unversioned/`
4. If you update an older version, ensure the relevant changes are copied into `unversioned/`

## 🔎 Before Submitting

To help keep CI green, please make sure of the following ():

- Remember to add a concise description of the change to [CHANGELOG.md](/CHANGELOG.md). This is especially helpful for breaking changes!
- If you modified anything in `packages/`:
  - You transpiled the TypeScript with `yarn build` in the directory of whichever package you modified.
  - Run `yarn lint --fix` to fix the formatting of the code.
  - Run `yarn test` to ensure all existing tests pass for that package, along with any new tests you would've written.
  - All `console.log`s or commented out code blocks are removed! :]
- If you edited the `docs/`:
  - Any change to the current SDK version should also be in the unversioned copy as well. Example:
    - You fixed a typo in `docs/pages/versions/v34.0.0/sdk/app-auth.md` (latest at the time of writing this)
    - Ensure you copy that change to: `docs/pages/versions/unversioned/sdk/app-auth.md`
  - You don't need to run the docs tests locally, just ensure the links you include aren't broken, and the format is correct!

**Extra Credit**

- Our CI tests will halt if you didn't make changes to certain directories. If you want to **get results faster** then you should make changes to `docs/` in one PR, and changes to anything else in another!

## Expo client

Please check with us before putting work into a Pull Request! We don't yet have a good guide available that covers the nuances of how to work with the Expo client so you will want a direct line of communication with someone on the team to ask us questions. The best place to talk to us is either on Slack at https://slack.expo.io or the forums at https://forums.expo.io.

---

We ask pull requests to be coherent and maintainable, and require code review by the Expo team.

## Code reviews

The Expo team reviews all PRs and makes the judgement call on whether to accept them. An Expo team member will look at each PR and assign it to the appropriate reviewer for an in-depth review or request changes.

Writing a maintainable PR as described above is the best way to get it reviewed timely and potentially accepted. The easier to review and maintain the code, the more likely it will be accepted.

## Updating the changelog

Add a short, one-line description of the change to [CHANGELOG.md](/CHANGELOG.md), under the section appropriate for the change. This is especially helpful for breaking changes.

## Writing a commit message

Commit messages should include a title, summary, and test plan.

Write the title in the imperative mood and prefix it with a tag that describes the affected code, like `[android]` or `[video]`, and makes it easier to read through the commit log.

In the summary, explain the motivation behind the commit ("why") and the approach it takes ("how"). Note things that aren't communicated by the code or require more context to infer.

Use the test plan to communicate how to verify the code actually works and to help others in the future create their test plans for the same area of the codebase. Read the Expo guide on [Git and Code Reviews](/guides/Git%20and%20Code%20Reviews.md) for more guidance on PRs and test plans.

This post called ["How to Write a Git Commit Message"](https://chris.beams.io/posts/git-commit/) has a lot of good guidance, too.

## Guidance

### On coherent pull requests

Each PR should correspond to one idea and implement it coherently. This idea may be a feature that spans several parts of the codebase. For example, changing an API may include changes to the Android, iOS, and web implementations, the JavaScript SDK, and the docs for the API.

Generally, each PR should contain one commit that is amended as you address code review feedback. Each commit should be meaningful and make sense on its own. Similarly, it should be easy to revert each commit. This keeps the commit history easier to read when people are working on this code or searching for a commit that could have broken something.

### On maintainable code

Code is much more expensive to maintain than it is to write. A maintainable PR is much more likely to be accepted.

A maintainable PR is simple to understand and often small in scope. It is robust and unlikely to break if another part of the system is modified. It keeps related code close together and avoids prematurely separating concerns. It follows the coding standards implied by the codebase and Expo coding guidelines. It strikes a balance with enough code to provide a feature that's widely useful without being overly generalized. A maintainable PR minimizes the attention it needs as the codebase changes over time.

Tests and types can improve maintainability and we expect PRs to include them. In particular, use tests to demonstrate the behavior of edge cases that are less likely to occur than the common code path. It is the edge cases we are less likely to notice if they break, and it is the edge cases that we need to behave correctly when they expose an issue in an app and the developer needs to debug. It is relatively easy to get code working; write tests to keep the code working.

However, tests and types can also obstruct maintainability. Overfitted tests break more often and are more difficult to update even when refactoring code that doesn't change its public API. They consume time and attention. Some APIs don't lend themselves well to static typing and lead to precarious type definitions that are not simple to understand or modify. We use tests and types as a means to an end, not an end to zealously pursue.
