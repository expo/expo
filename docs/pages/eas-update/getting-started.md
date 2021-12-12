---
title: Getting started
---

Setting up EAS Update allows you to push critical bug fixes and improvements that your users need right away.

EAS Update is in "preview", meaning that we may still make breaking developer-facing changes. With that, EAS Update is ready for production apps. Read through the [known issues](/eas-update/known-issues) to ensure EAS Update is ready for your project.

## Install Expo CLI and EAS CLI

1. Install EAS and Expo CLIs with:

   ```bash
   npm install --global eas-cli expo-cli
   ```

   EAS Update requires EAS CLI >= 0.40.0 and Expo CLI >= 4.13.0.

## Create an Expo account

1. Create an account at [https://expo.dev/signup](https://expo.dev/signup)
2. Then, log in with EAS CLI:

   ```bash
   eas login
   ```

3. After logging in, you can verify the logged in account with `eas whoami`.

## Create a project

1. Create a project with Expo CLI by running:

   ```bash
   expo init
   ```

2. Select "Managed workflow > blank".

## Configure your project

1. Install the latest `expo-updates` library with:

   ```bash
   expo install expo-updates
   ```

2. Initialize your project with EAS Update:

   ```bash
   eas update:configure
   ```

3. To set up the configuration file for builds, run:

   ```bash
   eas build:configure
   ```

   This command will create a file named **eas.json**.

4. Inside the `preview` and `production` build profiles in **eas.json**, add a `channel` property for each:

   ```json
   {
     "build": {
        "preview": {
          "channel": "preview"
          ...
        },
        "production": {
          "channel": "production"
          ...
        }
     }
   }
   ```

   This `channel` property will allow you to point updates at builds. For example, if you set up a GitHub Action to publish changes on merge, it will make it so we can merge code into the "production" branch, then those commits will publish an update that will be made available to builds with the channel "production".

5. Optional: If your project is a bare React Native project, [read the doc](/eas-update/bare-react-native) on extra configuration you may need.

## Create a build for the project

Next, we'll need to create a build for Android or iOS. [Learn more](/build/setup).

We recommend creating a build with the `preview` build profile first. [Learn more](/build/internal-distribution) about setting up your devices for internal distribution.

Once you have a build running on your device or in a simulator, we'll be ready to send it an update.

## Make changes locally

Once we've created a build, we're ready to iterate on our project.

When we run our project locally, Expo CLI creates a manifest locally that Expo Go or a development build will run. To make sure our project starts with Expo's modern manifest protocol, start your local server with:

```bash
yarn start --force-manifest-type=expo-updates
```

Then, make any desired changes to your project's JavaScript, styling, or image assets.

## Publish an update

Now we're ready to publish an update to the build created in the previous step.

Then publish an update with the following command:

```bash
eas update --branch [branch] --message [message]

# Example
eas update --branch preview --message "Updating the app"
```

Once the update is built and uploaded to EAS and the command completes, force close and reopen your app up to two times to download and view the update.

## Next

You can publish updates continuously with GitHub Actions. Learn more: [Using GitHub Actions with EAS Update](/preview/eas-update/github-actions)
