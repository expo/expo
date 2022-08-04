---
title: Release channels
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';
import { Terminal } from '~/ui/components/Snippet';

> This doc was archived in August 2022 and will not receive any further updates. Please use EAS Update instead. [Learn more](/eas-update/introduction)

## Introduction

Use release channels in Expo to send out different versions of your application to your users by giving them a URL or configuring your standalone app. You should use release channels if:

- You have an app in production and need a testing environment.
- You have multiple versions of your app.

## Publish with release channels

Publish your update on a release channel by running:

<Terminal cmd={[
'# Publish to release channel <your-channel>',
'$ expo publish --release-channel <your-channel>'
]} />

Your team can see this release channel in the Expo Go app with a parameterized URL `https://exp.host/@username/yourApp?release-channel=<your-release-channel>`. If you do not specify a release channel, you will publish to the `default` channel.

A release channel name can only contain lowercase letters, numbers and special characters `.`, `_` and `-`.

## Build with release channels

Set your release channel in the build profile in **eas.json**:

```json
{
  "build": {
    "your-build-profile": {
      "releaseChannel": "your-channel"
    }
  }
}
```

Then, build your standalone app by running `eas build --profile <your-build-profile>` with the EAS CLI. The binary produced will only pull releases published under the specified release channel. If you do not specify a release channel, your binary will pull releases from the `default` release channel.

<ConfigClassic>

Build your standalone app by running

`expo build:ios --release-channel <your-channel>`

`expo build:android --release-channel <your-channel>`

with the Expo CLI. The binary produced will only pull releases published under the specified release channel. If you do not specify a release channel, your binary will pull releases from the `default` release channel.

</ConfigClassic>

## Access Channel from Code

You can access the release channel your update is published under with the `Updates.releaseChannel` field from [expo-updates](/versions/latest/sdk/updates.md).

> In development in Expo Go, `Updates.releaseChannel` is always `'default'`.

## Example Workflow

Consider a situation where you have a Staging stack for testing on Expo Go, and a Production stack for pushing through TestFlight, then promoting to the App Store.

On the staging stack, run `expo publish --release-channel staging`. Your test users can see the staging version of your app by specifying the release channel in the query parameter of the URL (ie)`https://exp.host/@username/yourApp?release-channel=staging`, then opening the URL in their web browser, and finally scanning the QR code with the Expo Go app. Alternatively, they can open that URL directly on their mobile device.

On the production stack, release v1 of your app by running `expo publish --release-channel prod-v1`. You can build this version of your app into a standalone ipa by running `eas build --platform ios --profile prod` with `releaseChannel` set to `prod-v1` in the `prod` build profile in **eas.json**:

```json
{
  "build": {
    "prod": {
      "releaseChannel": "prod-v1"
    },
    "staging": {
      "releaseChannel": "staging"
    }
  }
}
```

You can push updates to your app by publishing to the `prod-v1` release channel. The standalone app will update with the most recent compatible version of your app on the `prod-v1` release channel.

If you have a new version that you don't want v1 users getting, release v2 of your app by running `expo publish --release-channel prod-v2`, setting the `releaseChannel` in your `prod` build profile to `prod-v2`, and building again with `eas build --platform ios --profile prod`. Only users with the `prod-v2` ipa will pull releases from that release channel.

<ConfigClassic>

On the production stack, release v1 of your app by running `expo publish --release-channel prod-v1`. You can build this version of your app into a standalone ipa by running `expo build:ios --release-channel prod-v1`. You can push updates to your app by publishing to the `prod-v1` release channel. The standalone app will update with the most recent compatible version of your app on the `prod-v1` release channel.

If you have a new version that you don't want v1 users getting, release v2 of your app by running `expo publish --release-channel prod-v2` and building it with `expo build:ios --release-channel prod-v2`. Users with the `prod-v2` ipa will only be pulling releases from that release channel.

</ConfigClassic>

You can continue updating v1 of your app with `expo publish --release-channel prod-v1`, and users who haven't updated to the latest `prod-v2` ipa in the Apple App Store will continue receiving the latest `prod-v1` releases.

## Using release channels in the bare workflow

You can edit the native project's release channel by modifying the `EXUpdatesReleaseChannel` key in **Expo.plist** (iOS) or the `releaseChannel` meta-data tag value in **AndroidManifest.xml** (Android). [Read this guide](./updating-your-app) for more information on configuring updates in a bare app.

## Using release channels for Environment Variable Configuration

Environment variables don't exist explicitly, but you can utilize release channels to make that happen!

Say you have a workflow of releasing builds like this:

<Terminal cmd={[
'# Publish to release channel prod-v1',
'expo publish --release-channel prod-v1',
'',
'# Publish to release channel prod-v2',
'expo publish --release-channel prod-v2',
'',
'# Publish to release channel prod-v3',
'expo publish --release-channel prod-v3',
'',
'',
'# Publish to release channel staging-v1',
'expo publish --release-channel staging-v1',
'',
'# Publish to release channel staging-v2',
'expo publish --release-channel staging-v2'
]} />

You can create a function that looks for the specific release and adjust your app's behaviour accordingly:

```js
import * as Updates from 'expo-updates';

function getEnvironment() {
  if (Updates.releaseChannel.startsWith('prod')) {
    // matches prod-v1, prod-v2, prod-v3
    return { envName: 'PRODUCTION', dbUrl: 'ccc', apiKey: 'ddd' }; // prod env settings
  } else if (Updates.releaseChannel.startsWith('staging')) {
    // matches staging-v1, staging-v2
    return { envName: 'STAGING', dbUrl: 'eee', apiKey: 'fff' }; // stage env settings
  } else {
    // assume any other release channel is development
    return { envName: 'DEVELOPMENT', dbUrl: 'aaa', apiKey: 'bbb' }; // dev env settings
  }
}
```
