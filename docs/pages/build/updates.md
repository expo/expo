---
title: Updates
---

> We're currently working on EAS Update, a service that integrates deeply with other EAS services and builds on top of `expo-updates` to provide more power, flexibility, and tools to help you work better with your team.

EAS Build includes some special affordances for Expo's [`expo-updates`](/versions/latest/sdk/updates.md) library. In particular, you can configure the release channel in **eas.json** and EAS Build will take care of updating it in your native project at build time. Not sure what a release channel is? [Learn more about release channels](/distribution/release-channels.md).

## Setting the release channel for a build profile

Each [build profile](./eas-json.md#build-profiles) can be assigned to a release channel, so updates for builds produced for a given profile will pull only those releases that are published to its release channel. If a release channel is not specified, the value will be `"default"`.

The following example demonstrates how you might use the `"production"` release channel for production builds, and the `"staging"` release channel for test builds distributed with [internal distribution](internal-distribution.md).

```json
{
  "build": {
    "production": {
      "releaseChannel": "production"
    },
    "team": {
      "releaseChannel": "staging",
      "distribution": "internal"
    }
  }
}
```

## Binary compatibility and other usage concerns

Your native runtime may change on each build, depending on whether you modify the code in a way that changes the API contract with JavaScript. If you publish a JavaScript bundle to a binary with an incompatible native runtime (for example, a function that the JavaScript bundle expects to exist does not exist) then your app may not work as expected or it may crash.

We recommend using a different [runtime version](/distribution/runtime-versions.md) for each binary version of your app. Any time you change the native runtime (in managed apps, this happens if when you add or remove a native library, or modify app.json), you should increment the runtime version.
