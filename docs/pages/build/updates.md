---
title: Using EAS Update
---

EAS Build includes some special affordances for Expo's [`expo-updates`](/versions/latest/sdk/updates.md) library. In particular, you can configure the `channel` property in **eas.json** and EAS Build will take care of updating it in your native project at build time. Not sure what a channel is? [Learn more about channels](/eas-update/how-eas-update-works/#distributing-builds). This document covers concerns specific to using `expo-updates` with EAS Build; for more general information about configuring the expo-updates library with EAS Update, refer to the [EAS Update getting started doc](/eas-update/getting-started).

## Setting the channel for a build profile

Each [build profile](./eas-json.md#build-profiles) can be assigned to a channel, so updates for builds produced for a given profile will pull only those releases that are published to its channel.

The following example demonstrates how you might use the `"production"` channel for production builds, and the `"staging"` channel for test builds distributed with [internal distribution](internal-distribution.md).

```json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "staging",
      "distribution": "internal"
    }
  }
}
```

## Binary compatibility and runtime versions

Your native runtime may change on each build, depending on whether you modify the code in a way that changes the API contract with JavaScript. If you publish a JavaScript bundle to a binary with an incompatible native runtime (for example, a function that the JavaScript bundle expects to exist does not exist) then your app may not work as expected or it may crash.

We recommend using a different [runtime version](/distribution/runtime-versions.md) for each binary version of your app. Any time you change the native runtime (in managed apps, this happens when you add or remove a native library, or modify **app.json**), you should increment the runtime version.

## Previewing updates in development builds

Updates published with the `runtimeVersion` field can't be loaded in Expo Go; instead, you should use [expo-dev-client](/clients/introduction.md) to create a development build.

## Environment variables and `eas update`

Environment variables set on the `env` field in build profiles are not available when you run `eas update`. Learn more about using [environment variables with EAS Update](/eas-update/environment-variables).
