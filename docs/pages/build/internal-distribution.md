---
title: Internal distribution
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

Uploading your app to TestFlight and Google Play beta can be time consuming and can be limiting (e.g. TestFlight can only have one active build at a time). You can skip these services entirely by building binaries that can be downloaded and installed to physical devices directly from a web browser. EAS Build can help you with this by providing sharable URLs for your builds with instructions on how to get them running, so you can just share one URL with a teammate and it'll include all of the information they need to test the app.

> 😅 Installing an app on iOS is a bit trickier than on Android, but it's possible thanks to adhoc and enterprise provisioning profiles. We'll talk more about this later in this doc.

## Setting up internal distribution

### Configuring a build profile

Open up `eas.json` and add a new build profile for iOS and/or Android.

```json
{
  "builds": {
    "android": {
      "preview": {
        /* @info valid values: store, internal. defaults to store */
        "distribution": "internal",
        /* @end */
        "workflow": "generic"
      }
    },
    "ios": {
      "preview": {
        /* @info valid values: store, internal. defaults to store */
        "distribution": "internal",
        /* @end */
        "workflow": "generic"
      }
    }
  }
}
```

### Configuring app signing credentials for Android

This is no different from configuring app signing credentials for other types of builds.

### Configuring app signing credentials for iOS

<!--
(@dsokal) this is not implemented yet

#### Enterprise provisioning

If you plan on using enterprise provisioning, please sign in to the account with [Apple Developer Enterprise Program membership](https://developer.apple.com/programs/enterprise/). You probably don't have this, and it's expensive (\$299 USD per year) and takes time to acquire, so you will likely be using adhoc provisioning &mdash; this works on any normal paid Apple developer account.
-->

<!--
(@dsokal) this is not implemented yet

#### Setting up enterprise provisioning

If you do have an Apple enterprise account, this makes internal distribution much easier for users who want to install your app for the first time. Once they install the profile to their device they can access the app right away. One limitation of using an enterprise provisioning profile is that you will need to have a distinct bundle identifier from the one that you use to publish your app to the App Store. (@brentvatne: after this is a bad idea intentionally, we should probably have a config option, i'm just putting it there so we have something for now) We recommend setting your bundle identifier for internal distribution and committing that change on another branch. After that, whenever you want to create a preview branch you can check out that branch and rebase against the branch you'd like to create a build for.
-->

#### Setting up adhoc provisioning

Apps signed with an adhoc provisioning profile can be installed by any iOS device whose unique identifier (UDID) is registered with the provisioning profile.

Setting up adhoc provisioning consists of two steps. In the first step, you'll register all devices you want to run your app on. Run the following command to generate a URL (and QR code, for convenience) that you can open on your devices to register them to be eligible for internal distribution.

<TerminalBlock cmd={['# Register Apple Devices for internal distribution', 'eas device:create']} />

When all of your devices are registered, the next step is to run a build. The build command will guide you through the credentials (provisioning profile) generation process.

#### Advanced flow: Using credentials.json

**Using credentials.json?** If you are using local credentials, make sure you point your `credentials.json` to an ad-hoc <!-- or enterprise -->provisioning profile that you generate through the Apple Developer portal. Beware that EAS CLI does only a limited validation of your local credentials. Use at your own risk!

### Run a build with the internal build profile

Now that we have set up our build profile and app signing, running a build for internal distribution is just like any other build.

<TerminalBlock cmd={['# Create iOS and Android builds for internal distribution', 'eas build:create --profile preview --platform all']} />

If you choose to let Expo manage your adhoc provisioning profile, we will show you the list of all devices registered so far. You will then be prompted to confirm you want to proceed with those devices.

When the build completes, you will be given a URL that you can share with your team (provided that they have an Expo account and are part of your organization <!-- (@dsokal) we'll change this requirement so everyone who knows the URL can install the app -->) to download and install the app.

<!--
(@dsokal) this is not implemented yet

If the device you would like to distribute to is not currently registered, you can choose to register it now (or exit the current command and run `eas device:add` again). The build command will wait for the new device to register. Scan the QR code that is presented in the terminal and follow the instructions on that page to register your device. When you're done, return to the terminal and press return to continue. You should see that your new device registration has been detected and added to the profile.

You can add another if you like, otherwise continue.
-->

<!--
(@dsokal) this is not implemented yet

When using iOS adhoc provisioning managed by Expo, if a teammate navigates to this URL on an iOS device that is not yet registered, they will be able to register their device and initiate a new build to include the updated profile that will run on their device. If the adhoc provisioning profile is not managed by Expo, the user will be asked to contact the organization admin in order to add their device UDID and create a new build compatible with their device.
-->
