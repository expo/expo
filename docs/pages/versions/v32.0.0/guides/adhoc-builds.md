---
title: Installing a Custom iOS Expo client
---

> **WARNING:** This feature is in alpha release and is not released to production yet.

Build and install a custom version of the [Expo client](https://docs.expo.io/versions/latest/introduction/installation/#mobile-client-expo-for-ios-and-android) with your own Apple Credentials using our build service. This custom version of the Expo client contains features that were previously only available on the Android versions. Our build service will prepare your custom Expo client, and you can install it to your iOS device directly from our website.

#### Installation overview

![Adhoc Builds Overview](/static/images/adhoc-builds-overview.jpg)

## 0. Prerequisites

- You’ll need a **paid** [Apple Developer Account](https://developer.apple.com/programs) to configure credentials required for the development and distribution process of an app. Learn more [here](https://developer.apple.com/programs/whats-included/).
- Install the `expo-cli` command line app by following the instructions [here](https://docs.expo.io/versions/latest/workflow/expo-cli/).

**Windows users** must have WSL enabled. You can follow the installation guide [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10). We recommend picking Ubuntu from the Windows Store. Be sure to launch Ubuntu at least once. After that, use an Admin powershell to run:
`Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux`

## 1. Start the build

Run `expo client:ios`

### 1a. Provide Apple Credentials

You are given a choice of letting `expo-cli` create the necessary credentials for you, while still having a chance to provide your own overrides. Your Apple ID and password are used locally and never saved on Expo's servers.

Letting Expo handle credentials for you will greatly simplify the build process. Learn more (here)[https://docs.expo.io/versions/latest/distribution/security] on what these credentials are and how we store them.

```bash
$ expo client:ios
[16:44:37] Checking if current build exists...

[16:44:37] No currently active or previous builds for this project.
[16:44:37]
Please enter your Apple Developer Program account credentials. These credentials are needed to manage certificates, keys and provisioning profiles in your Apple Developer account.

The password is only used to authenticate with Apple and never stored.

? What\'s your Apple ID? xxx@yyy.zzz
? Password? [hidden]
✔ Authenticated with Apple Developer Portal successfully!
[16:44:46] You have 4 teams associated with your account
? Which team would you like to use? 3) ABCDEFGHIJ "John Turtle" (Individual)

? Select an iOS distribution certificate to use for code signing:
❯ [Create a new certificate]
  [Upload an existing certificate]

? Select an authentication token signing key to use for push notifications: (Use arrow keys)
❯ Used in apps: @john-turtle/expo-client-home-xxx (Key ID: XXX)
  [Create a new key]
  [Upload an existing key]
```

We ask you if you'd like us to handle your Distribution Certificate or use your own. If you have previously used `expo-cli` for building a standalone app for a different project, then we'll ask you if you'd like to reuse your existing Distribution Certificate. If you don't know what a Distribution Certificate is, just let us handle it for you. If you do need to upload your own certificates, we recommend following [this excellent guide on making a P12 file](https://calvium.com/how-to-make-a-p12-file/).
**Note:** this guide recommends leaving the P12's password blank, but a P12 password is required to upload your own certificate to Expo's service. Please enter a password when prompted.

#### Push Notification Credentials

We'll also help you handle your Push Notifications service key and provisioning profile. Remember that Push Notifications service keys can be reused across different Expo apps as well.

**Note:** Push Notifications will be disabled on the Expo client if you choose not to upload your credentials. See [here](#push-notifications-arent-working) for more details.

### 1b. Determine UDID of your iOS Device

In order to install your custom build of the Expo client on your iOS device, we will need to determine your device UDID so we can configure your provisioning profile and authorize your device to download the Expo client.

```bash
Custom builds of the Expo client can only be installed on devices which have been registered with Apple at build-time.
These devices are currently registered on your Apple Developer account:
┌───────────────┬──────────────────────────────────────────┐
│ Name          │ Identifier                               │
├───────────────┼──────────────────────────────────────────┤
│ muh iphone    │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx         │
└───────────────┴──────────────────────────────────────────┘

? Would you like to register new devices to use the Expo client with? (Y/n) Y
```

If you would like to install the Expo client on an iOS device that is not listed above, follow the prompts to register your device.

```bash
? Would you like to register new devices to use the Expo client with? Yes

==================
[QR Code redacted]
==================

Open the following link on your iOS device (or scan the QR code) and follow the instructions to install the development profile:

https://expo.io/udid/XXXXXXXXXXXXX


After you register your device, we'll start building your client, and you'll receive an email when it's ready to install.
```

You will need to open this QR code on the iOS device you wish to register. Read [this](#registering-multiple-ios-devices) if you wish to register more than one iOS device.

On iOS versions earlier than 12.2, if you aren't taken to the `Installing Profile` page after pressing the `Register` button, try quitting your `Settings` app and try again.

![UDID Workflow](/static/images/adhoc-builds-udid.png)

#### iOS 12.2+

On iOS versions 12.2 or later, a window will popup saying `Profile Downloaded`. Close the popup, go to the `Settings` app and navigate to the `Profile Downloaded` option to download the device enrollment challenge.

![UDID Workflow](/static/images/adhoc-builds-udid2.png)

### 2. Wait for it to finish building

You can monitor the status of your Expo client build by visiting the link. You will also be notified via email when there are updates to your build. More details can be found on your build dashboard [here](https://expo.io/builds).

```bash
==================
[QR Code redacted]
==================

Your custom Expo client is being built! 🛠
Open this link on your iOS device (or scan the QR code) to view build logs and install the client:

https://expo.io/client/XXXXXXXXXX
```

### 3. Install the Custom Expo client on your iOS device

![Install Workflow](/static/images/adhoc-builds-install.png)

Once your build is complete, open the status page on your iOS device and tap the `Install` button.

### 4. You're done!

You're all set to use the custom version of the Expo client, containing features that were previously only available on the Android versions 🎉

# Troubleshooting

## Push Notifications aren't working

If you choose not to upload your Push Notifications credentials, Push Notifications will not work on the Expo client. In order to get an Expo client with Push Notifications enabled, you will need to submit another build request and upload or create your push credentials at the prompt.

If you are experiencing a different problem with Push Notifications, refer to the [main article](https://docs.expo.io/versions/latest/guides/push-notifications/) for more information.

## Cannot generate/revoke credentials

### Apple Enterprise Accounts - Insufficient permissions

If you are part of an organization with an Apple Enterprise account, you will need to ensure that you are given sufficient permissions to create and revoke certificates.

The administrator of the Apple Enterprise account will need to make you an App Manager and give you access to Developer Resources from the [Apple Development Portal](https://developer.apple.com/account/).

![Apple Development Portal Permissions](/static/images/adhoc-builds-apple-org.png)

## Registering multiple iOS devices

You can register multiple iOS devices by submitting multiple requests to build the Expo client. We've currently limited one iOS device registration per build request.

## Simulator Builds

We do not support simulator builds for adhoc Expo client builds yet.
