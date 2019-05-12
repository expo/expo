---
title: Installing a Custom iOS Expo Client
---

> **WARNING:** This feature is in alpha release and is not released to production yet.

![Build Overview](/static/images/adhoc-builds-overview.gif)

Build and install a custom version of the Expo Client (link) with your own Apple Credentials using our build service. This custom version of the Expo Client contains features that were previously only available on the Android versions. Our build service will prepare your custom Expo Client, and you can install it to your iOS device directly from our website.

## 0. Prerequisites

You'll need a paid [Apple Developer Account](https://developer.apple.com/programs).

## 1. Install Expo CLI

Expo CLI is the tool for developing and building Expo apps. Run `npm install -g expo-cli` (or `yarn global add expo-cli`) to get it.

If you haven't created an Expo account before, you'll be asked to create one when running the build command.

**Windows users** must have WSL enabled. You can follow the installation guide [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10). We recommend picking Ubuntu from the Windows Store. Be sure to launch Ubuntu at least once. After that, use an Admin powershell to run:
`Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux`

## 2. Start the build

Run `expo client:ios`.

### 2a. Provide Apple Credentials

You are given a choice of letting the `expo` client create the necessary credentials for you, while still having a chance to provide your own overrides. Your Apple ID and password are used locally and
never saved on Expo's servers.

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
**Note:** this guide recommends leaving the P12's password blank, but a P12 password is required to upload your own certificate to Expo's service. Please enter a password when prompted. We'll also help you handle your Push Notifications service key and provisioning profile. Remember that Push Notifications service keys can be reused across different Expo apps as well.

### 2b. Determine UDID of your iOS Device

In order to install your custom build of the Expo Client on your iOS device, we will need to determine your device UDID so we can configure your provisioning profile and authorize your device to download the Expo Client.

```bash
Custom builds of the Expo Client can only be installed on devices which have been registered with Apple at build-time.
These devices are currently registered on your Apple Developer account:
┌───────────────┬──────────────────────────────────────────┐
│ Name          │ Identifier                               │
├───────────────┼──────────────────────────────────────────┤
│ muh iphone    │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx         │
└───────────────┴──────────────────────────────────────────┘

? Would you like to register new devices to use the Expo Client with? (Y/n) Y
```

If you would like to install the Expo Client on an iOS device that is not listed above, follow the prompts to register your device.

```bash
? Would you like to register new devices to use the Expo Client with? Yes

==================
[QR Code redacted]
==================

Open the following link on your iOS device (or scan the QR code) and follow the instructions to install the development profile:

https://expo.io/udid/XXXXXXXXXXXXX


After you register your device, we'll start building your client, and you'll receive an email when it's ready to install.
```

You will need to open this QR code on the iOS device you wish to register. If you aren't taken to the `Installing Profile` page after pressing the `Register` button, try quitting your `Settings` app and try again.

![UDID Workflow](/static/images/adhoc-builds-udid.png)

### 2c. Wait for it to finish building

You can monitor the status of your Expo Client build by visiting the link. You will also be notified via email when there are updates to your build. More details can be found on your build dashboard [here](https://expo.io/builds).

```bash
==================
[QR Code redacted]
==================

Your custom Expo Client is being built! 🛠
Open this link on your iOS device (or scan the QR code) to view build logs and install the client:

https://expo.io/client/XXXXXXXXXX
```

### 2d. Installing Expo Client on your iOS device

![Install Workflow](/static/images/adhoc-builds-install.png)

Once your build is complete, open the status page on your iOS device and tap the `Install` button.
