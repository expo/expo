---
title: Introduction
---

**EAS Build** is a hosted service for building app binaries for your Expo and React Native projects. It makes building your apps for distribution super easy by providing defaults that work well for Expo and React Native projects out of the box and by handling your app signing credentials for you, if you would like it to. It is also configurable where needed, in case your app has custom build requirements. It will one day replace the existing build service entirely.

> ⚠️ **Building managed Expo projects is not yet supported**, but we are working on bringing it to EAS Build! If you wish to build a managed Expo project with EAS Build, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

## Discover EAS Build

- [EAS Build from scratch in 5 minutes](eas-build-in-5-minutes.md) - This is a step-by-step tutorial that will guide you through initializing a new project and kicking off a build in less than 5 mintues. If you want to experiment with EAS Build before integrating it with your existing project, this is a good place to start.
- [Set up your project and environment](setup.md) - Get your existing project ready to build.
- [Configuration with eas.json](eas-json.md) - Learn about configuring your build workflows with the `eas.json` file.
- [Android build process](android-builds.md) - See how Android builds work under the hood.
- [iOS build process](ios-builds.md) - See how iOS builds work under the hood.
- [Advanced credentials configuration](advanced-credentials-configuration.md) - Use your existing app's credentials or streamline the CI build process with `credentials.json`.
- [How to: configuration examples](how-tos.md) - Instructions on how to configure builds in less common cases.
