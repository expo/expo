---
title: Building Android Locally
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing the Dev Launcher to the Managed Workflow! If you want to build a managed Expo project with the Dev Launcher, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

## 1. Generate a Development APK

To generate a development APK you need to run the following command:

<InstallSection packageName="expo-dev-client" cmd={["./gradlew assembleDebug"]} hideBareInstructions />

For more information check the [official Android documentation](https://developer.android.com/studio/build/building-cmdline#build_apk).

<br />

## 2. Transfer Development APK to other Developers

After running the command, the generated APK will be named `**module-name**-debug.apk` and can be found under `**project-name**/**module-name**/build/outputs/apk`

<br />

You can transfer the APK via email, shared network directory, or however you would transfer an arbitrary file.

## 3. Install Development APK

### If you are installing in a simulator

You can drag and drop the apk file into your running simulator to install it

If you would prefer to install via the command line, you can use `adb install example.apk`

You can find more instructions [here](https://developer.android.com/studio/run/emulator)

### If you are installing on a physical device

You can find instructions about installing an app on your physical device [here](https://developer.android.com/studio/run/device)
