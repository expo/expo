---
title: Distribution for iOS
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

Now that you've installed the Expo Dev Client, you are ready to share builds with your team.

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing it to EAS Build! If you want to build a managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

## If you are installing in a simulator

### 1. Generate a Simulator IPA

You can generate a simulator build with `xcodebuild -sdk iphonesimulator -workspace ios/[MyApp].xcworkspace -scheme [MyApp]`

### 2. Transfer Development IPA to other Developers

After running the command, the generated APK will be named **MyApp.app** and can be found under `ios/build/Release-iphonesimulator/`

<br />

You can transfer the app folder via email, shared network directory, or however you would transfer an arbitrary file. You may want to compress the .app folder to facilitate the transfer.

### 3. Install on simulator

After launching your simulator, you can simply drag the .app/ folder from your file explorer onto the running simulator to install it.

If you would prefer to install via the command line you can do so via `xcrun simctl install booted [path to .app folder]`

## If you are installing on a physical device

> 💡 The process for installing a development client build is currently **very manual**. We are hard at work to provide a smoother flow for developers utiliziing our build service.

### 1. Collect the UDID for any devices that will need to load the application

Getting the UDID from non-developers is not a foolproof process. [These](https://help.apple.com/xcode/mac/current/#/dev93ef696c6?sub=devdfa32588f) instructions should help.

### 2. Register the target devices with an Ad-hoc Distribution Profile

Your target devices will need to be registered to an Ad-hoc Distribution Profile. You can find the latest instructions for how to do so [here](https://help.apple.com/developer-account/#/devebd34abb1)

### 3. Export an Ad Hoc IPA

After you have set up your distribution profile, you can follow the instructions [here](https://docs.testfairy.com/iOS_SDK/Exporting_Ad_Hoc_IPA.html) to generate an IPA using the Distribution Profile

### 4. Install on device

**to install via itunes**

[godspeed](https://developer.apple.com/forums/thread/86806)

**to install via download**

You can serve the IPA according to the instructions [here](https://docs.monaca.io/en/products_guide/monaca_ide/deploy/non_market_deploy/) under install using OTA Deployment to allow any of your target users / devices to run your IPA after downloading it from a public URL
