# Expo release workflow

# Stage 0 - Infra & Prerelease

## 0.1. Drop old SDKs

**Why:** We tend to support old SDK versions up to 6 months since they were released. Once we release a new one, it's a good opportunity to drop some old ones that are already older than 6 months.

**How:**

- Create a new branch from `main`.
- **iOS**:
  - Run `et remove-sdk --platform ios` to remove the oldest SDK version from iOS codebase and regenerate Pods.
  - Make sure Expo Go builds in Xcode as expected.
- **Android**:
  - Run `et remove-sdk --platform android` to remove Android's `expoview-abiXX_0_0` library and versioned code.
  - This script will print all references to the SDK version it just removed - check all of them and remove them if possible (remove legacy code).
  - Make sure Expo Go builds in Android Studio as expected.
- Repeat **iOS** and **Android** specific steps if you want to delete more SDK versions.
- Commit changes and create a pull request to `main` branch.

## 0.2. Update vendored modules

**Why:** Vendored modules often ship bugfixes and new features during our SDK cycles and we generally want these as part of our product, as well.

**How:**

- Wait until as close as possible to the branch cutoff to do this, as we generally want the most up-to-date versions of these libraries as possible.
- Run `et update-vendored-module --list-outdated`.
- Assign someone to update each listed module. If you're not sure who to assign, look at who updated it previously.
- Update each listed module separately, and test examples in NCL/test-suite to make sure none of the changes are unexpectedly breaking.
  - If there are unexpected breaking changes/instabilities in any libraries, it's ok to revert. We want to ship the best and most stable/feature-full product to our users, and if that means staying a little behind on versions sometimes, that's ok - use your best judgment or ask someone else on the team.
- Pay extra attention to messages and warnings printed along the way for each module. Sometimes these's need for some extra manual work to be done in the updated files.
- Add a CHANGELOG entry for each updated library and open a PR. Check the docs to make sure nothing needs to be updated (we generally just link directly to the third-party documentation).
- Make sure that each individual library update lands on `main` as a **separate commit** so that it's easy to revert later on if needed.

## 0.3. Update schema

**Why:** Various tools we will use throughout this process, including `expo-cli`, depend on the versioned schema hosted by www. We need to create the schema for this new SDK version.

**How:**

- In `universe`, `cd server/www/xdl-schemas`.
- `cp UNVERSIONED-schema.json XX.X.X-schema.json`
- Commit and push to `main` in order to deploy to staging. It is also good to deploy to production, you can feel free to do this at any time as long as `www` is safe to deploy.

## 0.4. Update versions on staging

**Why:** Various tools we will use throughout this process, including `expo-cli`, depend on data in the versions endpoint.

**How:**

- `et update-versions --sdkVersion XX.X.X --key facebookReactVersion --value <react package version>`
- `et update-versions --sdkVersion XX.X.X --key facebookReactNativeVersion --value <react-native package version>`
- `et update-versions --sdkVersion XX.X.X --key expoReactNativeTag --value sdk-XX.X.X`

## 0.5. Cut branch, sync, and tag React Native

If we're planning to update React Native version for the upcoming SDK then it should have been done before starting any of this!

**Why:**

We use our fork of React Native for building Expo Go, but it is not used otherwise. The submodule under `react-native-lab/react-native` is the source of truth for `react-native` version used throughout the `expo/expo` repository. Each SDK version has its own tagged version of React Native, even if it ends up being the exact same as upstream for that version or for a previous SDK release.

**How:**

- Go to `react-native-lab/react-native` submodule.
- Coordinate with whoever did the React Native upgrade (if anyone) or Brent (@brentvatne) to create a new branch for new SDK in our `react-native` fork (`sdk-XX` typically, where `XX` is the major number of the SDK version).
- Run `et update-react-native`. This expotools command copies `ReactAndroid` and `ReactCommon` folders from the submodule to the respective paths: `android/ReactAndroid` and `android/ReactCommon` and then executes `ReactAndroidCodeTransformer` that applies some Expo-specific code transformations.
- Add your git changes from both `react-native-lab` and `android` folders and create a pull request to `main` branch.
- Run `git tag -a 'sdk-XX.X.X' -m 'React Native X.Y.Z for Expo SDKXX'` (where `X.Y.Z` is the React Native version and `XX` is the major number of SDK version), to make a tag for the latest commit in your local repo.
- Push the tag to the remote using `git push --tags`.

