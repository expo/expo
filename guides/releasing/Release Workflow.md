# Expo release workflow

  - [Stage 0 - Infra &amp; Prerelease](#stage-0---infra--prerelease)
    - [0.1. Dropping old SDKs](#01-dropping-old-sdks)
    - [0.2. Update vendored modules](#02-update-vendored-modules)
    - [0.3. Update schema on staging](#03-update-schema-on-staging)
    - [0.4. Update versions on staging](#04-update-versions-on-staging)
    - [0.5. Tag React Native fork](#05-tag-react-native-fork)
    - [0.6. Generate new mocks](#06-generate-new-mocks)
    - [0.7. Publishing next packages](#07-publishing-next-packages)
    - [0.8. Generate new SDK docs](#08-generate-new-sdk-docs)
  - [Stage 1 - Unversioned Quality Assurance and Versioning](#stage-1---unversioned-quality-assurance-and-versioning)
    - [1.1. Cutting off release branch](#11-cutting-off-release-branch)
    - [1.2. Update React Native](#12-update-react-native)
    - [1.3. Unversioned Quality Assurance](#13-unversioned-quality-assurance)
    - [1.4. Versioning code for the new SDK](#14-versioning-code-for-the-new-sdk)
  - [Stage 2 - Quality Assurance](#stage-2---quality-assurance)
    - [2.1. Versioned Quality Assurance - iOS/Android clients](#21-versioned-quality-assurance---iosandroid-clients)
    - [2.2. Standalone App Quality Assurance](#22-standalone-app-quality-assurance)
    - [2.3. Web Quality Assurance](#23-web-quality-assurance)
    - [2.4. Cherry-pick Versioned Code to master](#24-cherry-pick-versioned-code-to-master)
    - [2.5. Publish demo apps](#25-publish-demo-apps)
  - [Stage 3 - Publish NPM packages](#stage-3---publish-npm-packages)
    - [3.1. Publish any missing or changed packages](#31-publish-any-missing-or-changed-packages)
    - [3.2. Publishing next project templates](#32-publishing-next-project-templates)
  - [Stage 4 - Expo client](#stage-4---expo-client)
    - [4.1. Releasing beta version](#41-releasing-beta-version)
    - [4.2. Making a simulator build](#42-making-a-simulator-build)
    - [4.3. Submit iOS client to App Store Review](#43-submit-ios-client-to-app-store-review)
    - [4.4. Release clients to external beta testers](#44-release-clients-to-external-beta-testers)
  - [Stage 5 - ExpoKit and standalone apps](#stage-5---expokit-and-standalone-apps)
    - [5.1. Updating ExpoKit](#51-updating-expokit)
    - [5.2. Make shell app build](#52-make-shell-app-build)
    - [5.3. Make adhoc client shell app for iOS](#53-make-adhoc-client-shell-app-for-ios)
    - [5.4. Deploy Turtle with new shell tarballs](#54-deploy-turtle-with-new-shell-tarballs)
  - [Stage 6 - Final release](#stage-6---final-release)
    - [6.1. Release iOS/Android clients](#61-release-iosandroid-clients)
    - [6.2. Deploy Turtle/ExpoKit to production](#62-deploy-turtleexpokit-to-production)
    - [6.3. Deploy new docs](#63-deploy-new-docs)
    - [6.4. Add related packages to versions endpoint](#64-add-related-packages-to-versions-endpoint)
    - [6.5. Promote versions to production](#65-promote-versions-to-production)
    - [6.6. Promote packages to latest on NPM registry](#66-promote-packages-to-latest-on-npm-registry)
    - [6.7. Publishing final project templates](#67-publishing-final-project-templates)
    - [6.8. Press release](#68-press-release)
    - [6.9. Follow-up](#69-follow-up)
  - [Stage 7 - Snack](#stage-7---snack)
    - [7.1. Add SDK support to Snack](#71-add-sdk-support-to-snack)

# Stage 0 - Infra & Prerelease

## 0.1. Dropping old SDKs

**Why:** We tend to support old SDK versions up to 6 months since they were released. Once we release a new one, it's a good opportunity to drop some old ones that are already older than 6 months.

**How:**

- Create a new branch from `master`.
- **iOS**:
  - Run `et remove-sdk --platform ios` to remove the oldest SDK version from iOS codebase and regenerate Pods.
  - Make sure Expo client builds in Xcode as expected.
- **Android**:
  - Run `et remove-sdk --platform android` to remove Android's `expoview-abiXX_0_0` library and versioned code.
  - This script will print all references to the SDK version it just removed - check all of them and remove them if possible (remove legacy code).
  - Make sure Expo client builds in Android Studio as expected.
- Repeat **iOS** and **Android** specific steps if you want to delete more SDK versions.
- Commit changes and create a pull request to `master` branch.

## 0.2. Update vendored modules

**Why:** Vendored modules often ship bugfixes and new features during our SDK cycles and we generally want these as part of our product, as well.

**How:**

- Wait until as close as possible to the branch cutoff to do this, as we generally want the most up-to-date versions of these libraries as possible.
- Run `et update-vendored-module --list-outdated`.
- Update each listed module separately, and test examples in NCL/test-suite to make sure none of the changes are unexpectedly breaking.
  - If there are unexpected breaking changes/instabilities in any libraries, it's ok to revert. We want to ship the best and most stable/feature-full product to our users, and if that means staying a little behind on versions sometimes, that's ok - use your best judgment or ask someone else on the team.
- Pay extra attention to messages and warnings printed along the way for each module. Sometimes these's need for some extra manual work to be done in the updated files.
- Add a CHANGELOG entry for each updated library and open a PR. Check the docs to make sure nothing needs to be updated (we generally just link directly to the third-party documentation).
- Make sure that each individual library update lands on `master` as a **separate commit** so that it's easy to revert later on if needed.

- Finally, talk to @brentvatne or @tsapeta about any modules extracted from RN that we need to include community versions of.

## 0.3. Update schema on staging

**Why:** Various tools we will use throughout this process, including `expo-cli`, depend on the versioned schema hosted by www. We need to create the schema for this new SDK version.

**How:**

- In `universe`, `cd server/www/xdl-schemas`.
- `cp UNVERSIONED-schema.json XX.X.X-schema.json`
- Commit and push to `master` in order to deploy to staging.

## 0.4. Update versions on staging

**Why:** Various tools we will use throughout this process, including `expo-cli`, depend on data in the versions endpoint.

**How:**

- `et update-versions --sdkVersion XX.X.X --key facebookReactVersion --value <react package version>`
- `et update-versions --sdkVersion XX.X.X --key facebookReactNativeVersion --value <react-native package version>`
- `et update-versions --sdkVersion XX.X.X --key expoReactNativeTag --value sdk-XX.X.X`

## 0.5. Tag React Native fork

**Why:** In managed Expo workflow, we use our forked `react-native` repo. The submodule under `react-native-lab/react-native` is the source of truth for `react-native` version used throughout the repository. We will use it in later steps.

**How:**

- Go to `react-native-lab/react-native` submodule.
- Make sure you're on the branch dedicated for this SDK release and that your local version of it is up to date by running `git checkout sdk-XX` and then `git pull`.
- Run `git tag -a 'sdk-XX.X.X' -m 'React Native X.Y.Z for Expo SDKXX'` (where `X.Y.Z` is the React Native version and `XX` is the major number of SDK version), to make a tag for the latest commit in your local repo.
- Push the tag to the remote using `git push --tags`.

## 0.6. Generate new mocks

**Why:** We provide some mocks of our native methods which are generated by traversing all the modules and its methods and making a configuration of all those methods with the number of arguments etc.

**How:**

- Please follow another guide: [Generating Jest Mocks](../Generating%20Jest%20Mocks.md).

## 0.7. Publishing `next` packages

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [0.6. Generate new mocks](#06-generate-new-mocks) |
| [0.7. Publishing next packages](#07-publishing-next-packages) |

**Why:** We need to publish the unimodule packages to NPM so that we're able to prepare and test new project templates and people using bare workflow can use and test these packages before the final release. We use the `next` tag so people using the modules in bare workflow projects right now do not get these prereleased versions! We do this from master before cutting the release branch so that the version number bumps land on master first.

**How:**

- Run `et publish-packages`. Talk to @tsapeta for more details/information.

## 0.8. Generate new SDK docs

**Why:** We store separate versions of docs for each SDK version. We need to version the docs as soon as we cut the release branch so that docs changes that land on master between cutting the release branch and the release date get applied to the new SDK version or not, as appropriate.

**How:**

- Do this step immediately before cutting the release branch.
- Run `et generate-sdk-docs --sdk XX.X.X` to generate versioned docs for the new SDK. If we've upgraded React Native version in this release, we should also use `--update-react-native-docs` flag which imports the current version of React Native docs that also show up on our docs page. (If there are issues with this, talk with @byCedric.)
- Update the `sourceCodeUrl` frontmatter in the SDK docs to point to the new SDK version (find and replace in editor).
- Ensure that the `version` in package.json has NOT been updated to the new SDK version. SDK versions greater than the `version` in package.json will be hidden in production docs, and we do not want the new version to show up until the SDK has been released.
- Commit and push changes to master.

# Stage 1 - Unversioned Quality Assurance and Versioning

## 1.1. Cutting off release branch

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| All previous tasks |

**Why:** Since we are about to start QA, cutting a branch ensures that we aren't testing and versioning code that is changing under our feet.

**How:** After the SDK branch cutoff deadline, cut th `sdk-XX` branch from `master` and push it to the remote repo.

## 1.2. Update React Native

**Why:** Each SDK version has its own version of React Native. If we're planning to update React Native version for the upcoming SDK then we need to update our fork of React Native and update `react-native-lab/react-native` submodule in this repo which is the source of truth for `react-native` version used throughout the repository.

**How:**

- Go to `react-native-lab/react-native` submodule.
- Coordinate with James (@ide) to create a new branch for new SDK in our `react-native` fork (`sdk-XX` typically, where `XX` is the major number of the SDK version).
- Run `et update-react-native`. This expotools command copies `ReactAndroid` and `ReactCommon` folders from the submodule to the respective paths: `android/ReactAndroid` and `android/ReactCommon` and then executes `ReactAndroidCodeTransformer` that applies some Expo-specific code transformations.
- Add your git changes from both `react-native-lab` and `android` folders and create a pull request to `master` branch. Cherry-pick this commit to the `sdk-XX` branch.

## 1.3. Unversioned Quality Assurance

| Prerequisites                                       |
| --------------------------------------------------- |
| [1.2. Update React Native](#12-update-react-native) |

**Why:** This step is especially important on Android because we build ReactAndroid into an aar in the versioning step, so if there are any issues that are discovered after versioning you have to redo the whole versioning step (which takes quite a while 😞).

**How:**

- Go through another guide about [Quality Assurance](./Quality%20Assurance.md). Use `UNVERSIONED` as a `sdkVersion`.
- Fix everything you noticed in quality assurance steps or delegate these issues to other people in a team (preferably unimodule owners). Fixes for all discovered bugs should land on `master` and then be cherry-picked to the `sdk-XX` branch before versioning.

## 1.4. Versioning code for the new SDK

| Prerequisites                                                           |
| ----------------------------------------------------------------------- |
| [1.3. Unversioned Quality Assurance](#13-unversioned-quality-assurance) |

**Why:** As we need to support multiple SDK versions, the code needs to be prefixed for each version so we don't get conflicts and duplicated classes. Such prefixed version of our APIs is called ABI.

**How:**

- Checkout `sdk-XX` branch and pull changes from the remote.
- Make sure that everything that is ready and we planned to land in this cycle is already merged and **tested**.
- **iOS**:
  - Run `et add-sdk --platform ios` to copy unversioned code into the new ABI and prefix (or suffix) its files and corresponding code references with `ABIXX_0_0`. If this script errors partway, you can always delete the new directory it created under `ios/versioned-react-native` and revert any other changes it made to `EXSDKVersions.plist` and `sdkVersions.json` (or just run `et remove-sdk --platform --sdkVersion XX.0.0`). Then it's safe to run this script again.
  - Let the `add-sdk` script to regenerate Podfile and reinstall pods, then try to build the project in Xcode. This script does most of the work, but usually breaks in various ways, partly because some assumptions change every SDK cycle. If you found anything broken, please keep versioning script up to date.
- **Android**:
  - Run `et add-sdk --platform android` to create the new versioned AAR and expoview code. This script will attempt to rename some native libraries and will ask you to manually verify that it has renamed them all properly. If you notice some that are missing, add them to the list in `tools/expotools/src/versioning/android/libraries.ts` and rerun the script. Commit the changes.
  - You may need to make a change like [this one](https://github.com/expo/expo/commit/8581608ab748ed3092b71befc3a0b8a48f0f20a0#diff-c31b32364ce19ca8fcd150a417ecce58) in order to get the project to build, as the manifest merger script we're currently using doesn't handle this properly.
  - Run `et android-build-packages` to build the packaged AARs for each unimodule for the new SDK version. If any of the builds fail, follow the directions from the script to fix the build and then rerun the build command for only the failed packages.
- Commit the changes to the `sdk-XX` branch and push. Take a look at the GitHub stats of added/deleted lines in your commit and be proud of your most productive day this month 😎.

# Stage 2 - Quality Assurance

## 2.1. Versioned Quality Assurance - iOS/Android clients

| Prerequisites                                                               |
| --------------------------------------------------------------------------- |
| [1.4. Versioning code for the new SDK](#14-versioning-code-for-the-new-sdk) |

**Why:** We really care about the quality of the code that we release for the users. Quality Assurance is the most important task during the release process, so please don't ignore any steps and also focus on things that have been changed/reworked/refactored in this cycle.

**How:**

- Go through another guide about [Quality Assurance](Quality%20Assurance.md).
- Commit any fixes to `master` and cherry-pick to the `sdk-XX` branch.

## 2.2. Standalone App Quality Assurance

**Why:** There are often a few key differences between these two environments, and if they go undetected then users will end up finding out stuff is broken when they think their app is ready to release to the stores. This reduces trust in the whole Expo ecosystem, so it's really important we head this off by QA'ing everything we put out for people to use.

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance - iOS/Android clients](#21-versioned-quality-assurance---iosandroid-clients) |

**How:**

- Go through another guide about [Quality Assurance](Quality%20Assurance.md). Run `native-component-list` and `test-suite` in standalone apps and repeat the same tests as above.
- **Android**:
  - The process for building a standalone app locally is to publish the app you want to build and then run `et android-shell-app --url <url> --sdkVersion XX.X.X`.
- **iOS**:
  - The easiest way for now is to eject to ExpoKit and then build the resulting project. ExpoKit is not yet published (there is no new tag on GitHub) so use the current commit hash instead in `Podfile` under ExpoKit dependency.
    > This is not currently possible to test `standalone`/`ejected to ExpoKit` app in `expo` repository scope.
    > One way is to:
    >
    > - copy `apps/native-components-list`/`test-suite` app outside repository scope and perform `eject to ExpoKit`,
    > - use ExpoKit commit hash in Podfile,
    > - install each unimodule specified in `package.json` from specific commit hash.

## 2.3. Web Quality Assurance

**Why:** We really care about the quality of the code that we release for the users. Quality Assurance is the most important task during the release process, so please don't ignore any steps and also focus on things that have been changed/reworked/refactored in this cycle.

**How:**

Web is comparatively well-tested in CI, so a few manual smoke tests suffice for web QA.

- Make sure the `expo-cli` version in the `expo/expo` repo is up-to-date.
- `cd apps/native-component-list`
- Run `yarn web` and press `w` to open in the browser. Make sure the app loads successfully in development.
- Run `expo build:web`, `npx serve web-build` and then `open http://localhost:5000/`. Ensure the built version of the app loads successfully.
- Finally, test deploying the app by running `npx now web-build`.

## 2.4. Cherry-pick Versioned Code to `master`

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance - iOS/Android clients](#21-versioned-quality-assurance---iosandroid-clients) |
| [2.2. Standalone App Quality Assurance](#22-standalone-app-quality-assurance) |
| [2.3. Web Quality Assurance](#21-web-quality-assurance) |

**Why:** Most commits should flow in the `master` -> `sdk-XX` branch direction. Versioning is an exception to this because we explicitly want to version the set of code on the `sdk-XX` branch, but we want that versioned code on master for later releases.

**How:**

- Cherry-pick all versioning commits from `sdk-XX` to `master`.

## 2.5. Publish demo apps

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance - iOS/Android clients](#21-versioned-quality-assurance---iosandroid-clients) |
| [2.2. Standalone App Quality Assurance](#22-standalone-app-quality-assurance) |
| [2.3. Web Quality Assurance](#21-web-quality-assurance) |

**Why:** We need to publish `native-component-list` so other people can try it out (including app reviewers from Apple).

**How:**

- Go to `apps/native-component-list` and make sure its `sdkVersion` in `app.json` is set to the correct SDK (not `UNVERSIONED`).
- Run `expo publish` for both `community` and `applereview` accounts.
- Open `native-component-list` from `applereview` account and make sure it launches as expected.

# Stage 3 - Publish NPM packages

## 3.1. Publish any missing or changed packages

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance - iOS/Android clients](#21-versioned-quality-assurance---iosandroid-clients) |
| [2.2. Standalone App Quality Assurance](#22-standalone-app-quality-assurance) |
| [2.3. Web Quality Assurance](#21-web-quality-assurance) |

**Why:** Any changes that have been made to packages during QA / since the initial publish (step 0.7) still need to be published for bare workflow users (and managed, for TS changes).

**How:**

- From the master branch, run `et publish-packages` and publish all packages with changes.
- If there are any packages for which a patch was cherry-picked to the release branch AND a new feature (requiring a minor version bump) was added on master in the meantime, you will need to publish a patch release of that package from the release branch which does not include the new feature.
  - Note that **only** the patch version number can be bumped on the release branch; **do not** bump the minor version number of any package on the release branch.

## 3.2. Publishing `next` project templates

| Prerequisites                                                             |
| ------------------------------------------------------------------------- |
| [3.1. Publish any missing or changed packages](#31-publish-any-missing-or-changed-packages) |

**Why:** We also need to prepare project templates that are used when people run `expo init` command and publish them to NPM registry as RC versions so we can test them.

**How:**

- On master branch, run `et update-project-templates`/`et upt` that checks all `expo-template-*` packages under `templates` directory and bumps dependency versions wherever possible – based on versions stored in `packages/expo/bundledNativeModules.json` for Expo modules and 3rd-party libraries, `react-native` fork with appropriate SDK version and `expo` package itself.
- Test these project templates in Expo client or by building them (bare workflow) - you don't have to use `expo init` at this point, just `expo start` them locally.
- Run `et publish-templates`/`et ppt` and answer to questions it asks. **IMPORTANT:** These versions should be tagged as `next` and not `latest`. (If tagged as `latest` they will be used by default whenever anyone runs `expo init`.)
- If everything works as expected, commit changes to master and make sure to cherry-pick that commit to the release branch as well.

# Stage 4 - Expo client

## 4.1. Releasing beta version

| Prerequisites                                                             |
| ------------------------------------------------------------------------- |
| [3.1. Publish any missing or changed packages](#31-publish-any-missing-or-changed-packages) |

**Why:** As we already published prerelease versions of the packages, now we can publish prerelease version of the client.

**How:**

- **iOS**:

  - Bump Expo client versions (CFBundleVersion, CFBundleShortVersionString) in `ios/Exponent/Supporting/Info.plist`.
  - We use `fastlane match` to sync our iOS credentials (certificates and provisioning profiles) - you will need them to properly archive and upload the distribution build to App Store Connect. Run `fastlane match appstore` from the project root folder to download them. You'll need to be authorized and have Google Cloud keys to do this, if you don't have them ask someone who has been publishing the client in the past.
  - Make sure build's metadata are up to date (see files under `fastlane/metadata/en-US`).
  - Make sure that production home app is published and new JS bundles are up-to-date - they're gonna be bundled within the binary and used at the first app run (before the client downloads an OTA update).
  - Run `fastlane ios release` from the project root folder and follow the prompt. This step can take 30+ minutes, as fastlane will update (or create) the App Store Connect record, generate a signed archive, and upload it.
  - Wait for Apple to finish processing your new build. This step can take another 30+ minutes (but sometimes just a few).
  - Once the processing is done, go to TestFlight section in App Store Connect, click on the new build and then click `Provide Export Compliance Information` button and select **"No"** in the dialog - we generally have not made changes to encryption.
  - Publish that build to TestFlight and send invitations to other testers. You should also do some smoke tests, for example against `native-component-list` published under `applereview` account.

- **Android**:
  - Bump the `versionCode` and `versionName` in android/app/build.gradle. Commit this to master and cherry-pick to the release branch. You might need to check the previous release branch to make sure the new `versionCode` is greater than the previous patch version, in case that commit never made it to master.
  - The APK will be available as an artifact from the `client_android` CI job. If no CI jobs are running on the release branch, you just need to open a PR from the release branch to master. (Don't merge it; it only exists to make CI jobs run.)

## 4.2. Making a simulator build

| Prerequisites                                                     |
| ----------------------------------------------------------------- |
| [4.1. Releasing beta version](#41-releasing-beta-version) |

**Why:** To allow our users install Expo client on the simulator (which doesn't have an App Store) we need to make a build for it, upload it to S3 servers and save its url and version on the versions endpoint. These builds are then downloaded and installed by the users using `expo client:install:ios`.

**How:**

- Open CircleCI on the release branch and go to the `client` workflow. Once `client_ios` and `client_android` jobs are finished, approve `client_ios_simulator_release_approve` and `client_android_apk_release_approve` jobs and follow the next jobs (`client_ios_simulator_release` and `client_android_apk_release`) which take and upload the artifact archives to staging.
- Test if these simulator builds work as expected. You can install and launch them using expotools command `et client-install -p <platform>`.
- When you're ready to sync the versions change to production, run `et promote-versions`.

## 4.3. Submit iOS client to App Store Review

| Prerequisites                                             |
| --------------------------------------------------------- |
| [4.1. Releasing beta version](#41-releasing-beta-version) |

**Why:**

**How:**

- In [App Store Connect](https://appstoreconnect.apple.com), select the build you previously uploaded and released to TestFlight, glance through the metadata to verify that it's what you want, and save the changes if any.
- **Click Submit to send the new binary to Apple**. When prompted, give the following answers:
  - “Yes”, we use the IDFA, check the boxes in this Segment guide: [https://segment.com/docs/sources/mobile/ios/quickstart/](https://segment.com/docs/sources/mobile/ios/quickstart/).
  - “Serve advertisements within the app” should not be checked.

## 4.4. Release clients to external beta testers

| Prerequisites                                                             |
| ------------------------------------------------------------------------- |
| [3.2. Publishing next project templates](#32-publishing-next-project-templates) |
| [4.1. Releasing beta version](#41-releasing-beta-version)                 |

**Why:**

**How:**

- Coordinate with @cruzach and @byCedric on this. Most beta testers will use the simulator builds on staging, but we can also send TestFlight invitations if needed.

# Stage 5 - ExpoKit and standalone apps

## 5.1. Updating ExpoKit

| Prerequisites                                                             |
| ------------------------------------------------------------------------- |
| [3.1. Publish any missing or changed packages](#31-publish-any-missing-or-changed-packages) |

**Why:** Ejected apps use ExpoKit as a dependency containing the core of Expo and some modules that are not yet extracted to unimodules. Since this flow is still supported (we're going to deprecate it) we need to release its new version as well.

**How:**

- Run `et update-versions -k 'packagesToInstallWhenEjecting.react-native-unimodules' -v 'X.Y.Z'` where `X.Y.Z` is the version of `react-native-unimodules` that is going to be used in ejected and standalone apps using this new SDK version.
**iOS:**
  - From the release branch run `et ios-update-expokit`.
    - It creates a `ios/X.Y.Z` tag on GitHub where `X.Y.Z` is the iOS app version (`CFBundleShortVersionString` from `Info.plist`).
    - It automatically detects iOS app and SDK versions, but if you need, you can modify its defaults using `--appVersion` and `--sdkVersion` flags.
    - Please don't forget to make a GitHub release on this tag and add release notes there, so people will see what changed in this version (just copy corresponding entries from `CHANGELOG.md`).
**Android:**
  - Check out the release branch.
  - Run `et android-build-packages` and ensure that all the unimodule packages are up-to-date. Commit any changes.
  - Run `et android-update-expokit --sdkVersion XX.X.X --appVersion <android client version> --expokitVersion XX.X.X --expokitTag next`. This will publish a new version of the `expokit` package to NPM, upload the ExpoKit template files to S3, and set values on the staging versions endpoint.

## 5.2. Make shell app build

| Prerequisites                                 |
| --------------------------------------------- |
| [5.1. Updating ExpoKit](#51-updating-expokit) |

**Why:** Shell app is a simple app on which Expo's Turtle work on to generate a standalone app. On iOS, shell app is compiled before it is uploaded to Turtle, so the process of building a standalone app is reduced to the minimum. We need to prepare such app for the new SDK, compile it, then put it into a tarball and put its url to Turtle's shellTarballs configs.

**How:**

- Run `et update-versions -k 'packagesToInstallWhenEjecting.react-native' -v 'https://github.com/expo/react-native/archive/sdk-XX.X.X.tar.gz'` using the corresponding tag created in step 3.1.
- Once you have your pull request from the release branch to master open, go to `https://circleci.com/gh/expo/workflows/expo/tree/sdk-XX` (where `XX` is the SDK number) and then choose `sdk-XX/shell_app` workflow. There are two approval jobs in this workflow, `shell_app_ios_approve_build` for iOS and `shell_app_android_approve_build` for Android. Click on the one you'd like to build and approve it. Wait for the next job to finish.
- Open the last step called `Build and upload release tarball` and copy the url to the tarball that was uploaded to `exp-artifacts` S3 bucket.
- Now go to `expo/turtle` repo and put the copied link into `shellTarballs/<platform>/sdkXX` file, where `<platform>` is the shell app platform you're updating.
- Put appropriate change information in the `CHANGELOG.md` file, commit and then push changes.

## 5.3. Make adhoc client shell app for iOS

**Why:** The client shell app is the base app for the custom client workflow on iOS (also known as the Adhoc build workflow).

**How:**

- Follow the same workflow as above, but instead choose the `sdk-XX/client_shell_app` workflow and approve the build.
- Copy the URL to the `shellTarballs/ios/client` file in `expo/turtle` and update the CHANGELOG.

**How:**

## 5.4. Deploy Turtle with new shell tarballs

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [5.2. Make shell app build](#52-make-shell-app-build)               |
| [5.3. Make adhoc client shell app](#53-make-adhoc-client-shell-app) |

**Why:** Once we've made standalone and adhoc client shell apps, we're now ready to deploy Turtle to staging, test it and then roll out to production.

**How:**

- Follow the instructions in the [`turtle-deploy` README](https://github.com/expo/turtle-deploy/). (Note that it refers to CI jobs in the `turtle` repo, not its own repo.)
- Deploy both iOS and Android turtle to staging (not production!). Deployments generally take 15-75 minutes and ping #tmnt when finished.
- Run a quick smoke test for each platform once the deployments finish - ensure you can build an app and that it runs on the simulator/emulator.

# Stage 6 - Final release

| Prerequisites                                 |
| --------------------------------------------- |
| **All previous steps** and App Store approval |

Once everything above is completed and Apple has approved the iOS client, the final release is ready to go. Complete the following steps **in order**, ideally in fairly quick succession (not spread over multiple days).

**If today is Friday:** STOP! Wait until next week to finish the release :)

## 6.1. Release iOS/Android clients

**How:**

- **iOS**:
  - Log into [App Store Connect](https://appstoreconnect.apple.com) and release the approved version.
- **Android**:
  - Add a new file under `/fastlane/android/metadata/en-US/changelogs/[versionCode].txt` (it should usually read “Add support for Expo SDK XX”).
  - Open the `client` workflow on CircleCI and find the `client_android` job. When it completes, download the APK from Artifacts and do a smoke test -- install it on a fresh Android device, turn on airplane mode, and make sure Home loads.
  - Open the `client` workflow on CircleCI and approve the `client_android_approve_google_play` job. About 45 minutes later the update should be downloadable via Play Store.

## 6.2. Deploy Turtle/ExpoKit to production

**How:**

- Publish a new version of `turtle-cli` [following this guide](https://github.com/expo/turtle/blob/master/CONTRIBUTING.md#publishing-a-release).
- Follow the instructions in the [`turtle-deploy` README](https://github.com/expo/turtle-deploy/). (Note that it refers to CI jobs in the `turtle` repo, not its own repo.)
- Promote the `expokit` package published in step 5.1 to `latest` on NPM.

## 6.3. Deploy new docs

**Why:** Show the new docs now that the SDK is being released!

**How:**

- Update the `version` field docs/package.json to match the new SDK version and push to master.
- Ensure that the new SDK version is visible in the API reference and is marked as latest.

## 6.4. Add related packages to versions endpoint

**Why:** These package versions are used by `expo-cli` in the `eject` command to ensure that the proper versions of packages are installed in developers' projects.

**How:**

- For each of the following packages, run `et update-versions -k 'relatedPackages.<package-name>' -v '^X.Y.Z'`
  - `typescript`
  - `@types/react`
  - `@types/react-native`
  - `react-native-web`
  - `babel-preset-expo`
  - `@expo/webpack-config`
  - `react-native-unimodules`
- One way to get the right version numbers is to run `yarn why <package-name>` to see which version is used by apps in the expo/expo repo. Generally the version numbers should have a carat (`^`) except for `react-native-unimodules`, which should have a tilde (`~`).

## 6.5. Promote versions to production

| Prerequisites                                             |
| --------------------------------------------------------- |
| [6.1. Release iOS/Android clients](#61-release-iosandroid-clients) |
| [6.2. Deploy Turtle/ExpoKit to production](#62-deploy-turtleexpokit-to-production) |
| [6.3. Deploy new docs](#63-deploy-new-docs) |
| [6.4. Add related packages to versions endpoint](#64-add-related-packages-to-versions-endpoint) |

**Why:** It's time for everything that uses the production versions endpoint to know about this new SDK version!

**How:** 

- `et promote-versions-to-prod`
- Double check every change before pressing `y`!

## 6.6. Promote packages to `latest` on NPM registry

**Why:** Previously we've published packages and now, if everything works like a charm, we can promote those packages to `latest` on NPM.

**How:**

- Use the `et promote-packages` script (TODO: add more detailed instructions once this script lands)

## 6.7. Publishing final project templates

| Prerequisites                                                                                   |
| ----------------------------------------------------------------------------------------------- |
| [6.5. Promote versions to production](#65-promote-versions-to-production) |
| [6.6. Promote packages to latest on NPM registry](#66-promote-packages-to-latest-on-npm-registry) |

**Why:** Once the final packages are out, we can now make a final version of project templates as well.

Make sure the release notes are ready to go at this point -- after this change, people will start getting the new SDK version whenever they run `expo init`!

**How:**

- On master branch, run `et update-project-templates`/`et upt` that checks all `expo-template-*` packages under `templates` directory and bumps dependency versions wherever possible – based on versions stored in `packages/expo/bundledNativeModules.json` for Expo modules and 3rd-party libraries, `react-native` fork with appropriate SDK version and `expo` package itself.
- Run `et publish-templates`/`et ppt` and answer to questions it asks. Final versions should be tagged as `latest` on NPM.
- Test these project templates in Expo client or by building them (bare workflow) - use `expo init` at this point.
- If everything works as expected, commit changes to master and make sure to cherry-pick that commit to the release branch as well.

## 6.8. Press release

| Prerequisites                                             |
| --------------------------------------------------------- |
| [6.7. Publishing final project templates](#67-publishing-final-project-templates) |

This should be ready to publish immediately after the previous step is finished!

**Why:** We want to announce it on social media once the new SDK is out. We usually start from the blog post on Medium that describes the changes that come up since the previous release, how to upgrade from the previous SDK version, etc.

**How:**

- Publish release notes to Medium/dev.to. Coordinate with @esamelson on this.
- Tweet a link on the @expo account.

## 6.9. Follow-up

| Prerequisites                                             |
| --------------------------------------------------------- |
| [6.8. Press release](#68-press-release) |

**Why:** A few places in our infrastructure need to know about the release notes once they're published.

**How:**

- Add the release notes to the versions endpoint: `et update-versions --sdkVersion XX.X.X --key releaseNoteUrl --value <url>` and `et promote-versions-to-prod`
- Add the release notes URL to the `upgrading-expo-sdk-walkthrough` docs page, commit and push to master, and deploy docs again.
- Coordinate with @FiberJW / @jonsamp to make sure the release notes get added to the expo.io homepage.

# Stage 7 - Snack

## 7.1. Add SDK support to Snack

| Prerequisites                                             |
| --------------------------------------------------------- |
| [4.1. Releasing beta version](#41-releasing-beta-version) |
| [4.2. Making a simulator build](#42-making-a-simulator-build) |

**Why:** Once the new SDK is available publicly, we need to update Snack to support that SDK.

**How:** For now the only responsible person for this task is @tc - coordinate this with him.
