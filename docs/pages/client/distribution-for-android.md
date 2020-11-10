---
title: Distribution for Android
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

Now that you've installed the Expo Dev Client, you are ready to share builds with your team.

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing it to EAS Build! If you want to build a managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

## 1. Generate a Development APK

Unimodules contains infrastructure and a small set of foundational libraries that are depended on by other modules in the Expo ecosystem. Once it is installed you can use most of the libraries from the Expo SDK, like expo-camera, expo-media-library and many more.

<InstallSection packageName="expo-dev-client" cmd={["./gradlew assembleDebug"]} hideBareInstructions />

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
