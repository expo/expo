---
title: Migrating from Classic Updates to EAS Update
---

EAS Update is the next generation of Expo's updates service. If you're using Classic Updates, this guide will help you upgrade to EAS Update.

## Install EAS CLI

1. Install EAS CLI with:

   ```bash
   npm install --global eas-cli
   ```

2. Then, log in with your expo account:

   ```bash
   eas login
   ```

## Configure your project

You'll need to make the following changes to your project:

1. Install the latest `expo-updates` library with:

   ```bash
   expo install expo-updates
   ```

2. Initialize your project with EAS Update:

   ```bash
   eas update:configure
   ```

After this command, you should have a new field in your app config (**app.json**/**app.config.js**) at `expo.updates.url`, which is the URL where your app will fetch new updates.

3. To ensure that updates are compatible with the underlying native code inside a build, EAS Update uses a new field named `runtimeVersion` that replaces the `sdkVersion` field in your project's app config (**app.json**/**app.config.js**).

- Remove the `expo.sdkVersion` property, then add a `expo.runtimeVersion` property with the value `{ "policy": "sdkVersion" }`.

  ```jsx
  {
    "expo": {
      ~~"sdkVersion": "44.0.0",~~
      "runtimeVersion": {
        "policy": "sdkVersion"
      }
  }
  ```

4. To allow updates to apply to builds built with EAS, update your EAS config (**eas.json**) to have channel names. We find it convenient to name the `channel` after the profile's name. For instance, the `preview` profile has a `channel` named `"preview"`.

   ```json
   {
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "channel": "development"
       },
       "preview": {
         "distribution": "internal",
         "channel": "preview"
       },
       "production": {
         "channel": "production"
       }
     }
   }
   ```

   > Tip: if you don't have an **eas.json** file, you can generate it with `eas build:configure`.

## Create new builds

The changes above affect the native code layer inside builds, which means we'll need to make new builds. Once your builds are complete, we'll be ready to develop an update and publish it.

## Developing locally

EAS Update uses a [modern manifest format](/technical-specs/expo-updates-0). When developing locally, Expo CLI can serve the modern manifest format to Expo Go or a development build. This will ensure that the code you develop locally will work as an update when published later. You can start a local development session with the modern manifest with:

```bash
yarn start --force-manifest-type=expo-updates
```

## Publishing an update

To publish an update, run:

```bash
eas branch:publish [branch-name] --message [message]

# example
eas branch:publish production --message "Fixes typo"
```

EAS Update adds a new type of object called a "branch". A branch is a list of updates, and it is linked to a channel. In the diagram below, builds with a channel of "production" are linked to a branch named "production". By default, channels and branches of the same name are linked until changed.

<ImageSpotlight alt="Two command deployment diagram" src="/static/images/eas-update/channel-branch.png" style={{maxWidth: 1200}} />

## Additional possible migration steps

- If you have any scripts that run `expo publish`, you can replace those with `eas branch:publish`. You can view all the options for publishing with `eas branch:publish --help`
- If you have any code that references `Updates.releaseChannel` from the expo-updates library, you'll have to remove those. Currently, EAS Update does not expose the `channel` of a build. Instead, you can use [environment variables](/build-reference/variables).
- Remove any code that references `Constants.manifest`. That will now always return `null`.

## Known issues

EAS Update is currently in "preview", meaning that we may make major changes to developer-facing workflows. There are also a variety of [known issues](/eas-update/known-issues), which you should consider before using EAS Update with your project.

## Next steps

EAS Update is built to be faster and more powerful than ever before. We can't wait to hear what you think. Try setting up EAS Update to publish on pushing to GitHub with a [GitHub Action](/eas-update/github-actions). Also check out the new sets of [deployment patterns](/eas-update/deployment-patterns) enabled by EAS Update.

If you run into issues or have feedback, join us on [Discord](https://chat.expo.dev/) in the #eas channel.
