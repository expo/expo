---
title: Running builds on your own infrastructure
---

You can run the same build process that we run on the EAS Build servers directly on your machine with the `--local` flag.

`eas build --platform android --local` or `eas build --platform ios --local`

## Prerequisites

You need to be authenticated with Expo:

- Run `eas login`,
- or set `EXPO_TOKEN` ([learn more about token-based authentication](/accounts/programmatic-access.md)).

## Use cases for local builds

- Company policies that restrict the use of third-party CI/CD services. With local builds, the entire process runs on your infrastructure and the only communication with EAS servers is:
  - to make sure project `@account/slug` exists
  - if you are using managed credentials to download them.
- Debugging (more info in [the next section](#using-local-builds-for-debugging))

## Using local builds for debugging

If you encounter build failures on EAS servers and you're unable to determine the cause from inspecting the logs, you may find it helpful to debug the issue locally. To simplify that process we support a number of environment variables to configure the local build process.

- `EAS_LOCAL_BUILD_SKIP_CLEANUP=1` - Set this to disable cleaning up the working directory after the build process is finished.
- `EAS_LOCAL_BUILD_WORKINGDIR` - Specify the working directory for the build process, by default it's somewhere (it's platform dependent) in `/tmp` folder.
- `EAS_LOCAL_BUILD_ARTIFACTS_DIR` - The directory where artifacts are copied after a successful build. By default these files are copied to the current directory, which may be undesirable if you are running many consecutive builds.

## Limitations

Some of the options available for cloud builds are not available locally. Limitations you should be aware of:

- You can only build for a specific platform (option `all` is disabled).
- Customizing versions of software is not supported, fields `node`, `yarn`, `fastlane`, `cocoapods`, `ndk`, `image` in **eas.json** are ignored.
- Caching is not supported.
- EAS Secrets are not supported (set them in your environment locally instead).
- You are responsible for making sure that the environment have all necessary tools installed:
  - Node.js/yarn/npm
  - fastlane (iOS only)
  - CocoaPods (iOS only)
  - Android SDK and NDK
