---
title: Building with EAS
---

import InstallSection from '~/components/plugins/InstallSection';
import { Tab, Tabs } from '~/components/plugins/Tabs';

## Setting up EAS

You can set up your project to use EAS by running `eas build:configure`. If you have not installed EAS CLI yet, you can do so by running `npm install -g eas-cli` (or `yarn global add eas-cli`.)

### Modifying an existing eas.json

If you have already have an **eas.json** file in your project, you'll need to update your config to create builds of your custom client.

To create a custom development client instead of a production build, set the `developmentClient` value to `true`.
To create the build that can be installed on a physical device, set the `distribution` value to [`internal`](/build/internal-distribution.md).
To create a simulator build, set the `ios.simulator` value to `true`.

An example configuration would look like this:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "development-simulator": {
      "developmentClient": true,
      "ios": {
        "simulator": true
      }
    },
    "production": {}
  }
}
```

## Generating your first build

You can now generate a new build of your project from any commit through EAS.

### For iOS devices:

Register any devices you would like to use your development client on to your ad hoc provisioning profile
<InstallSection packageName="expo-dev-launcher" cmd={["eas device:create"]} hideBareInstructions />

Generate the build signed with your ad hoc provisioning profile.
<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

You will need to generate a new build to install successfully on any new devices added to your provisioning profile. [You can find more guidance on distributing your app to your team here.](https://docs.expo.dev/build/internal-distribution/)

### For Android:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform android"]} hideBareInstructions />
