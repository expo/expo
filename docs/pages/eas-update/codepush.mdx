---
title: Migrate from CodePush
description: A guide to help migrate from CodePush to EAS Update.
---

import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';

This guide explains how to transition a React Native project that uses CodePush to use EAS Update which offers [many advantages](/eas-update/introduction/#pitch). It assumes that you're using the default React Native project structure. For assistance with migrating brownfield native apps to EAS Update, [reach out to us directly](https://expo.dev/contact).

To learn more about the differences between CodePush and EAS Update, see [Conceptual differences between CodePush and EAS Update](#conceptual-differences-between-codepush-and-eas-update) and the [What to do without CodePush post on the Expo Blog](https://expo.dev/blog/what-to-do-without-codepush).

<Step label="1">
## Uninstall CodePush

To avoid conflicts and unexpected behavior, it's recommended to uninstall CodePush if you're using EAS Update. This is because your app could periodically fetch updates from both services, leading to issues, especially if you're using different configurations for each service.

Remove the CodePush SDK from your project by uninstalling the `react-native-code-push` package:

<Terminal cmd={['$ npm uninstall react-native-code-push']} />

You'll also need to remove CodePush references from JS and native code. See this [GitHub comment](https://github.com/Microsoft/react-native-code-push/issues/1101#issuecomment-350204507) for more detailed instructions.

</Step>

<Step label="2">
## Add an `expo` key to your `app.json`

Ensure that your project has an **app.json** file with an `expo` object. If you don't have anything specific to configure in your **app.json** file yet, you can create a minimal file with an empty `expo` object like this:

```json app.json
{
  "expo": {
    //... any other existing keys you have
  }
}
```

</Step>

<Step label="3">
## Follow the "Getting Started" guide

The instructions in the [EAS Update Getting Started guide](/eas-update/getting-started/) will guide you through setting up EAS Update in your project.

</Step>

<Step label="4">
## Resubmit your app

Since you have changed the update provider from CodePush to EAS Update, you will need to rebuild your app and submit the new build to the respective app stores (Google Play Store and Apple App Store) to ensure the update mechanism works as expected for your end-users.

Please follow the respective store guidelines for submitting a new build of your application:

- [Submitting to Apple App Store](/submit/ios)
- [Submitting to Google Play Store](/submit/android)

After successfully submitting your app, users will be able to download and use the latest build with EAS Update integration. If your app is not updating as expected, [validate your configuration](/eas-update/debug).

</Step>

## Conceptual differences between CodePush and EAS Update

CodePush and EAS Update are both services that allow you to send hotfixes to the JavaScript code of your app, but they take slightly different approaches, and so you may need to adapt your release process when moving to EAS Update.

<Collapsible summary="Differences in how updates are organized within streams">

**CodePush has single streams of updates for deployments**. What this means is that you can point a build to a deployment, and it will pull updates from that. If you want to change the deployment that is targeted by a build, you can do this at runtime through a JavaScript API.

**EAS Update has multiple streams of updates** — one that correspond to your source control branches (called branches), and another called channels, which point to branches. The mapping between channels and branches is handled on the server side, and a channel can point to different branches for each runtime version (additionally, more advanced logic may be expressed, such as to support incremental rollouts). Builds are not directly associated with branches, but rather with channels. Each build points to a single channel, which is set at build time and cannot be modified at runtime. The reason for this is that it ensures that certain branches (eg: development, staging) don't automatically go out to production -- your preview updates don't go to your production users. This helps you separate the two main uses of EAS Update: previews and production hotfixes.

</Collapsible>

<Collapsible summary="Differences in how updates are selected at runtime">

A key distinction between CodePush and EAS Update that can impact your release process is that **with CodePush, the client controls the target update deployment at runtime**, and **with EAS Update, it is controlled on the server side, by mapping channels to branches**. This means that you can't include code in your app using EAS Update to instruct it to load a different stream of updates depending on runtime criteria, such as the current user role (eg: distribute beta releases to employees) - it will only load the branch that is mapped on EAS Update servers to the corresponding channel (such as production or staging).

The ability to control the target deployment at runtime is commonly used with CodePush in staging environments to allow non-technical stakeholders to test features from a single build on Google Play Beta / TestFlight. The current alternative for this with EAS Update is to use [development builds](/eas-update/expo-dev-client/). We're currently working on providing a way to do this with release builds.

</Collapsible>
