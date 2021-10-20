---
title: Getting started with EAS Update
---

Setting up EAS Update allows you to push critical bug fixes and improvements that your users need right away. Setting update EAS Update requires:

- Installing EXPO CLI and EAS CLI
- Creating an Expo account
- Creating a project
- Configuring your project's app config
- Configuring `expo-updates`
- Creating a build for the project
- Publishing an update

## Installing Expo CLI and EAS CLI

1. Install `expo-cli` and `eas-cli` globally:

   ```bash
   npm install --global eas-cli expo-cli
   ```

## Create an Expo account

1. Create an account at [https://expo.dev/signup](https://expo.dev/signup)
2. Then, log in with EAS CLI:

   ```bash
   eas login
   ```

3. After logging in, you can verify the logged in account with `eas whoami`.

## Create a project

1. Create a project by running:

   ```bash
   expo init
   ```

2. Select "Managed workflow > blank".

## Configuring your project's app config

1. We'll need to register our app with EAS and add our project's ID to **app.json**. Run:

   ```bash
   eas init
   ```

   This command will add a field with your project's `projectId` in **app.json**. Copy this ID for the next step.

2. Next, in **app.json**, add an `expo.updates.url` property with the following URL, replacing the `your-project-id` with the `projectId` added in the previous step.

   ```json
   {
     "expo": {
       "updates": {
         "url": "https://u.expo.dev/your-project-id"
       }
     }
   }
   ```

   There is also a `fallbackToCacheTimeout` property. If you'd like your app to try to load new updates when a user opens the app, set this to something other than zero, like `3000` (3 seconds). A value of `3000` would mean that your app will try and download a new update for up to 3 seconds before loading the previous update it already has locally. If the app is able to download the update within 3 seconds, your users will see the changes in the newest update immediately.

3. Next, set an `expo.runtimeVersion` property in the project's **app.json** file. Let's use `"1.0.0"` as the runtime version's value:

   ```json
   {
     "expo": {
       "runtimeVersion": "1.0.0",
       ...
     }
   }
   ```

   A runtime version identifies the state of the native code present in your project when creating builds and when creating updates. When we make a build later, we'll add the runtime version to the build's native files. Then, the `expo-updates` module inside the build will make sure that any updates it loads match the runtime version of an update when a user tries to load an update. If the build's runtime version matches the update's runtime version, we'll know that the update is compatible with the build, and then the build will run the update.

   Whenever we change native code, we'll need to change the runtime version and create new builds. This way, updates we publish will also target the new state of the build's native code.

4. To set up the configuration file for builds, run:

   ```bash
   eas build:configure
   ```

   Then follow the prompts.

   This will create a file named **eas.json**. Inside the `production` profile, add the `channel` property with a value of `"production"`:

   ```bash
   {
     "build": {
        "production": {
          "channel": "production"
        },
       ...
     }
   }
   ```

   This `channel` property will allow you to point updates at builds with this channel. Later, if you set up a GitHub Action to publish changes on merge, it will make it so we can merge code into the "production" branch, then those commits will be published and made available to builds with the channel "production".

5. Finally, we need to create a `channel` and `branch` both named "production" on EAS' servers. We can accomplish the creation of these with this command:

   ```xml
   eas channel:create production
   ```

## Configuring `expo-updates`

> ⚠️ These steps are only required temporarily. These changes will be included in SDK 43 (end of Sept 2021).

To successfully load updates, we'll need the latest versions of the `expo-asset` and `expo-updates` packages from [the Expo repository](https://github.com/expo/expo). You can download these libraries below and drag them into the parent folder of your project:

[expo-asset-8.3.3.tgz](https://drive.google.com/file/d/1nXEO62-sVz_LRSyitW9EK3Chg8w7TUat)

[expo-updates-0.8.4.tgz](https://drive.google.com/file/d/170WIMgFE7tzL362xFd3r9pfmSQNW6M2c)

When you download these files, they may have the **.tar** extension. Change it back to **.tgz**.

Once those two files are in your project, run:

```json
npm install *.tgz
```

After running this command, inside **package.json**, you should see:

```json
"expo-asset": "file:expo-asset-8.3.3.tgz",
...
"expo-updates": "file:expo-updates-0.8.4.tgz",
```

## Creating a build for the project

Next, we'll need to create a build for Android or iOS. [Learn more](/build/setup).

## Publishing an update

Now we're ready to publish an update to the builds created in the previous step.

1. Make any desired changes to your project.
2. Then publish an update with the following command:

   ```bash
   eas branch:publish production --message "Updating the app"
   ```

3. Once the update is built and uploaded to EAS and the command completes, force close and reopen your app two times to download and view the update.

## Next

You can publish updates continuously with GitHub Actions. Learn more: [Using GitHub Actions with EAS Update](/preview/eas-update/github-actions)