**Note:** We may end up making changes to the `react-native#sdk-XX` branch at some point prior to release in order to fix issues that were encountered during QA and beta testing. We should delete and re-create the `sdk-XX.X.X` tag if this is done, so that when we do the final release the `react-native` version is `sdk-XX.0.0`.

## 0.6. Generate new mocks

**Why:** We provide some mocks of our native methods which are generated by traversing all the modules and its methods and making a configuration of all those methods with the number of arguments etc.

**How:**

- Please follow another guide: [Generating Jest Mocks](../Generating%20Jest%20Mocks.md).

## 0.7. Publish `next` packages

| Prerequisites                                                 |
| ------------------------------------------------------------- |
| [0.6. Generate new mocks](#06-generate-new-mocks)             |
| [0.7. Publishing next packages](#07-publishing-next-packages) |

**Why:** We need to publish the unimodule packages to NPM so that we're able to prepare and test new project templates and people using bare workflow can use and test these packages before the final release. We use the `next` tag so people using the modules in bare workflow projects right now do not get these prereleased versions! We do this from main before cutting the release branch so that the version number bumps land on main first.

**How:**

- Run `et publish-packages`. Talk to @tsapeta for more details/information.
- Run `et sync-bundled-native-modules` to sync the `bundledNativeModules.json` file with www.

## 0.8. Merge and cutoff changelogs

**Why:** We need to concatenate all new entries from packages' CHANGELOGs and add them to our main CHANGELOG file.

**How:**

- Run `et merge-changelogs --cut-off`.
- Review the entries, commit and push changes to main.

## 0.9. Publish `sdk-XX` project templates

| Prerequisites                                                               |
| --------------------------------------------------------------------------- |
| [0.7. Publish `next` packages](#07-publish-any-missing-or-changed-packages) |

**Why:** We also need to prepare project templates that are used when people run `npx create-expo-app` command and publish them to NPM registry to test in QA.

**How:**

- On main branch, run `et update-project-templates`/`et upt` that checks all `expo-template-*` packages under `templates` directory and bumps dependency versions wherever possible – based on versions stored in `packages/expo/bundledNativeModules.json` for Expo modules and 3rd-party libraries, `react-native` fork with appropriate SDK version and `expo` package itself.
- Update the native project files in bare templates based on the diffs on https://react-native-community.github.io/upgrade-helper/
- Test these project templates - you don't have to use `create-expo-app` at this point, just `npx expo start` them locally. You will need to set `"sdkVersion": "UNVERSIONED"` in `app.json` for managed templates to test them at this point.
- Run `et publish-templates`/`et ppt` and answer to questions it asks. **IMPORTANT:** These versions should be tagged as `sdk-XX` and not `latest`. (If tagged as `latest` they will be used by default whenever anyone runs `npx create-expo-app`.)
- If everything works as expected, commit changes to main.
- You can now init from templates by using the package name and tag, for example: `npx create-expo-app@latest --template blank@sdk-48`.

## 0.10. Generate new SDK docs

**Why:** We store separate versions of API reference docs for each SDK version. We need to version the docs as soon as we cut the release branch so that docs changes that land on main between cutting the release branch and the release date get applied to the new SDK version or not, as appropriate.

**How:**

- Do this step immediately before cutting the release branch.
- Run `et generate-docs-api-data` to regenerate `unversioned` API data files before cutting new documentation version.
- Run `et generate-sdk-docs --sdk XX.X.X` to generate versioned docs for the new SDK.
- Run `yarn run schema-sync XX` (`XX` being the major version number) in `docs` directory and then change the schema import in `pages/versions/<version>/config/app.mdx` from `unversioned` to the new versioned schema file.
- Ensure that the `version` in package.json has NOT been updated to the new SDK version. SDK versions greater than the `version` in package.json will be hidden in production docs, and we do not want the new version to show up until the SDK has been released.
- Commit and push changes to main.

# Stage 1 - Unversioned Quality Assurance and Versioning

## 1.1. Cut off release branch

| Prerequisites      |
| ------------------ |
| All previous tasks |

**Why:** Since we are about to start QA, cutting a branch ensures that we aren't testing and versioning code that is changing under our feet. You can alternatively defer this until later if you don't have any reason to defer from `main` yet. Some later steps in this guide will need to be performed from the release branch.

**How:** After the SDK branch cutoff deadline, cut the `sdk-XX` branch from `main` and push it to the remote repo. You can continue to rebase the release branch on top of `main` until `main` starts to include commits that you do not want to pull in to the SDK branch, at which point you will need to cherry-pick.

## 1.2. Unversioned Quality Assurance

| Prerequisites                                       |
| --------------------------------------------------- |
| [1.2. Update React Native](#12-update-react-native) |

**Why:** Smoke test and manual QA before versioning, so that we know that any regressions in versioning are due to the versioning process.

**How:**

- Go through the [Quality Assurance](Quality%20Assurance.md) guide. Use `UNVERSIONED` as a `sdkVersion`.
- Take notes of everything that you find, and share those notes with the team when you are done. If there are some quick fixes you can do during QA, feel free to do those, or self assign and take care of them after you finish QA.

## 1.3. Version code for the new SDK

| Prerequisites                                                           |
| ----------------------------------------------------------------------- |
| [1.2. Unversioned Quality Assurance](#12-unversioned-quality-assurance) |

**Why:** As we need to support multiple SDK versions, the code needs to be prefixed for each version so we don't get conflicts and duplicated classes. Such prefixed version of our APIs is called ABI.

**How:**

- Checkout `sdk-XX` branch and pull changes from the remote.
- Make sure that everything that is ready and we planned to land in this cycle is already merged and **tested**.
- **iOS**:
  - Run `et add-sdk --platform ios` to copy unversioned code into the new ABI and prefix (or suffix) its files and corresponding code references with `ABIXX_0_0`. If this script errors partway, you can always delete the new directory it created under `ios/versioned-react-native` and revert any other changes it made to `EXSDKVersions.plist` and `sdkVersions.json` (or just run `et remove-sdk --platform --sdkVersion XX.0.0`). Then it's safe to run this script again.
  - Let the `add-sdk` script to regenerate Podfile and reinstall pods, then try to build the project in Xcode. This script does most of the work, but usually breaks in various ways, partly because some assumptions change every SDK cycle. If you found anything broken, please keep versioning script up to date.
- **Android**:
  - Run `et add-sdk --platform android` to create the new versioned AAR and expoview code. This script will attempt to rename some native libraries and will ask you to manually verify that it has renamed them all properly. If you notice some that are missing, add them to the list in `tools/src/versioning/android/libraries.ts` and rerun the script. Commit the changes.
  - You may need to make a change like [this one](https://github.com/expo/expo/commit/8581608ab748ed3092b71befc3a0b8a48f0f20a0#diff-c31b32364ce19ca8fcd150a417ecce58) in order to get the project to build, as the manifest merger script we're currently using doesn't handle this properly.
  - Some libraries (particularly expo-notifications and expo-updates) include classes and singletons that should be left out of versioning on Android -- i.e. of which there should only be one copy of in Expo Go. The file `tools/src/versioning/android/android-packages-to-rename.txt` contains all the Java/Kotlin packages and classes that will be versioned, and `tools/src/versioning/android/android-packages-to-keep.txt` contains all the packages and classes that will be left out of versioning (with the latter taking precedence over the former). If you run into compilation errors like `incompatible types: expo.modules.... cannot be converted to abixx_x_x.expo.modules...`, especially in one of the aforementioned modules, it's possible one or both of these lists may need to be updated with classes that have been added since the last SDK release.
  - The versioning script is not idempotent, so if you need to make any changes or re-version any libraries, the simplest way to do so is either make the changes manually in versioned classes (if they are very simple) or remove the SDK and re-add it. If you run `et remove-sdk --platform android --sdkVersion XX.X.X && et add-sdk --platform android` then the resulting diff should just include the re-versioned changes, and it's easy to check this manually.
- Commit the changes to the `sdk-XX` branch and push. Take a look at the GitHub stats of added/deleted lines in your commit and be proud of your most productive day this month 😎.

# Stage 2 - Quality Assurance

## 2.1. Versioned Quality Assurance - Expo Go for iOS/Android

| Prerequisites                                                         |
| --------------------------------------------------------------------- |
| [1.3. Version code for the new SDK](#13-version-code-for-the-new-sdk) |

**Why:** We really care about the quality of the code that we release for the users. Quality Assurance is the most important task during the release process, so please don't ignore any steps and also focus on things that have been changed/reworked/refactored in this cycle.

**How:**

- On iOS, by default, Expo Go builds with only unversioned code. Make sure to switch the scheme to `Expo Go (versioned)` in Xcode before building the app for versioned QA.
- Go through the [Quality Assurance](Quality%20Assurance.md) guide.
- Commit any fixes to `main` and cherry-pick to the `sdk-XX` branch.

## 2.2. Web Quality Assurance

**Why:** We really care about the quality of the code that we release for the users. Quality Assurance is the most important task during the release process, so please don't ignore any steps and also focus on things that have been changed/reworked/refactored in this cycle.

**How:**

Web is comparatively well-tested in CI, so a few manual smoke tests suffice for web QA.

- Make sure the `expo-cli` version in the `expo/expo` repo is up-to-date.
- `cd apps/native-component-list`
- Run `yarn web` and press `w` to open in the browser. Make sure the app loads successfully in development.
- Run `expo build:web`, `npx serve web-build` and then `open http://localhost:5000/`. Ensure the built version of the app loads successfully.
- Finally, test deploying the app by running `npx now web-build`.

## 2.3. Cherry-pick Versioned Code to `main`

**Why:** Most commits should flow in the `main` -> `sdk-XX` branch direction. Versioning is an exception to this because we explicitly want to version the set of code on the `sdk-XX` branch, but we want that versioned code on main for later releases.

**How:**

- Cherry-pick all versioning commits from `sdk-XX` to `main`.

## 2.4. Publish demo apps

**Why:** We need to publish `native-component-list` so other people can try it out (including app reviewers from Apple).

**How:**

- Go to `apps/native-component-list` and make sure its `sdkVersion` in `app.json` is set to the correct SDK (not `UNVERSIONED`).
- Run `expo publish` for both `community` and `applereview` accounts.
- Open `native-component-list` from `applereview` account and make sure it launches as expected.

## 2.5. Publish any missing or changed packages

**Why:** Any changes that have been made to packages during QA / since the initial publish (step [0.7](#07-publish-next-packages)) still need to be published for bare workflow users (and managed, for TS changes).

**How:**

- From the main branch, run `et publish-packages` and publish all packages with changes.
- From the main branch, run `et sync-bundled-native-modules` to sync the `bundledNativeModules.json` file with www.
- If there are any packages for which a patch was cherry-picked to the release branch AND a new feature (requiring a minor version bump) was added on main in the meantime, you will need to publish a patch release of that package from the release branch which does not include the new feature.
  - Note that **only** the patch version number can be bumped on the release branch; **do not** bump the minor version number of any package on the release branch.

# Stage 3 - Expo Go

## 3.1. Publish home

**Why:** We need to publish a new version of home in order to embed it in the Expo Go apps before building them.

**How:**

- Update `version` and `sdkVersion` in `home/app.json`. Commit this change.
- Make sure to run `yarn` in `home`.
- Publish dev home first by running `et publish-dev-home`. Commit the change to `dev-home-config.json`; do not commit any other changes from the script (in particular, if it changes `home/app.json`, do not commit those changes).
- Run a debug build of both the iOS and Android versions of Expo Go to smoke test the newly published dev home.
- To publish production home, log into expo-cli with the `exponent` account (credentials in 1P). Then publish home with `EXPO_NO_DOCTOR=true expo publish`. This will publish home to production (making it available as an OTA update for the SDK version in `app.json`) and write changes to two manifests and bundles (one each for iOS and Android) in the repo. Commit these changes.

## 3.2. Build and submit

| Prerequisites      |
| ------------------ |
| All previous tasks |

**How:**

- **iOS**:

  - Bump Expo Go versions (CFBundleVersion, CFBundleShortVersionString) in `ios/Exponent/Supporting/Info.plist`.
  - We use `fastlane match` to sync our iOS credentials (certificates and provisioning profiles) - you will need them to properly archive and upload the distribution build to App Store Connect. Run `fastlane match appstore` from the project root folder to download them. You'll need to be authorized and have Google Cloud keys to do this, if you don't have them ask someone who has been publishing Expo Go in the past.
  - Make sure build's metadata are up to date (see files under `fastlane/metadata/en-US`).
  - Make sure that production home app is published and new JS bundles are up-to-date - they're gonna be bundled within the binary and used at the first app run (before Expo Go downloads an OTA update).
  - Run `fastlane ios release` from the project root folder and follow the prompt. This step can take 30+ minutes, as fastlane will update (or create) the App Store Connect record, generate a signed archive, and upload it. If for some reason you have to archive and upload the app through Xcode (without Fastlane), make sure to use `Expo Go (versioned)` Xcode scheme.
  - Wait for Apple to finish processing your new build. This step can take another 30+ minutes (but sometimes just a few).
  - Once the processing is done, go to TestFlight section in App Store Connect, click on the new build and then click `Provide Export Compliance Information` button and select **"None of the algorithms mentioned above"** in the dialog - we generally have not made changes to encryption.
    - Alternatively, you can set the [`ios.config.usesNonExemptEncryption` to `false`](https://docs.expo.dev/versions/latest/sdk/securestore/#exempting-encryption-prompt) in the Expo config. This will automatically set the export compliance to **"None of the algorithms mentioned above"** and will avoid displaying this prompt each time you are going through this process in App Store Connect.
  - Publish that build to TestFlight and ensure the external testers group is added to the build. **This will trigger a review**, and the build won't be available to external testers until the review is completed.
  - You should also do some smoke tests as soon as the app becomes available for internal TestFlight testers, for example against `native-component-list` published under `applereview` account. If you notice something important isn't working right, remove the app from review and re-do this process once it's resolved.

- **Android**:
  - Unlike for iOS, we will not submit the Android app to the store at this point. We just need to bump the version so we can do an APK build for distribution through Expo CLI.
  - Bump the `versionCode` and `versionName` in android/app/build.gradle. Commit this to main and cherry-pick to the release branch. You might need to check the previous release branch to make sure the new `versionCode` is greater than the previous patch version, in case that commit never made it to main.
  - The APK will be available as an artifact from the "Android Client" CI job. If no CI jobs are running on the release branch, you just need to open a PR from the release branch to main. (Don't merge it; it only exists to make CI jobs run.)
  - Download the APK and do a quick smoke test: install it in your local emulator or on a device and open a project.

## 3.3. Make a simulator/emulator build

| Prerequisites                                 |
| --------------------------------------------- |
| [3.2. Build and submit](#32-build-and-submit) |

**Why:** To allow developers to install Expo Go on the simulator (which doesn't have an App Store) we need to make a build for it, upload it to S3 servers and save its url and version on the versions endpoint. These builds are then downloaded and installed by the users using `expo client:install:ios`.

**How:**

- Run `et dispatch client-{ios,android}-simulator` to trigger building Expo Go for simulators, uploading the archive to S3 and updating URL in versions endpoint.
- Once the job is finished, test if this simulator build work as expected. You can install and launch it using expotools command `et client-install -p {ios,android}`.
- Ensure that you update the root `iosVersion`/`androidVersion` `iosUrl`/`androidUrl` properties, eg:
  - `et update-versions-endpoint -k 'iosVersion' -v '2.19.3' --root`
  - `et update-versions-endpoint -k 'iosUrl' -v 'https://dpq5q02fu5f55.cloudfront.net/Exponent-2.19.3.tar.gz' --root`

# Stage 4 - Sync with EAS Build

## 4.1. Update default image for the new SDK version

**Why:** Each release works best with a specific image (Xcode/Node/npm/yarn/Java/NDK/etc version).

**How:**

Coordinate with the EAS Build team to do the following:

- If an appropriate image doesn't exist yet for this SDK, create one.
- Add the SDK version to the [`reactNativeImageMatchRules` for Android](https://github.com/expo/eas-build/blob/main/packages/eas-build-job/src/android.ts) and [`sdkVersionToDefaultBuildImage` for iOS](https://github.com/expo/eas-build/blob/main/packages/eas-build-job/src/ios.ts).
- Manually test building a managed project with the new default.

# Stage 5 - Beta release

| Prerequisites                                                            |
| ------------------------------------------------------------------------ |
| **All previous steps** and App Store approval for TestFlight public beta |

Once everything above is completed and Apple has approved Expo Go (iOS) for the TestFlight public beta, the beta release is ready to go. Complete the following steps **in order**, ideally in fairly quick succession (not spread over multiple days).

## 5.1. Deploy new docs with beta version

**Why:** Make the docs available to beta testers and discoverable through the version selector, but not the default.

**How:** Merge the new SDK docs into main, but don't update the `version` in `package.json` yet. Instead, set the `betaVersion` field to the SDK version number, eg: `"betaVersion": "40.0.0"`.

## 5.2. Add related packages to versions endpoint

**Why:** These package versions are used by `expo-cli` in the `install` command to ensure that the proper versions of packages are installed in developers' projects.

**How:**

- For each of the following packages, run et update-versions -k 'relatedPackages.<package-name>' -v '^X.Y.Z'`
  - `jest`
  - `typescript`
  - `@babel/core`
  - `@expo/config`
  - `@types/react`
  - `@types/react-dom`
  - `react-native-web`
  - `babel-preset-expo`
  - `@expo/config-plugins`
  - `@expo/webpack-config`
  - `@expo/prebuild-config`
  - `expo-modules-autolinking`
- One way to get the right version numbers is to run `yarn why <package-name>` to see which version is used by apps in the expo/expo repo. Generally the version numbers should use the caret (`^`) semver symbol, please refer to the semver symbol used for the package on the most recent release on the versions endpoint.

## 5.3. Re-publish project templates

**Why:** Ensure that the templates include the latest version of packages, so when we release the beta everything is up to date.

**How:** Follow [0.9. Publish `sdk-XX` project templates](#09-publish-sdk-xx-project-templates) but be sure that the published template has the `sdk-xx` tag on npm in addition to `next`.

## 5.4. Promote versions to production with new SDK version flagged as beta

**Why:** It's time for everything that uses the production versions endpoint to know about this new SDK version!

**How:**

- `et update-versions-endpoint -s ${SDK_MAJOR_VERSION}.0.0 -k 'beta' -v 'true'`
- `et promote-versions-to-prod`
- Double check every change before pressing `y`!

## 5.5. Add SDK support to Snack

**How:** Reach out to Cedric (@byCedric)

## 5.6. Announce beta availability

**Why:** We want interested developers to try it out and report any issues they encounter.

**How:**

- Copy the previous release notes blog post and replace versions with new versions, remove all content that doesn't apply to this version. Fill in the blanks.
- Check for any notes in the beta release notes Linear task
- Share the link in the #blog and #sdk-release channels and ask for suggestions.

## 5.7. Test, fix, and monitor

**Why:** The beta period will run for approximately 1 week. During that time we should try to discover regressions and new bugs, fix them, and roll the fixes out to the beta users. The fixes will require repeating many of the previous steps, such as re-submitting an iOS build and re-deploying Turtle.

**How:**

- Monitor GitHub issues.
- Expo team should all update any dogfooding apps they work on, including building on EAS Build, deploying updates with EAS Update, and ideally even submitting to stores.
- Test out new features.
- Report updates in the umbrealla issue.
- Fix, test, repeat.
- Update issue with fixes from latest beta release

## 5.8. Submit iOS Expo Go for review

**Why:** When the Expo Go app for iOS appears to be a good candidate for the final release, we should submit it for review in order to have an accepted release ready to deploy to the App Store in one button click when we proceed to the next stage. This should be ideally be done ~1-3 days before moving on to the final release, to account for review delays.

**How:**

- If needed, refer back to [3.2. Build and submit](#32-build-and-submit) to create a new build and upload it to the App Store. Wait for it to finish processing.
- In [App Store Connect](https://appstoreconnect.apple.com), select the build you previously uploaded and released to TestFlight, glance through the metadata to verify that it's what you want, and save the changes if any.
  - Fill in "What's New in This Version" with something like "This version contains minor improvements and adds support for SDK XX".
- Click Submit to send the new binary to Apple.
- If changes are required after submission, you can remove the release from review and repeat this step.

## 5.9. Start release notes document

**Why:** The release notes are a collaborative effort, we need contributions from folks who worked on the various improvements shipping with the release to draft brief explainations for them if they believe its worth calling out. It can take time for everyone to carve out time for this, so it's best to start it well before the final release in order to give people a week or so to contribute.

**How:**

- Copy the previous release notes blog post and replace versions with new versions, remove all content that doesn't apply to this version. Fill in the blanks.
- Check for any notes in the release notes Linear task
- Share the link in the #blog and #sdk-release channels, ask for suggestions.

# Stage 6 - Final release

**If today is Friday:** Wait until next week to finish the release :)

## 6.1. Release Expo Go for iOS/Android to the general public

**How:**

- **iOS**:
  - Log into [App Store Connect](https://appstoreconnect.apple.com) and release the approved version.
- **Android**:
  - Add a new file under `/fastlane/android/metadata/en-US/changelogs/[versionCode].txt` (it should usually read “Add support for Expo SDK XX”).
  - Open `Android Client` workflow on GitHub Actions and when it completes, download the APK from Artifacts and do a smoke test -- install it on a fresh Android device, turn on airplane mode, and make sure Home loads.
  - Run `et dispatch client-android-release` to trigger appropriate job on GitHub Actions. About 45 minutes later the update should be **downloadable** via Play Store.

## 6.2. Promote packages to latest on NPM registry

**Why:** Previously we've published packages and now that we have gone through beta testing and everything is good to go, we can promote those packages to `latest` on NPM.

**How:**

- Use the `et promote-packages` script.
- Select the packages that should be promoted and continue.

## 6.3. Remove beta tag from new SDK on versions endpoint

**Why:** Make the new SDK the default for everything that depends on the versions endpoint, eg: `expo upgrade`.

**How:**

- `et update-versions-endpoint -s ${SDK_MAJOR_VERSION}.0.0 -k 'beta' --delete`
- `et promote-versions-to-prod`
- Double check every change before pressing `y`!

## 6.4. Remove beta tag from new SDK on Snack

**Why:** Once the new SDK is available publicly, we should switch to using it by default on Snack.

**How:** Reach out to Cedric

## 6.5. Deploy final docs

**Why:** Show the new docs by default now that the SDK is being released!

**How:**

- Update the `version` field docs/package.json to match the new SDK version, delete the `betaVersion` field, and push to main.
- Ensure that the new SDK version is visible in the API reference and is marked as latest.

## 6.6. Publish final project templates

**Why:** We need to make sure the templates point to the latest versions of our packages and update the tags on npm so they will be used by default with `npx create-expo-app`.

**How:**

- Update the templates to point to the final versions of the released packages.
- Test these project templates in Expo Go or by building them (bare workflow) - you don't have to use `npx create-expo-app` at this point, just run `npx expo start` to run them locally.
- Run `et publish-templates`/`et ppt` and answer to questions it asks. **IMPORTANT:** These versions should be tagged as `latest` and `sdk-xx` where `xx` is the major version for the SDK being released.
- If everything works as expected, commit changes to main and make sure to cherry-pick that commit to the release branch as well.

## 6.7. Press release

| Prerequisites      |
| ------------------ |
| All previous tasks |

This should be ready to publish immediately after the previous step is finished!

**Why:** We want to announce it on social media once the new SDK is out. We usually start from the blog post on Medium that describes the changes that come up since the previous release, how to upgrade from the previous SDK version, etc.

**How:**

- Publish release notes to Medium.
- Tweet a link on the @expo account.

## 6.8. Follow-up

**Why:** A few places in our infrastructure need to know about the release notes once they're published.

**How:**

- Add the release notes to the versions endpoint: `et update-versions --sdkVersion XX.X.X --key releaseNoteUrl --value <url>` and `et promote-versions-to-prod`
- Add the release notes URL to the `upgrading-expo-sdk-walkthrough` docs page, commit and push to main, and deploy docs again.
- Coordinate with Juwan (@FiberJW) / Jon (@jonsamp) to make sure the release notes get added to the expo.io homepage.

# Stage 7 - Clean up

## 7.1. Mark old SDK as deprecated

**Why:** A few expo-cli commands use this flag to determine which SDK versions are still supported.

**How:** `et update-versions --sdkVersion XX.X.X --deprecated true`, then `et promote-versions`
