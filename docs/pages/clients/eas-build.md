---
title: Building with EAS
---

import InstallSection from '~/components/plugins/InstallSection';
import { Tab, Tabs } from '~/components/plugins/Tabs';

## Setting up EAS

You can set up your project to use EAS Build by running `eas build:configure`. This command automatically adds a [build profile](build/eas-json/#build-profiles) named `development` that builds your client.

> If you have not installed EAS CLI yet, you can do so by running `npm install -g eas-cli` (or `yarn global add eas-cli`.

## Generating your first build

You can now generate a new build of your project from any commit through EAS.

### For iOS simulators:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

### For iOS devices:

Register any devices you would like to use your development client on to your ad hoc provisioning profile
<InstallSection packageName="expo-dev-launcher" cmd={["eas device:create"]} hideBareInstructions />

Generate the build signed with your ad hoc provisioning profile.
<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform ios"]} hideBareInstructions />

You will need to generate a new build to install successfully on any new devices added to your provisioning profile. [You can find more guidance on distributing your app to your team here.](https://docs.expo.io/build/internal-distribution/)

### For Android:

<InstallSection packageName="expo-dev-launcher" cmd={["eas build --profile development --platform android"]} hideBareInstructions />
