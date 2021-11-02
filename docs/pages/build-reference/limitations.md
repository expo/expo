---
title: Limitations
---

EAS Build is a new service and we plan to address many of the currnet limitations in time. Some of these missing features could prevent you from being able to use the service for your applications, and others might just be inconveniences.

## Current limitations

<details><summary><h4>Fixed memory and CPU limits on build worker servers.</h4></summary>
<p>

The ["Server infrastructure" reference](../server-infrastructure.md) contains the most up-to-date information about the current specifications of the Android (Ubuntu) and iOS  (macOS) build servers. You may find that the resources available are not sufficient to build your app if your build process requires more than 12GB RAM. In the future we will be adding more powerful configurations to increase memory limits and speed up build times.

</p>
</details>

<details><summary><h4>Limited dependency caching.</h4></summary>
<p>

Build jobs for Android install npm and Maven dependencies from a local cache. Build jobs for iOS install npm dependencies from a local cache, but there is no caching for CocoaPods yet.

Intermediate artifacts like `node_modules` directories are not cached and restored (eg: based on `yarn.lock` or `package-lock.json`), but if you commit them to your git repository then they will be uploaded to build servers.

[Learn more about dependendy caching](./caching.md).

</p>
</details>

<details><summary><h4>Maximum build duration of 2 hours.</h4></summary>
<p>

If your build takes longer than 2 hours to run, it will be cancelled. This limit is lower on the free plan, and is limit is subject to change in the future.

</p>
</details>

<details><summary><h4>Yarn Workspaces is recommended for monorepos; official guidance for others is limited.</h4></summary>
<p>

While you likely can have success using other monorepo tools like Nx if you are willing to dig in and understand the tooling and get your hands dirty, the Expo team will be unable to provide support and guidance on those tools. We recommend using [Yarn Workspaces](https://yarnpkg.com/en/docs/workspaces) because it is the only monorepo tool that we provide first-class integration with at the moment.

</p>
</details>

<details><summary><h4>Managed workflow projects on SDK 40 and below are not supported.</h4></summary>
<p>

EAS Build supports building iOS/Android native projects, so it works with any React Native app. Support for [Managed Expo projects](/introduction/managed-vs-bare.md) is only available for SDK 41 and higher. **For best results, we recommend using the latest SDK version**, or at least SDK 43.

The goal for managed projects with EAS Build is to remove the limitations commonly encountered with the classic build service (`expo build`): it will produce smaller binaries by only including the dependencies you need, and you will be able to include custom native code.

</p>
</details>

## Get notified about changes

To be notified as progress is made on these items, you can subscribe to the changelog on [expo.dev/eas](https://expo.dev/eas).

<br />

