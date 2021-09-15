---
title: Limitations
---

EAS Build is currently in preview and is missing features that will be available before graduating to a stable release. Some of these missing features could prevent you from being able to use the service for your applications, and others might just be inconveniences.

> 👉 **We will keep updating this list as we progress throughout preview and the limitations change. All of the limitations are planned to be resolved prior to the stable release in 2021.**

## Current limitations

<details><summary><h4>Managed workflow projects on SDK 40 and below are not supported.</h4></summary>
<p>

EAS Build supports building iOS/Android native projects, so it works with any React Native app. Support for [Managed Expo projects](/introduction/managed-vs-bare.md) is only available for SDK 41 and higher.

The goal for managed projects with EAS Build is to remove the limitations commonly encountered with the `expo build` service: it will produce smaller binaries by only including the dependencies you need, and you will be able to include custom native code.

</p>
</details>

<details><summary><h4>Limited dependency caching.</h4></summary>
<p>

Build jobs for Android install npm and Maven dependencies from a local cache. Build jobs for iOS install npm dependencies from a local cache, but there is no caching for CocoaPods yet.

Intermediate artifacts like `node_modules` directories are not cached and restored (eg: based on `yarn.lock` or `package-lock.json`), but if you commit them to your git repository then they will be uploaded to build servers.

[Learn more about dependendy caching](./caching.md).

</p>
</details>

<details><summary><h4>Maximum build duration of 60 minutes.</h4></summary>
<p>

If your build takes longer than 60 minutes to run, it will be cancelled. This limit is subject to change in the future, and it will be possible to increase it if needed.

</p>
</details>

## Get notified about changes

To be notified as progress is made on these items, you can subscribe to the changelog on the ["Feature Preview"](https://expo.dev/eas) page.
