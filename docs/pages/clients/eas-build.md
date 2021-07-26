---
title: Building with EAS
---

import InstallSection from '~/components/plugins/InstallSection';
import { Tab, Tabs } from '~/components/plugins/Tabs';

## Setting up EAS

You can set up your project to use EAS by running `eas build:configure`.  If you have not installed EAS CLI yet, you can do so by running `npm install -g eas-cli` (or `yarn global add eas-cli`.)



### Modifying an existing eas.json

If you have already have an `eas.json` file in your project, you'll need to update your config to create builds of your custom client.

<Tabs tabs={["With config plugins", "If you are directly managing your native projects"]}>

<Tab >

`expo-dev-client` does not modify your application's behavior in a build you would submit to the Play Store or App Store, so you must specify `development-client` as your `buildType` to create a custom development client.
To share the build with your internal team, use [`internal` distribution](/build/internal-distribution.md).

An example configuration would look like this:
```json
{
  "builds": {
    "android": {
      "release": {
        "buildType": "app-bundle"
      },
      "development": {
        "distribution": "internal",
        "buildType": "development-client"
      }
    },
    "ios": {
      "release": {
        "buildType": "release"
      },
      "development": {
        "distribution": "internal",
        "buildType": "development-client"
      }
    }
  }
}
```
</Tab>
<Tab>

`expo-dev-client` does not modify your application's behavior in a "Release" build, so you must create a "Debug" build via `gradleCommand` (Android) or `schemeBuildConfiguraiton` (iOS) to create a custom development client.
To share the build with your internal team, use [`internal` distribution](/build/internal-distribution.md).

An example configuration would look like this:
```json
{
  "builds": {
    "android": {
      "release": {
        "gradleCommand": ":app:bundleRelease"
      },
      "development": {
        "distribution": "internal",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "ios": {
      "release": {
        "schemeBuildConfiguration": "Release"
      },
      "development": {
        "distribution": "internal",
        "schemeBuildConfiguration": "Debug"
      }
    }
  }
}
```
</Tab>
</Tabs>

## Generating your first build

You can now generate a new build of your project from any commit through EAS.

### For iOS devices:

Register any devices you would like to use your development client on to your ad hoc provisioning profile
<InstallSection packageName="expo-dev-launcher" cmd={["eas device:create"]} hideBareInstructions />

Generate the build signed with your ad hoc provisioning profile.
<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

You will need to generate a new build to install successfully on any new devices added to your provisioning profile.  [You can find more guidance on distributing your app to your team here.](https://docs.expo.io/build/internal-distribution/)

### For Android:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform android"]} hideBareInstructions />
