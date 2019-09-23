# Expo release process for iOS

- [Expo release process for iOS](#expo-release-process-for-ios)
  - [1. Dropping old SDKs](#1-dropping-old-sdks)
  - [2. Versioning code for the new SDK](#2-versioning-code-for-the-new-sdk)
  - [3. Cutting off release branch](#3-cutting-off-release-branch)
  - [4. Publishing prerelease packages](#4-publishing-prerelease-packages)
  - [5. Publishing prerelease project templates](#5-publishing-prerelease-project-templates)
  - [6. Quality Assurance](#6-quality-assurance)
  - [7. Releasing to TestFlight](#7-releasing-to-testflight)
  - [8. Making a simulator build](#8-making-a-simulator-build)
  - [9. Submitting to App Store](#9-submitting-to-app-store)
  - [10. Updating ExpoKit](#10-updating-expokit)
  - [11. Upgrading shell app on Turtle](#11-upgrading-shell-app-on-turtle)
  - [12. Publishing final packages to NPM registry](#12-publishing-final-packages-to-npm-registry)

## 1. Dropping old SDKs

**Why:** We tend to support old SDK versions up to 6 months since they were released. Once we release a new one, it's a good opportunity to drop some old ones that are already older than 6 months.

**How:**

- Run `et remove-sdk --platform ios` to remove the oldest SDK version from iOS codebase and regenerate Pods. Repeat that script if you want to delete more versions.
- Make sure Expo client builds in Xcode as expected.
- Commit changes and create a pull request to `master` branch.

## 2. Versioning code for the new SDK

**Why:** As we need to support multiple SDK versions, the code needs to be prefixed for each version so we don't get conflicts and duplicated classes. Such prefixed version of our APIs is called ABI.

**How:**

- Run `et add-sdk --platform ios` to copy unversioned code into the new ABI and prefix (or suffix) its files and corresponding code references with `ABIXX_0_0`. If this script errors partway, you can always delete the new directory it created under `ios/versioned-react-native` and revert any other changes it made to `EXSDKVersions.plist` and `sdkVersions.json` (or just run `et remove-sdk --platform --sdkVersion XX.0.0`). Then it's safe to run this script again.
- Let the `add-sdk` script to regenerate Podfile and reinstall pods, then try to build the project in Xcode. This script does most of the work, but usually breaks in various ways, partly because some assumptions change every SDK cycle. If you found anything broken, please keep versioning script up to date.
- Submit a pull request with versioned code to `master` branch.

## 3. Cutting off release branch

**Why:** Sometimes we need to apply changes to some older SDKs (roll out them to the stores or Turtle builders, publish patches to NPM registry). That's why we need to keep the current repository state on a separate, release branch so changes made to `master` in the meantime won't interfere.

**How:** Once both iOS and Android versioning pull requests are merged, you can cut off `sdk-XX` branch from `master` and push it to the remote repo.

## 4. Publishing prerelease packages

**Why:**

**How:**

- Run `et publish-packages --prerelease --tag next` to publish all packages as `rc` versions and as `next` tag.

## 5. Publishing prerelease project templates

**Why:**

**How:**

## 6. Quality Assurance

**Why:** It's obvious 😜

**How:** Go through another guide about [Quality Assurance](Quality Assurance.md).

## 7. Releasing to TestFlight

**Why:**

**How:**

- Bump Expo client versions (CFBundleVersion, CFBundleShortVersionString) in `ios/Exponent/Supporting/Info.plist`.
- If it's the first time you're making the iOS release build on this computer, you'll need to download our distribution certificates and provisioning profiles. We use Fastlane Match and Google Cloud Storage for this.
  - Firstly, you need to authenticate yourself on Google Cloud. Run `gcloud auth application-default login` and log in to Google Cloud Console in your browser.
  - Now your computer should be able to download distribution credentials from Google Cloud Storage - to do this, run `fastlane match` in the repo's root directory and enter your Apple Developer account credentials when it prompts for them.
- Make sure build's metadata are up to date (see files under `fastlane/metadata/en-US`).
- Run `fastlane ios release` from the project root folder and follow the prompt. This step can take 30+ minutes, as fastlane will update (or create) the App Store Connect record, generate a signed archive, and upload it.
- Wait for Apple to finish processing your new build. This step can take another 30+ minutes (but sometimes just a few).
- Publish that build to TestFlight and send invitations to other testers. You should also do some smoke tests, for example against `native-component-list` published under `applereview` account.

## 8. Making a simulator build

**Why:** To allow our users install Expo client on the simulator (which doesn't have an App Store) we need to make a build for it, upload it to S3 servers and save its url and version on the versions endpoint. These builds are then downloaded and installed by the users using `expo client:install:ios`.

**How:**

- Open CircleCI on the release branch and go to the `client` workflow. Once `client_ios` job is finished, approve `client_ios_simulator_release_approve` job and follow the next job `client_ios_simulator_release` which takes and uploads the artifact archive from `client_ios` job to staging.
- Test if this simulator build works as expected. You can install and launch it using expotools command `et client-install -p ios`.
- When you're ready to sync the versions change to production, run `et promote-versions`.

## 9. Submitting to App Store

**Why:**

**How:**

- In [App Store Connect](https://appstoreconnect.apple.com), select the build you previously uploaded and released to TestFlight, glance through the metadata to verify that it's what you want, and save the changes if any.
- **Click Submit to send the new binary to Apple**. When prompted, give the following answers:
  - “No”, we generally have not made changes to encryption (export compliance).
  - “Yes”, we use the IDFA, check the boxes in this Segment guide: [https://segment.com/docs/sources/mobile/ios/quickstart/](https://segment.com/docs/sources/mobile/ios/quickstart/).
  - “Serve advertisements within the app” should not be checked.

## 10. Updating ExpoKit

**Why:** Ejected apps use ExpoKit as a dependency containing the core of Expo and some modules that are not yet extracted to unimodules. Since this flow is still supported (we're going to deprecate it) we need to release its new version as well.

**How:**

- From the release branch run `et ios-update-expokit`.
  - It creates a `ios/X.Y.Z` tag on GitHub where `X.Y.Z` is the iOS app version (`CFBundleShortVersionString` from `Info.plist`).
  - It automatically detects iOS app and SDK versions, but if you need, you can modify its defaults using `--appVersion` and `--sdkVersion` flags.
  - Please don't forget to make a GitHub release on this tag and add release notes there, so people will see what changed in this version (just copy corresponding entries from `CHANGELOG.md`).
- To sync the versions change from step 1. to production, run `et promote-versions`.

## 11. Upgrading shell app on Turtle

**Why:** Shell app is a simple app on which Expo's Turtle work on to generate a standalone app. On iOS, shell app is compiled before it is uploaded to Turtle, so the process of building a standalone app is reduced to the minimum. We need to prepare such app for the new SDK, compile it, then put it into a tarball and put its url to Turtle's shellTarballs configs.

**How:**

- Once you have your pull request from the release branch to master open, go to `https://circleci.com/gh/expo/workflows/expo/tree/sdk-XX` (where `XX` is the SDK number) and then choose `sdk-XX/shell_app` workflow. There are two approval jobs in this workflow, `shell_app_ios_approve_build` for iOS and `shell_app_android_approve_build` for Android. Click on the one you'd like to build and approve it. Wait for the next job to finish.
- Open the last step called `Build and upload release tarball` and copy the url to the tarball that was uploaded to `exp-artifacts` S3 bucket.
- Now go to `expo/turtle` repo and put the copied link into `shellTarballs/<platform>/sdkXX` file, where `<platform>` is the shell app platform you're updating.
- Release Turtle to staging by updating its submodule in `expo/universe` repo. CI is releasing it automatically on `master` branch.
- When the new shellTarball is successfully deployed to staging, try to build a standalone app by running `EXPO_STAGING=1 expo build:<platform>`.
- If everything seems to be fine, deploy Turtle to production by approving `turtle_<platform>_approve_production` job in `turtle_<platform>` workflow.

## 12. Publishing final packages to NPM registry

**Why:** Previously we've published prereleased versions of packages and now, if everything works like a charm, we can publish final (stable) versions of those packages.

**How:**

- On the release branch, use an expotool that will do all of the needed work - `et publish-packages`. You already used it to publish prereleased packages. Now we can publish them as stable releases and tag them as `latest` which is the default behavior of that script.
