# Expo release workflow

- [Expo release workflow](#expo-release-workflow)
  - [1. Dropping old SDKs](#1-dropping-old-sdks)
  - [2. Update React Native](#2-update-react-native)
  - [3. Versioning code for the new SDK](#3-versioning-code-for-the-new-sdk)
  - [4. Quality Assurance](#4-quality-assurance)
  - [5. Tag React Native fork](#5-tag-react-native-fork)
  - [6. Publishing prerelease packages](#6-publishing-prerelease-packages)
  - [7. Publishing prerelease project templates](#7-publishing-prerelease-project-templates)
  - [8. Cutting off release branch](#8-cutting-off-release-branch)
  - [9. Releasing beta version](#9-releasing-beta-version)
  - [10. Making a simulator build](#10-making-a-simulator-build)
  - [11. Submitting to the stores](#11-submitting-to-the-stores)
  - [12. Update versions endpoint](#12-update-versions-endpoint)
  - [13. Updating ExpoKit](#13-updating-expokit)
  - [14. Make shell app build](#14-make-shell-app-build)
  - [15. Make adhoc client shell app](#15-make-adhoc-client-shell-app)
  - [16. Deploy Turtle with new shell tarballs](#16-deploy-turtle-with-new-shell-tarballs)
  - [17. Publishing final packages to NPM registry](#17-publishing-final-packages-to-npm-registry)
  - [18. Publishing final project templates](#18-publishing-final-project-templates)

# Stage 1 - Versioning

## 1. Dropping old SDKs

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

## 2. Update React Native

**Why:**

**How:**

## 3. Versioning code for the new SDK

| Requirements                                     |
| ------------------------------------------------ |
| [2. Update React Native](#2-update-react-native) |

**Why:** As we need to support multiple SDK versions, the code needs to be prefixed for each version so we don't get conflicts and duplicated classes. Such prefixed version of our APIs is called ABI.

**How:**

- **iOS**:
  - Run `et add-sdk --platform ios` to copy unversioned code into the new ABI and prefix (or suffix) its files and corresponding code references with `ABIXX_0_0`. If this script errors partway, you can always delete the new directory it created under `ios/versioned-react-native` and revert any other changes it made to `EXSDKVersions.plist` and `sdkVersions.json` (or just run `et remove-sdk --platform --sdkVersion XX.0.0`). Then it's safe to run this script again.
  - Let the `add-sdk` script to regenerate Podfile and reinstall pods, then try to build the project in Xcode. This script does most of the work, but usually breaks in various ways, partly because some assumptions change every SDK cycle. If you found anything broken, please keep versioning script up to date.
  - Submit a pull request with versioned code to `master` branch.
- **Android**:
  - *todo*

# Stage 2 - QA and prerelease

## 4. Quality Assurance

| Requirements                                                             |
| ------------------------------------------------------------------------ |
| [3. Versioning code for the new SDK](#3-versioning-code-for-the-new-sdk) |

**Why:** It's obvious 😜

**How:**

- Go through another guide about [Quality Assurance](Quality Assurance.md).
- Run `et publish-ncl` to publish `native-component-list` into `applereview` that Apple may use during review.

## 5. Tag React Native fork

| Requirements                                 |
| -------------------------------------------- |
| [4. Quality Assurance](#4-quality-assurance) |

**Why:** In managed Expo workflow, we use our forked `react-native` repo. The submodule under `react-native-lab/react-native` is the source of truth for `react-native` version used throughout the repository. We will use it in later steps.
    
**How:**

- Create a new branch for new SDK in our `react-native` fork (`sdk-XX` typically) and point the submodule to latest commit on that branch.
- Run `git tag -a 'sdk-XX.X.X' -m 'React Native X.Y.Z for Expo SDKXX'` where `X.Y.Z` is the React Native version, to make a tag for the latest commit in your local repo.
- Push the tag to the remote: `git push --tags`.
- Commit `react-native-lab/react-native` submodule change in the root repo.

## 6. Publishing prerelease packages

| Requirements                                 |
| -------------------------------------------- |
| [4. Quality Assurance](#4-quality-assurance) |

**Why:**

**How:**

- Run `et publish-packages --prerelease --tag next` to publish all packages as `rc` versions and as `next` tag.

## 7. Publishing prerelease project templates

| Requirements                                                           |
| ---------------------------------------------------------------------- |
| [5. Tag React Native fork](#5-tag-react-native-fork)                   |
| [6. Publishing prerelease packages](#6-publishing-prerelease-packages) |

**Why:** We also need to prepare project templates that are used when people run `expo init` command and publish them to NPM registry as RC versions so we can test them.

**How:**

- On a new branch, check all `expo-template-*` packages under `templates` directory and bump dependencies versions wherever possible. Use versions stored in `packages/expo/bundledNativeModules.json` for vendored libs like `react-native-gesture-handler`.
- Run `et publish-templates` and answer to questions it asks. Prerelease versions should be tagged as `next` and not `latest`.
- Create a pull request from your branch to `master`. Make sure a reviewer will cherry-pick that commit to the release branch as well.

# Stage 3 - Expo Client

## 8. Cutting off release branch

| Requirements                                                                             |
| ---------------------------------------------------------------------------------------- |
| [7. Publishing prerelease project templates](#7-publishing-prerelease-project-templates) |

**Why:** Sometimes we need to apply changes to some older SDKs (roll out them to the stores or Turtle builders, publish patches to NPM registry). That's why we need to keep the current repository state on a separate, release branch so changes made to `master` in the meantime won't interfere.

**How:** Once both iOS and Android versioning pull requests are merged, you can cut off `sdk-XX` branch from `master` and push it to the remote repo.

## 9. Releasing beta version

| Requirements                                                   |
| -------------------------------------------------------------- |
| [8. Cutting off release branch](#8-cutting-off-release-branch) |

**Why:**

**How:**

- **iOS**:
  - Bump Expo client versions (CFBundleVersion, CFBundleShortVersionString) in `ios/Exponent/Supporting/Info.plist`.
  - As of latest time of writing, Xcode's "automatic provisioning" isn't working well with fastlane, so you might want to switch to manual provisioning in your working copy of Exponent.xcodeproj.
  - Apple seems to invalidate our provisioning profiles whenever somebody new gets added or removed from the team. If you are using manual provisioning, it is sometimes helpful to log in, clear invalid profiles, and create/download a new one. If you do this, please name the profile something very specific, like 'Expo Client App Store August 20 2018'!
  - Make sure build's metadata are up to date (see files under `fastlane/metadata/en-US`).
  - Run `fastlane ios release` from the project root folder and follow the prompt. This step can take 30+ minutes, as fastlane will update (or create) the App Store Connect record, generate a signed archive, and upload it.
  - Wait for Apple to finish processing your new build. This step can take another 30+ minutes (but sometimes just a few).
  - Publish that build to TestFlight and send invitations to other testers. You should also do some smoke tests, for example against `native-component-list` published under `applereview` account.

## 10. Making a simulator build

| Requirements                                                   |
| -------------------------------------------------------------- |
| [8. Cutting off release branch](#8-cutting-off-release-branch) |

**Why:**

**How:**

- From the release branch, create a simulator Release build using `fastlane ios create_simulator_build`.
- Make sure there are no errors in fastlane command. Its design is pretty bad and it's possible you won't notice errors.
- Install, launch and test this new simulator build.
  ```
  xcrun simctl install booted /path/to/your/Exponent.app
  xcrun simctl launch booted host.exp.Exponent
  ```
- Set the `AWS_BUCKET` env variable to `exp-ios-simulator-apps`
- Upload the build by running:
  ```
  et ios-add-simulator-build --app [Path to .app] --appVersion [version]`
  ```
  - `[Path to .app]` refers to the `Exponent.app` archive you created in step 1.
  - `[version]` refers to the short iOS version string, such as `2.4.4`.
  - You might need to [set your AWS credentials](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/credentials.html), if you haven't done so yet.
- When you're ready to sync the versions change from step 2 to production, run `et promote-versions`.

## 11. Submitting to the stores

| Requirements                                           |
| ------------------------------------------------------ |
| [9. Releasing beta version](#9-releasing-beta-version) |

**Why:**

**How:**

- **iOS**:
  - In [App Store Connect](https://appstoreconnect.apple.com), select the build you previously uploaded and released to TestFlight, glance through the metadata to verify that it's what you want, and save the changes if any.
  - **Click Submit to send the new binary to Apple**. When prompted, give the following answers:
    - “No”, we generally have not made changes to encryption (export compliance).
    - “Yes”, we use the IDFA, check the boxes in this Segment guide: [https://segment.com/docs/sources/mobile/ios/quickstart/](https://segment.com/docs/sources/mobile/ios/quickstart/).
    - “Serve advertisements within the app” should not be checked.

# Stage 4 - ExpoKit and standalone apps

## 12. Update versions endpoint

**Why:** 

**How:**
- Run `et update-versions -k 'packagesToInstallWhenEjecting.react-native-unimodules' -v 'X.Y.Z'` where `X.Y.Z` is the version of `react-native-unimodules` that is going to be used in ejected and standalone apps using this new SDK version.
- Promote versions config from staging to production: `et promote-versions`.

## 13. Updating ExpoKit

| Requirements                                                 |
| ------------------------------------------------------------ |
| [12. Update versions endpoint](#12-update-versions-endpoint) |

**Why:** Ejected apps use ExpoKit as a dependency containing the core of Expo and some modules that are not yet extracted to unimodules. Since this flow is still supported (we're going to deprecate it) we need to release its new version as well.

**How:**

- From the release branch run `et ios-update-expokit`.
  - It creates a `ios/X.Y.Z` tag on GitHub where `X.Y.Z` is the iOS app version (`CFBundleShortVersionString` from `Info.plist`).
  - It automatically detects iOS app and SDK versions, but if you need, you can modify its defaults using `--appVersion` and `--sdkVersion` flags.
  - Please don't forget to make a GitHub release on this tag and add release notes there, so people will see what changed in this version (just copy corresponding entries from `CHANGELOG.md`).
- To sync the versions change from step 1. to production, run `et promote-versions`.

## 14. Make shell app build

| Requirements                                                 |
| ------------------------------------------------------------ |
| [12. Update versions endpoint](#12-update-versions-endpoint) |

**Why:** Shell app is a simple app on which Expo's Turtle work on to generate a standalone app. On iOS, shell app is compiled before it is uploaded to Turtle, so the process of building a standalone app is reduced to the minimum. We need to prepare such app for the new SDK, compile it, then put it into a tarball and put its url to Turtle's shellTarballs configs.

**How:**

- Once you have your pull request from the release branch to master open, go to `https://circleci.com/gh/expo/workflows/expo/tree/sdk-XX` (where `XX` is the SDK number) and then choose `sdk-XX/shell_app` workflow. There are two approval jobs in this workflow, `shell_app_ios_approve_build` for iOS and `shell_app_android_approve_build` for Android. Click on the one you'd like to build and approve it. Wait for the next job to finish.
- Open the last step called `Build and upload release tarball` and copy the url to the tarball that was uploaded to `exp-artifacts` S3 bucket.
- Now go to `expo/turtle` repo and put the copied link into `shellTarballs/<platform>/sdkXX` file, where `<platform>` is the shell app platform you're updating.
- Release Turtle to staging by updating its submodule in `expo/universe` repo. CI is releasing it automatically on `master` branch.
- When the new shellTarball is successfully deployed to staging, try to build a standalone app by running `EXPO_STAGING=1 expo build:<platform>`.
- If everything seems to be fine, deploy Turtle to production by approving `turtle_<platform>_approve_production` job in `turtle_<platform>` workflow.

## 15. Make adhoc client shell app

**Why:**

**How:**

## 16. Deploy Turtle with new shell tarballs

| Requirements                                                       |
| ------------------------------------------------------------------ |
| [14. Make shell app build](#14-make-shell-app-build)               |
| [15. Make adhoc client shell app](#15-make-adhoc-client-shell-app) |

**Why:**

**How:**

# Stage 5 - Final touches

## 17. Publishing final packages to NPM registry

**Why:** Previously we've published prereleased versions of packages and now, if everything works like a charm, we can publish final (stable) versions of those packages.

**How:**

- On the release branch, use an expotool that will do all of the needed work - `et publish-packages`. You already used it to publish prereleased packages. Now we can publish them as stable releases and tag them as `latest` which is the default behavior of that script.

## 18. Publishing final project templates

| Requirements                                                                                   |
| ---------------------------------------------------------------------------------------------- |
| [17. Publishing final packages to NPM registry](#17-publishing-final-packages-to-npm-registry) |

**Why:** Once the final packages are out, we can now make a final version of project templates as well.

**How:**

- On a new branch, check all `expo-template-*` packages under `templates` directory and bump dependencies versions wherever possible. Use versions stored in `packages/expo/bundledNativeModules.json` for vendored libs like `react-native-gesture-handler`.
- Run `et publish-templates` and answer to questions it asks.
- Create a pull request from your branch to `master`. Make sure a reviewer will cherry-pick that commit to the release branch as well.
