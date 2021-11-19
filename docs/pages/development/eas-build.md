---
title: Building with EAS
---

import InstallSection from '~/components/plugins/InstallSection';
import { Tab, Tabs } from '~/components/plugins/Tabs';

## Setting up EAS

You can set up your project to use EAS by running `eas build:configure`. If you have not installed EAS CLI yet, you can do so by running `npm install -g eas-cli` (or `yarn global add eas-cli`.)

### Types of apps

**eas.json** comes with three build profiles: "development", "preview", and "production". These profile names reference three different types of builds you can build.

1. Development builds are builds of your project that include the [`expo-dev-client`](https://github.com/expo/expo/tree/master/packages/expo-dev-client) library, which provides development tools.
2. Preview apps are builds that do not include developer tools. They're great for sharing with your team via internal distribution or for testing your app on an Android emulator or iOS simulator.
3. Production apps are meant to be submitted to the app stores, and eventually released to users of your app.

Each of these profiles are completely customizable according to the [**eas.json** reference](/build/eas-json).

To configure a development build, you can use the "development" profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

This profile has three options set:

- Setting `developmentClient` to `true` will include the `expo-dev-client` library in your app, which adds developer tools so that you can develop your app.
- Setting `distribution` to '"internal"` will make a build ready for [internal distribution](/build/internal-distribution).

## Creating a development build

### For Android:

To create and share a development build with your team, you can run the following:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform android"]} hideBareInstructions />

To share the build with your team, direct them to the build page on https://expo.dev. There, they'll be able to download the app directly on their device.

### For iOS devices:

To allow iOS devices to run a build built for internal distribution, you'll have to register each iOS device you'd like to install your development build on.

You can register an iOS device and install a provisioning profile with the following command:
<InstallSection packageName="expo-dev-launcher" cmd={["eas device:create"]} hideBareInstructions />

Once you've registered all iOS devices you'll want to run your development build on, you can run the following to create a build ready for internal distribution:
<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

To share the build with your team, direct them to the build page on https://expo.dev. There, they'll be able to download the app directly on their device.

Note: If you register any new iOS devices, you'll need create a new development build. Learn more about [internal distribution](https://docs.expo.dev/build/internal-distribution/).
