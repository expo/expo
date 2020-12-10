---
title: Release Channels
---

## Introduction

Use release channels in Expo to send out different versions of your application to your users by giving them a URL or configuring your standalone app. You should use release channels if:

- You have an app in production and need a testing environment.
- You have multiple versions of your app.

## Publish with Channels

Publish your release by running:

`expo publish --release-channel <your-channel>`

with the Expo CLI. Your users can see this release in the Expo client app with a parameterized URL `https://exp.host/@username/yourApp?release-channel=<your-channel>`. If you do not specify a channel, you will publish to the `default` channel.

## Build with Channels

Build your standalone app by running

`expo build:ios --release-channel <your-channel>`

`expo build:android --release-channel <your-channel>`

with the Expo CLI. The binary produced will only pull releases published under the specified channel. If you do not specify a channel, your binary will pull releases from the `default` channel.

## Access Channel from Code

You can access the channel your release is published under with the `releaseChannel` field in the [manifest object](/versions/latest/sdk/constants/#expoconstantsmanifest).

> `Constants.manifest.releaseChannel` does NOT exist in dev mode. It does exist, however when you explicitly publish / build with it.

## Example Workflow

Consider a situation where you have a Staging stack for testing on Expo client, and a Production stack for pushing through TestFlight, then promoting to the AppStore.

On the staging stack, run `expo publish --release-channel staging`. Your test users can see the staging version of your app by specifying the channel in the query parameter of the URL (ie)`https://exp.host/@username/yourApp?release-channel=staging`, then opening the URL in their web browser, and finally scanning the QR code with the Expo client. Alternatively, they can open that URL directly on their mobile device.

On the production stack, release v1 of your app by running `expo publish --release-channel prod-v1`. You can build this version of your app into a standalone ipa by running `expo build:ios --release-channel prod-v1`. You can push updates to your app by publishing to the `prod-v1` channel. The standalone app will update with the most recent compatible version of your app on the `prod-v1` channel.

If you have a new version that you dont want v1 users getting, release v2 of your app by running `expo publish --release-channel prod-v2` and building it with `expo build:ios --release-channel prod-v2`. Users with the `prod-v2` ipa will only be pulling releases from that channel.

You can continue updating v1 of your app with `expo publish --release-channel prod-v1`, and users who havent updated to the latest `prod-v2` ipa in the Apple App Store will continue receiving the latest `prod-v1` releases.

## Using Release Channels in the bare workflow

Since `expo build` does not apply to bare projects (yet), you can edit the native project's release channel manually by modifying the `EXUpdatesReleaseChannel` key in `Expo.plist` (iOS) or the `releaseChannel` meta-data tag value in `AndroidManifest.xml` (Android).

## Using Release Channels for Environment Variable Configuration

Environment variables don't exist explicitly, but you can utilize release channels to make that happen!

Say you have a workflow of releasing builds like this:

- `expo publish --release-channel prod-v1`
- `expo publish --release-channel prod-v2`
- `expo publish --release-channel prod-v3`

- `expo publish --release-channel staging-v1`
- `expo publish --release-channel staging-v2`

You can create a function that looks for the specific release and adjust your app's behaviour accordingly:

```javascript
import Constants from 'expo-constants';

function getEnvironment() {
  let releaseChannel = Constants.manifest.releaseChannel;

  if (releaseChannel === undefined) {
    // no releaseChannel (is undefined) in dev
    return { envName: 'DEVELOPMENT', dbUrl: 'aaa', apiKey: 'bbb' }; // dev env settings
  }
  if (releaseChannel.indexOf('prod') !== -1) {
    // matches prod-v1, prod-v2, prod-v3
    return { envName: 'PRODUCTION', dbUrl: 'ccc', apiKey: 'ddd' }; // prod env settings
  }
  if (releaseChannel.indexOf('staging') !== -1) {
    // matches staging-v1, staging-v2
    return { envName: 'STAGING', dbUrl: 'eee', apiKey: 'fff' }; // stage env settings
  }
}
```
