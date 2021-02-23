---
title: Building With EAS
---

import InstallSection from '~/components/plugins/InstallSection';

## Setting up distinct build profiles on iOS

If you would like to use EAS Build to generate and distribute builds of the Development Client, you will need to create a new XCode scheme for Development Client builds of your project.

The easiest way to do this is to duplicate the scheme for your main application. [You can find Apple's instructions for how to do so here](https://developer.apple.com/library/archive/documentation/ToolsLanguages/Conceptual/Xcode_Overview/ManagingSchemes.html)

Once this is done, you will need to set the `Build Configuration` for your Development Client to `Debug`

## Setting up EAS

You can set up your project to use EAS by [following the instructions here](/build/setup/#3-configure-the-project)

## Modifying your EAS.json

Assuming you named your new XCode scheme `Project - Development Client`, edit your eas.json to look like this.

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic",
        "gradleCommand": ":app:bundleRelease"
      },
      "development": {
        "workflow": "generic",
        "distribution": "internal",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic",
        "scheme": "Project - Release"
      },
      "development": {
        "workflow": "generic",
        "distribution": "internal",
        "scheme": "Project - Development Client"
      }
    }
  }
}
```

## Generating your first build

You can now generate a new build of your project from any commit through EAS.

### For iOS simulators:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

### For iOS devices:

Register any devices you would like to use your development client on to your ad hoc provisioning profile
<InstallSection packageName="expo-dev-launcher" cmd={["eas device:create"]} hideBareInstructions />

Generate the build signed with your ad hoc provisioning profile.
<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

You will need to generate a new build to install successfully on any new builds added to your provisioning profile.  [You can find more guidance on distributing your app to your team here.](https://docs.expo.io/build/internal-distribution/)

### For Android:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform android"]} hideBareInstructions />
