---
title: Internal distribution
---

import TerminalBlock from '~/components/plugins/TerminalBlock';
import { theme } from '@expo/styleguide'

Uploading your app to TestFlight and Google Play beta can be time consuming and limiting (e.g. TestFlight can only have one active build at a time). You can skip these services entirely by building binaries that can be downloaded and installed to physical devices directly from a web browser.

EAS Build can help you with this by providing sharable URLs for your builds with instructions on how to get them running, so you can share a single URL with a teammate that'll include all of the information they need to test the app.

> 😅 Installing an app on iOS is a bit trickier than on Android, but it's possible thanks to ad hoc and enterprise provisioning profiles. We'll talk more about this later in this doc.

<h1 style={{borderBottom: 'none', marginTop: 30, marginBottom: 15, fontFamily: 'expo-brand-bold', color: theme.text.default}}>Setting up internal distribution</h1>

The following three steps will guide you through adding internal distribution to a project that is [already set up to build with EAS Build](setup.md). It will only take a few minutes in total to: configure the project, add a couple of test iOS devices to a provisioning profile, and start builds for Android and iOS.

<div style={{marginTop: -10}} />

## 1. Configure a build profile

Open up **eas.json** and add a new build profile for iOS and/or Android.

```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    /* @info add this profile only if you have an account with Apple Developer Enterprise Program membership */
    "preview-enterprise" /* @end */: {
      "distribution": "internal",
      "ios": {
        /* @info valid values: universal, adhoc */
        "enterpriseProvisioning": "universal" /* @end */

      }
    }
  }
}
```

### Android

Please note that if you override the `gradleCommand` on Android, you should ensure that it produces an `apk` rather than an `aab`, so it is directly installable to an Android device.

### iOS

Add the `preview-enterprise` profile only if you have an Apple account with Apple Developer Enterprise Program membership. You'll learn more on this later. While using the enterprise provisioning, you can sign your app using a `universal` or `adhoc` provisioning profile. The former (`universal`) is recommended as it does not require you to register your devices with Apple.

## 2. Configure app signing

### 2.1 Configure app signing credentials for Android

Android does not restrict distribution of applications &mdash; the operating system is capable of installing any compatible `apk` file. As a result, configuring app signing credentials for internal distribution is no different from other types of builds. The main benefit of using internal distribution in this case is to have an easily shareable URL to provide to testers for downloading the app.

### 2.2 Configure app signing credentials for iOS

Apple restricts distribution of applications on iPhones and iPads, so we will need to build the app with an ad hoc provisioning profile that explicitly lists the devices that the application can run on.

An alternative to ad hoc provisioning is enterprise provisioning, which requires a special Apple Developer membership that costs $299 USD per year. Enterprise provisioning allows you to run the application on any device.

#### Setting up ad hoc provisioning

Apps signed with an ad hoc provisioning profile can be installed by any iOS device whose unique identifier (UDID) is registered with the provisioning profile.

Setting up ad hoc provisioning consists of two steps. In the first step, you'll register devices that you want to be able to install your app. Run the following command to generate a URL (and QR code, for convenience) that you can open on your devices, and then follow the instructions on the registration page.

<TerminalBlock cmd={['# Register Apple Devices for internal distribution', 'eas device:create']} />

You can register new devices at any time, but builds that were created before the device was registered will not run on newly registered devices; only builds that are created after the device is registered will be installable.

The next step is to generate or update the provisioning profile. When you proceed to running a build, you will be guided through this process.

> **Are you using manual local credentials?** Make sure to point your **credentials.json** to an ad hoc or enterprise provisioning profile that you generate through the Apple Developer Portal (either update an existing credentials.json used for another type of distribution or replace it with a new one that points to the appropriate provisioning profile). Beware that EAS CLI does only a limited validation of your local credentials, and you will have to handle device UDID registration manually. Read more about [using local credentials](/app-signing/local-credentials.md).

#### Setting up enterprise provisioning

Apple Enterprise Program membership costs $299 USD per year and is only available to organizations that match certain criteria, so you will likely be using ad hoc provisioning, which works with any normal paid Apple developer account.

If you have an [Apple Developer Enterprise Program membership](https://developer.apple.com/programs/enterprise/) users can install your app to their device without pre-registering their UDID; they just need to install the profile to their device and they can then access existing builds. You will need to sign in using your Apple Developer Enterprise account during the `eas build` process to set up the correct provisioning.

If you distribute your app both through enterprise provisioning and the App Store, you will need to have a distinct bundle identifier for each context. We recommend either:

- In managed projects, use **app.config.js** to dynamically switch identifiers.
- In bare projects, create a separate `scheme` for each bundle identifier and specify the scheme name in separate build profiles.

> **Are you using manual local credentials?** Make sure to point your **credentials.json** to an ad hoc or enterprise provisioning profile that you generate through the Apple Developer Portal. Beware that EAS CLI does only a limited validation of your local credentials, and you will have to handle device UDID registration manually. Read more about [using local credentials](/app-signing/local-credentials.md).

## 3. Run a build with the internal build profile

Now that we have set up our build profile and app signing, running a build for internal distribution is just like any other build.

<TerminalBlock cmd={['# Create iOS and Android builds for internal distribution', 'eas build --profile preview --platform all', '', '# Or create an iOS build for enterprise distribution', 'eas build --profile preview-enterprise --platform ios']} />

> If you're using ad hoc provisioning but you haven't registered any devices yet, you'll be asked to register them now (or exit the current command and run `eas device:add` again). The build command will wait for the new device to register. Scan the QR code that is presented in the terminal and follow the instructions on that page to register your device. When you're done, return to the terminal and continue.

When the build completes, you will be given a URL that you can share with your team to download and install the app.

<!--
(@dsokal) this is not implemented yet

When using iOS ad hoc provisioning managed by Expo, if a teammate navigates to this URL on an iOS device that is not yet registered, they will be able to register their device and initiate a new build to include the updated profile that will run on their device. If the ad hoc provisioning profile is not managed by Expo, the user will be asked to contact the organization admin in order to add their device UDID and create a new build compatible with their device.
-->
