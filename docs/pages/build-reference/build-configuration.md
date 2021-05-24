---
title: Build configuration process
sidebar_title: Configuration process
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

In this guide you will learn what happens when EAS CLI configures your project with `eas build:configure` (or `eas build` - which runs this same process if the project is not yet configured).

EAS CLI performs the following steps when configuring your project:

#### 1. Ask you about the platform(s) to configure

If you only want to use EAS Build for a single platform, that's fine. If you change your mind, you can come back and the other later.

<ImageSpotlight alt="Terminal running eas build command with platform iOS and Android options available" src="/static/images/eas-build/walkthrough/04-configure-platform.png" containerStyle={{ paddingBottom: 0 }} />

#### 2. Create eas.json

The command will create an `eas.json` file in the root directory with the following contents:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic"
      }
    }
  }
}
```

This is your EAS Build configuration. It defines a single build profile named `release` (you can have multiple build profiles like `release`, `debug`, `testing`, etc.) for each platform. In the generated configuration, each profile declares that the project is a generic React Native project (unlike a managed Expo project which doesn't contain native code in the project tree). If you want to learn more about `eas.json` see the [Configuration with eas.json](/build/eas-json.md) page.

#### 3. Configure the Android project

EAS CLI performs two steps:

- It resolves the application ID and updates `build.gradle` with it.

  > If you have previously set the Android application ID in app.json, you'll be asked to choose between that and the application ID defined in the native project (this is the default that comes from `expo init`).
  >
  > It's important that you choose the application ID defined in app.json because this is how your application will be identified on the Google Play Store.

- It auto-configures your Gradle project so we could build it on our servers.

  > This step also patches `build.gradle` by including there our custom signing configuration. The configuration itself is saved to a separate file: `eas-build.gradle`.

<ImageSpotlight alt="Android configuration prompt in eas build:configure" src="/static/images/eas-build/walkthrough/05-configure-android.png" containerStyle={{ paddingBottom: 0 }} />

#### 4. Configure the iOS project

Similar configuration step is performed for the iOS project. EAS Build resolved the bundle identifier and updates the `project.pbxproj` file.

Make sure to choose the bundle identifier defined in app.json because it'll be used to identify you app on the Apple App Store.

<ImageSpotlight alt="Xcode configuration prompt in eas build:configure" src="/static/images/eas-build/walkthrough/06-configure-xcode.png" containerStyle={{ paddingBottom: 0 }} />

That's all there is to configuring a project to be compatible with EAS Build.
