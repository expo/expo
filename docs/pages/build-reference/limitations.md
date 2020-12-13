---
title: Limitations
---

EAS Build is currently in preview and is missing features that will be available before graduating to a stable release. Some of these missing features could prevent you from being able to use the service for your applications, and others might just be inconveniences.

> 👉 **We will keep updating this list as we progress throughout preview and the limitations change. All of the limitations are planned to be resolved prior to the stable release in 2021.**

## Current limitations

<details><summary><h4>Managed Expo project support is early, not recommended for production.</h4></summary>
<p>

EAS Build supports building iOS/Android native projects, so it works with any React Native app. It also supports managed Expo projects, but work still needs to be done in order to make it as solid as `expo build`. We encourage you to experiment with your Expo managed app on EAS Build and report issues, but we suggest holding off on using it for production managed app deployments for now.

</p>
</details>

<details><summary><h4>Only single target iOS apps are supported.</h4></summary>
<p>

There are many cases where your iOS might have multiple targets, and each target has its own bundle identifier and provisioning profile. Support for this is planned but not currently available.

</p>
</details>

<details><summary><h4>Limited dependency caching.</h4></summary>
<p>

Build jobs on Android install npm and Maven dependencies from a local cache, but there is no caching of npm or CocoaPods packages on iOS yet.

Intermediate artifacts like `node_modules` directories are not cached and restored (eg: based on `yarn.lock` or `package-lock.json`), but if you commit them to your git repository then they will be uploaded to build servers.

[Learn more about dependendy caching](./caching.md).

</p>
</details>

<details><summary><h4>Limited customizability of the software runtime environment.</h4></summary>
<p>

All build jobs run with the same version of Node, npm, Yarn, Xcode, Ruby, Fastlane, and so on (these versions are documented in the [build server infrastructure](./infrastructure.md) reference).

Most of these will become customizable in the near future, but they are not yet.

</p>
</details>

<details id="environment-variables"><summary><h4>Setting environment variables is not supported.</h4></summary>
<p>

In the future there will be support for securely storing secrets and other values that are usually made available through environment variables in CI environments. For the moment, please refer to the ["Environment variables and secrets"](variables.md) reference to learn how you can work around this.

</p>
</details>

## Get notified about changes

To be notified as progress is made on these items, you can subscribe to the newsletter on the [Feature Preview page](https://expo.io/eas).

<!-- <details><summary><h4>Builds timeout after ___ minutes</h4></summary>
<p>

If your build takes longer than ___ to run, it will be cancelled. It will be possible in the future to increase this limit.

</p>
</details> -->