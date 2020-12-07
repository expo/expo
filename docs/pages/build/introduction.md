---
title: Introduction
---

**EAS Build** is a hosted service for building app binaries for your Expo and React Native projects. It makes building your apps for distribution super easy by providing defaults that work well for Expo and React Native projects out of the box and by handling your app signing credentials for you, if you would like it to. It is also configurable where needed, in case your app has custom build requirements. It will one day replace the existing build service entirely.

## Discover EAS Build

### Get started

- [Walkthrough](walkthrough.md) - This walkthrough will show you how to initialize a new project and kick off a build in less than 5 mintues. If you want to experiment with EAS Build before integrating it with your existing project, this is a good place to start.
- [Set up your project and environment](setup.md) - Get your existing project ready to build.
- [Common configuration examples](how-tos.md) - Instructions on how to configure builds for some common cases that can't be handled automatically.

### Distributing your app

- [Internal distribution](internal-distribution.md) - Share runnable builds with your team without going through TestFlight or Google Play Beta.
- [Submitting to app stores with EAS Submit](/submit/introduction.md) - Submit your build to Apple App Store and/or Google Play Store.

### Get a deeper understanding

- [Configuration with eas.json](eas-json.md) - Learn about configuring your build workflows with the `eas.json` file.
- [Android build process](android-builds.md) - See how Android builds work under the hood.
- [iOS build process](ios-builds.md) - See how iOS builds work under the hood.
- [Advanced credentials configuration](advanced-credentials-configuration.md) - Use your existing app's credentials or streamline the CI build process with `credentials.json`.
