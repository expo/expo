---
title: Running builds on your own infrastructure
---

You can run builds on your local machine or on CI with flag `--local` that will execute the same build process on your infrastructure as our workers

`eas build --platform android --local` or `eas build --platform ios --local`


## Prerequisites

- You need to be authenticated (either via regular login or `EXPO_TOKEN`).
- NPM package `eas-cli-local-build-plugin` needs to be installed and in your `PATH`

## Use cases for local builds

- Privacy concerns or policy of your company on the use of third-party build services. With local builds entire process is happening on your infrastructure and only communication with EAS servers is:
  - to make sure project `@account/slug` exists
  - if you are using managed credentials to download them.
- You don't want to pay for EAS. <!-- and free tier is not enough for you. -->
- Debugging (more info in [the next section](#using-local-builds-for-debugging))

## Using local builds for debugging

If builds are failing for you on EAS servers it might be easier to debug them locally. To simplify that process we support few environment variables to configure the local build process.

- `EAS_LOCAL_BUILD_SKIP_CLEANUP=1` - working directory won't be removed after the build process is finished
- `EAS_LOCAL_BUILD_WORKINGDIR` - specify workingdirectory for the build process, by default it's somewhere (it's platform dependent) in `/tmp` folder.
- `EAS_LOCAL_BUILD_ARTIFACTS_DIR` - directory where artifacts are copied after a successful build, by default those files are copied to the current directory which might be problematic if you run a lot of consecutive builds.

## Limitations

Some of the options available for cloud builds are not available for the local ones. Limitations you should be aware of:

- You can only build for a specific platform (option `'all'` is disabled).
- Customizing versions of software is not supported, fields `node`, `yarn`, `fastlane`, `cocoapods`, `ndk`, `image` in `eas.json` are ignored.
- Caching is not supported.
- EAS Secrets are not supported
- You are responsible for making sure that the environment have all necessary tools installed
    - Node.js/yarn/npm
    - fastlane (iOS only)
    - CocoaPods (iOS only)
    - Android SDK and NDK
