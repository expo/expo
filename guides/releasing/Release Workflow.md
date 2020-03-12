# Expo release workflow

- [Expo release workflow](#expo-release-workflow)
  - [Stage 1 - Versioning](#stage-1---versioning)
    - [1.1. Dropping old SDKs](#11-dropping-old-sdks)
    - [1.2. Update React Native](#12-update-react-native)
    - [1.3. Unversioned Quality Assurance](#13-unversioned-quality-assurance)
    - [1.4. Versioning code for the new SDK](#14-versioning-code-for-the-new-sdk)
  - [Stage 2 - Quality Assurance](#stage-2---quality-assurance)
    - [2.1. Quality Assurance](#21-versioned-quality-assurance)
    - [2.2. Publish demo apps](#22-publish-demo-apps)
  - [Stage 3 - Prerelease](#stage-3---prerelease)
    - [3.1. Tag React Native fork](#31-tag-react-native-fork)
    - [3.2. Generate new mocks](#32-generate-new-mocks)
    - [3.3. Publishing prerelease packages](#33-publishing-prerelease-packages)
    - [3.4. Publishing prerelease project templates](#34-publishing-prerelease-project-templates)
  - [Stage 4 - Expo client](#stage-4---expo-client)
    - [4.1. Cutting off release branch](#41-cutting-off-release-branch)
    - [4.2. Releasing beta version](#42-releasing-beta-version)
    - [4.3. Making a simulator build](#43-making-a-simulator-build)
    - [4.4. Submitting to the stores](#44-submitting-to-the-stores)
  - [Stage 5 - ExpoKit and standalone apps](#stage-5---expokit-and-standalone-apps)
    - [5.1. Updating ExpoKit](#51-updating-expokit)
    - [5.2. Make shell app build](#52-make-shell-app-build)
    - [5.3. Make adhoc client shell app](#53-make-adhoc-client-shell-app)
    - [5.4. Deploy Turtle with new shell tarballs](#54-deploy-turtle-with-new-shell-tarballs)
  - [Stage 6 - Final release](#stage-6---final-release)
    - [6.1. Publishing final packages to NPM registry](#61-publishing-final-packages-to-npm-registry)
    - [6.2. Publishing final project templates](#62-publishing-final-project-templates)
    - [6.3. Generate and deploy new docs](#63-generate-and-deploy-new-docs)
  - [Stage 7 - Snack](#stage-7---snack)
    - [7.1. Add SDK support to Snack](#71-add-sdk-support-to-snack)
  - [Stage 8 - Press release](#stage-8---press-release)
    - [8.1. Publish a blog post](#81-publish-a-blog-post)
    - [8.2. Post on Twitter](#82-post-on-twitter)

# Stage 1 - Versioning

## 1.1. Dropping old SDKs

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

## 1.2. Update React Native

**Why:** Each SDK version has its own version of React Native. If we're planning to update React Native version for the upcoming SDK then we need to update our fork of React Native and update `react-native-lab/react-native` submodule in this repo which is the source of truth for `react-native` version used throughout the repository.

**How:**

- Go to `react-native-lab/react-native` submodule.
- Coordinate with James (@ide) to create a new branch for new SDK in our `react-native` fork (`sdk-XX` typically, where `XX` is the major number of the SDK version).
- Run `et update-react-native`. This expotools command copies `ReactAndroid` and `ReactCommon` folders from the submodule to the respective paths: `android/ReactAndroid` and `android/ReactCommon` and then executes `ReactAndroidCodeTransformer` that applies some Expo-specific code transformations.
- Add your git changes from both `react-native-lab` and `android` folders and create a pull request to `master` branch.

## 1.3. Unversioned Quality Assurance

| Prerequisites                                       |
| --------------------------------------------------- |
| [1.2. Update React Native](#12-update-react-native) |

**Why:** This step is especially important on Android because we build ReactAndroid into an aar in the versioning step, so if there are any issues that are discovered after versioning you have to redo the whole versioning step (which takes quite a while 😞).

**How:**

- Go through another guide about [Quality Assurance](./Quality%20Assurance.md). Use `UNVERSIONED` as a `sdkVersion`.
- Fix everything you noticed in quality assurance steps or delegate these issues to other people in a team (preferably unimodule owners). Fixes for all discovered bugs should land on `master` before versioning.

## 1.4. Versioning code for the new SDK

| Prerequisites                                                           |
| ----------------------------------------------------------------------- |
| [1.3. Unversioned Quality Assurance](#13-unversioned-quality-assurance) |

**Why:** As we need to support multiple SDK versions, the code needs to be prefixed for each version so we don't get conflicts and duplicated classes. Such prefixed version of our APIs is called ABI.

**How:**

- Checkout on `master` branch and pull changes from the remote.
- Make sure that everything that is ready and we planned to land in this cycle is already merged and **tested**.
- **iOS**:
  - Run `et add-sdk --platform ios` to copy unversioned code into the new ABI and prefix (or suffix) its files and corresponding code references with `ABIXX_0_0`. If this script errors partway, you can always delete the new directory it created under `ios/versioned-react-native` and revert any other changes it made to `EXSDKVersions.plist` and `sdkVersions.json` (or just run `et remove-sdk --platform --sdkVersion XX.0.0`). Then it's safe to run this script again.
  - Let the `add-sdk` script to regenerate Podfile and reinstall pods, then try to build the project in Xcode. This script does most of the work, but usually breaks in various ways, partly because some assumptions change every SDK cycle. If you found anything broken, please keep versioning script up to date.
- **Android**:
  - Run `et add-sdk --platform android` to create the new versioned AAR and expoview code. This script will attempt to rename some native libraries and will ask you to manually verify that it has renamed them all properly. If you notice some that are missing, add them to the list in `tools/expotools/src/versioning/android/libraries.ts` and rerun the script. Commit the changes.
  - Run `et android-build-packages` to build the packaged AARs for each unimodule for the new SDK version. If any of the builds fail, follow the directions from the script to fix the build and then rerun the build command for only the failed packages.
- Commit the changes to your branch and submit a pull request with versioned code to `master` branch. Take a look at the GitHub stats of added/deleted lines in your PR and be proud of your most productive day this month 😎.

# Stage 2 - Quality Assurance

## 2.1. Versioned Quality Assurance

| Prerequisites                                                               |
| --------------------------------------------------------------------------- |
| [1.4. Versioning code for the new SDK](#14-versioning-code-for-the-new-sdk) |

**Why:** We really care about the quality of the code that we release for the users. Quality Assurance is the most important task during the release process, so please don't ignore any steps and also focus on things that have been changed/reworked/refactored in this cycle.

**How:**

- Go through another guide about [Quality Assurance](Quality%20Assurance.md.md).
- Remember that you **must** go through the QA process for both the Expo client and a standalone app! (e.g. build `native-component-list` and `test-suite` as standalone apps). There are often a few key differences between these two environments, and if they go undetected then users will end up finding out stuff is broken when they think their app is ready to release to the stores. This reduces trust in the whole Expo ecosystem, so it's really important we head this off by QA'ing everything we put out for people to use.
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

## 2.2. Publish demo apps

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance](#21-versioned-quality-assurance) |

**Why:** We need to publish `native-component-list` so other people can try it out (including app reviewers from Apple).

**How:**

- Go to `apps/native-component-list` and make sure its `sdkVersion` in `app.json` is set to the correct SDK (not `UNVERSIONED`).
- Run `expo publish` for both `community` and `applereview` accounts.
- Open `native-component-list` from `applereview` account and make sure it launches as expected.

# Stage 3 - Prerelease

## 3.1. Tag React Native fork

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance](#21-versioned-quality-assurance) |

**Why:** In managed Expo workflow, we use our forked `react-native` repo. The submodule under `react-native-lab/react-native` is the source of truth for `react-native` version used throughout the repository. We will use it in later steps.

**How:**

- Go to `react-native-lab/react-native` submodule.
- Make sure you're on the branch dedicated for this SDK release and that your local version of it is up to date by running `git checkout sdk-XX` and then `git pull`.
- Run `git tag -a 'sdk-XX.X.X' -m 'React Native X.Y.Z for Expo SDKXX'` (where `X.Y.Z` is the React Native version and `XX` is the major number of SDK version), to make a tag for the latest commit in your local repo.
- Push the tag to the remote using `git push --tags`.

## 3.2. Generate new mocks

**Why:** We provide some mocks of our native methods which are generated by traversing all the modules and its methods and making a configuration of all those methods with the number of arguments etc.

**How:**

- Please follow another guide: [Generating Jest Mocks](Generating%20Jest%20Mocks.md).

## 3.3. Publishing prerelease packages

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [2.1. Versioned Quality Assurance](#21-versioned-quality-assurance) |

**Why:** We need to publish prerelease versions of the packages so that we're able to prepare and test new project templates and people using bare workflow can use and test these packages before the final release.

**How:**

- Run `et publish-packages --prerelease --tag next` to publish all packages as `rc` versions and as `next` tag.

## 3.4. Publishing prerelease project templates

| Prerequisites                                                             |
| ------------------------------------------------------------------------- |
| [3.1. Tag React Native fork](#31-tag-react-native-fork)                   |
| [3.2. Generate new mocks](#32-generate-new-mocks)                         |
| [3.3. Publishing prerelease packages](#33-publishing-prerelease-packages) |

**Why:** We also need to prepare project templates that are used when people run `expo init` command and publish them to NPM registry as RC versions so we can test them.

**How:**

- On master branch, run `et update-project-templates`/`et upt` that checks all `expo-template-*` packages under `templates` directory and bumps dependency versions wherever possible – based on versions stored in `packages/expo/bundledNativeModules.json` for Expo modules and 3rd-party libraries, `react-native` fork with appropriate SDK version and `expo` package itself.
- Test these project templates in Expo client or by building them (bare workflow) - you don't have to use `expo init` at this point, just `expo start` them locally.
- Run `et publish-templates`/`et ppt` and answer to questions it asks. Prerelease versions should be tagged as `next` and not `latest`.
- If everything works as expected, commit changes to master and make sure to cherry-pick that commit to the release branch as well.

# Stage 4 - Expo client

## 4.1. Cutting off release branch

| Prerequisites                                                                               |
| ------------------------------------------------------------------------------------------- |
| [3.4. Publishing prerelease project templates](#34-publishing-prerelease-project-templates) |

**Why:** Sometimes we need to apply changes to some older SDKs (roll out them to the stores or Turtle builders, publish patches to NPM registry). That's why we need to keep the current repository state on a separate, release branch so changes made to `master` in the meantime won't interfere.

**How:** Once both iOS and Android versioning pull requests are merged, you can cut off `sdk-XX` branch from `master` and push it to the remote repo.

## 4.2. Releasing beta version

| Prerequisites                                                     |
| ----------------------------------------------------------------- |
| [4.1. Cutting off release branch](#41-cutting-off-release-branch) |

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
  - Wait for iOS to be approved!
  - Bump the `versionCode` and `versionName` in android/app/build.gradle. Commit this to master and cherry-pick to the release branch. You might need to check the previous release branch to make sure the new `versionCode` is greater than the previous patch version, in case that commit never made it to master.
  - Add a changelog for the new version in `fastlane/android/metadata/en-US/changelogs`. Commit to master and cherry-pick to the release branch.
  - Find the `client_android` CI job on the release branch. When it completes, download the APK from Artifacts and do a smoke test -- install it on a fresh Android device, turn on airplane mode, and make sure Home loads.
  - On the release branch, approve the `client_android_apk_release` build job.
  - When ready to release to production, approve the `client_android_release_google_play` build job. Note that _this will release the new client in the Play Store_ so only do this when everything else is ready!

## 4.3. Making a simulator build

| Prerequisites                                                     |
| ----------------------------------------------------------------- |
| [4.1. Cutting off release branch](#41-cutting-off-release-branch) |

**Why:** To allow our users install Expo client on the simulator (which doesn't have an App Store) we need to make a build for it, upload it to S3 servers and save its url and version on the versions endpoint. These builds are then downloaded and installed by the users using `expo client:install:ios`.

**How:**

- Open CircleCI on the release branch and go to the `client` workflow. Once `client_ios` and `client_android` jobs are finished, approve `client_ios_simulator_release_approve` and `client_android_apk_release_approve` jobs and follow the next jobs (`client_ios_simulator_release` and `client_android_apk_release`) which take and upload the artifact archives to staging.
- Test if these simulator builds work as expected. You can install and launch them using expotools command `et client-install -p <platform>`.
- When you're ready to sync the versions change to production, run `et promote-versions`.

## 4.4. Submitting to the stores

| Prerequisites                                             |
| --------------------------------------------------------- |
| [4.2. Releasing beta version](#42-releasing-beta-version) |

**Why:**

**How:**

- **iOS**:
  - In [App Store Connect](https://appstoreconnect.apple.com), select the build you previously uploaded and released to TestFlight, glance through the metadata to verify that it's what you want, and save the changes if any.
  - **Click Submit to send the new binary to Apple**. When prompted, give the following answers:
    - “Yes”, we use the IDFA, check the boxes in this Segment guide: [https://segment.com/docs/sources/mobile/ios/quickstart/](https://segment.com/docs/sources/mobile/ios/quickstart/).
    - “Serve advertisements within the app” should not be checked.
- **Android**:
  - Edit `/android/app/build.gradle` and bump versions in that file.
  - Add a new file under `/fastlane/android/metadata/en-US/changelogs/[versionCode].txt` (most probably it can read “Add support for SDK XX”).
  - Open the `client` workflow on CircleCI and approve the `client_android_approve_google_play` job. About 45 minutes later the update should be downloadable via Play Store.

# Stage 5 - ExpoKit and standalone apps

## 5.1. Updating ExpoKit

| Prerequisites                                                             |
| ------------------------------------------------------------------------- |
| [3.3. Publishing prerelease packages](#33-publishing-prerelease-packages) |
| [4.2. Releasing beta version](#42-releasing-beta-version)                 |

**Why:** Ejected apps use ExpoKit as a dependency containing the core of Expo and some modules that are not yet extracted to unimodules. Since this flow is still supported (we're going to deprecate it) we need to release its new version as well.

**How:**

- From the release branch run `et ios-update-expokit`.
  - It creates a `ios/X.Y.Z` tag on GitHub where `X.Y.Z` is the iOS app version (`CFBundleShortVersionString` from `Info.plist`).
  - It automatically detects iOS app and SDK versions, but if you need, you can modify its defaults using `--appVersion` and `--sdkVersion` flags.
  - Please don't forget to make a GitHub release on this tag and add release notes there, so people will see what changed in this version (just copy corresponding entries from `CHANGELOG.md`).
- Run `et update-versions -k 'packagesToInstallWhenEjecting.react-native-unimodules' -v 'X.Y.Z'` where `X.Y.Z` is the version of `react-native-unimodules` that is going to be used in ejected and standalone apps using this new SDK version.
- Promote versions config from staging to production: `et promote-versions`.

## 5.2. Make shell app build

| Prerequisites                                 |
| --------------------------------------------- |
| [5.1. Updating ExpoKit](#51-updating-expokit) |

**Why:** Shell app is a simple app on which Expo's Turtle work on to generate a standalone app. On iOS, shell app is compiled before it is uploaded to Turtle, so the process of building a standalone app is reduced to the minimum. We need to prepare such app for the new SDK, compile it, then put it into a tarball and put its url to Turtle's shellTarballs configs.

**How:**

- Once you have your pull request from the release branch to master open, go to `https://circleci.com/gh/expo/workflows/expo/tree/sdk-XX` (where `XX` is the SDK number) and then choose `sdk-XX/shell_app` workflow. There are two approval jobs in this workflow, `shell_app_ios_approve_build` for iOS and `shell_app_android_approve_build` for Android. Click on the one you'd like to build and approve it. Wait for the next job to finish.
- Open the last step called `Build and upload release tarball` and copy the url to the tarball that was uploaded to `exp-artifacts` S3 bucket.
- Now go to `expo/turtle` repo and put the copied link into `shellTarballs/<platform>/sdkXX` file, where `<platform>` is the shell app platform you're updating.
- Put appropriate change information in the `CHANGELOG.md` file, commit and then push changes.

## 5.3. Make adhoc client shell app

**Why:**

**How:**

## 5.4. Deploy Turtle with new shell tarballs

| Prerequisites                                                       |
| ------------------------------------------------------------------- |
| [5.2. Make shell app build](#52-make-shell-app-build)               |
| [5.3. Make adhoc client shell app](#53-make-adhoc-client-shell-app) |

**Why:** Once we've made standalone and adhoc client shell apps, we're now ready to deploy Turtle to staging, test it and then roll out to production.

**How:**

- Release Turtle to staging by updating its submodule in `expo/universe` repo. CI is releasing it automatically on `master` branch.
- When the new shellTarball is successfully deployed to staging, try to build a standalone app by running `EXPO_STAGING=1 expo build:<platform>`.
- If everything seems to be fine, deploy Turtle to production by approving `turtle_<platform>_approve_production` job in `turtle_<platform>` workflow.

# Stage 6 - Final release

## 6.1. Publishing final packages to NPM registry

**Why:** Previously we've published prereleased versions of packages and now, if everything works like a charm, we can publish final (stable) versions of those packages.

**How:**

- On the release branch, use an expotool that will do all of the needed work - `et publish-packages`. You already used it to publish prereleased packages. Now we can publish them as stable releases and tag them as `latest` which is the default behavior of that script.

## 6.2. Publishing final project templates

| Prerequisites                                                                                   |
| ----------------------------------------------------------------------------------------------- |
| [6.1. Publishing final packages to NPM registry](#61-publishing-final-packages-to-npm-registry) |

**Why:** Once the final packages are out, we can now make a final version of project templates as well.

**How:**

- On master branch, run `et update-project-templates`/`et upt` that checks all `expo-template-*` packages under `templates` directory and bumps dependency versions wherever possible – based on versions stored in `packages/expo/bundledNativeModules.json` for Expo modules and 3rd-party libraries, `react-native` fork with appropriate SDK version and `expo` package itself.
- Run `et publish-templates`/`et ppt` and answer to questions it asks. Final versions should be tagged as `latest` on NPM.
- Test these project templates in Expo client or by building them (bare workflow) - use `expo init` at this point.
- If everything works as expected, commit changes to master and make sure to cherry-pick that commit to the release branch as well.

## 6.3. Generate and deploy new docs

**Why:** We store separate versions of docs for each SDK version. That being said, we also have to generate versioned docs.

**How:**

- Make sure you have the release branch checked out and have cherry-picked all appropriate docs changes from master that landed after the release branch was cut.
- Run `et generate-sdk-docs --sdk XX.X.X` to generate versioned docs for the new SDK. If we've upgraded React Native version in this release, we should also use `--update-react-native-docs` flag which imports the current version of React Native docs that also show up on our docs page.
- Commit and push changes to release branch.
- Cherry pick this commit to `master` and push.
- Open this commit on our CI. Go to the `docs` workflow and approve `docs_approve_deploy` job that starts `docs_deploy` job - keep an eye on it and make sure it gets deployed successfully.

# Stage 7 - Snack

## 7.1. Add SDK support to Snack

**Why:** Once the new SDK is available publicly, we need to update Snack to support that SDK.

**How:** For now the only responsible person for this task is @tc - coordinate this with him.

# Stage 8 - Press release

## 8.1. Publish a blog post

**Why:** We want to announce it on social media once the new SDK is out. We usually start from the blog post on Medium that describes the changes that come up since the previous release, how to upgrade from the previous SDK version, etc.

**How:** For now the only responsible person for this task is @esamelson - coordinate this with him.

## 8.2. Post on Twitter

| Prerequisites                                       |
| --------------------------------------------------- |
| [8.1. Publish a blog post](#81-publish-a-blog-post) |

**How:** Once the blog post is ready and published, just share it on Twitter onto our @expo account.
