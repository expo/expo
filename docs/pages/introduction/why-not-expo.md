---
title: Limitations
sidebar_title: Limitations
---

import { InlineCode } from '~/components/base/code';

Your success will be limited if you don't know the limitations of your tools. A good software engineer strives to understand the tradeoffs in the decisions they make.

<details><summary><h4>Used Expo before? Here are some recent changes to the managed workflow you should be aware of...</h4></summary> <p>

With the release of Expo Application Services, the managed workflow has far fewer limitations, and can be used for any project no matter the complexity:

- All libraries available to React Native apps are available to Expo managed workflow apps built with [EAS Build](/build/setup.md), but _some_ may require a [Prebuild Config Plugin](/guides/config-plugins/) to be added. The addition of config plugins means:
  - Any 3rd party push notification service can support managed workflow apps.
  - Native libraries that integrate with proprietary services can support managed workflow apps.
- Apps built with EAS Build can be as small as you want, since the entire Expo SDK is no longer bundled in by default.
- Apps built with EAS Build can target children under 13 years old

These changes mean Expo can fit many more use cases than before.

</p>
</details>

## Limitations of Expo Go and the classic `expo build` system

If you're still using `expo build:ios` or `expo build:android`, or using Expo Go for development, it's important to be aware of the limitations that come with those features.

> If you'd like to continue getting the same development experience that you have with Expo Go, but also use custom native libraries or custom native code, you should check out the [Expo Dev Client](/clients/introduction.md)!

Expo Go comes with a pre-configured set of libraries, known as the Expo SDK. This makes development much faster, and essentially makes the mobile development experience much closer to the web development experience. However, additional native code cannot be added to Expo Go on the fly, so this means you are limited in terms of what dependencies you can add. This also applies to apps built with `expo build:android` and `expo build:ios`.

<details><summary><h4>Not all iOS and Android APIs are available</h4></summary> <p>

Many device APIs are supported (check out the "SDK API Reference" in the sidebar), but **not all iOS and Android APIs are available yet**. We are constantly adding new APIs, so if we don't have something you need now, you can either use [EAS Build](/build/setup.md), the [bare workflow](managed-vs-bare.md#bare-workflow), or follow [our blog](https://blog.expo.dev) to see the release notes for our SDK updates. Feature prioritization isn't strictly based off of popular vote, but it certainly helps us to gauge what is important to users.

</p>
</details>

<details><summary><h4>If you need to keep your app size extremely lean, <InlineCode>expo build:[android|ios]</InlineCode> may not be the best choice</h4></summary>
<p>

The size for an app built with `expo build` on iOS is approximately 20mb (download), and Android is about 15mb. This is because a bunch of APIs are included regardless of whether or not you are using them &mdash; this lets you publish updates that use new APIs, but comes at the cost of binary size. Some of the APIs that are included are tied to services that you may not be using, for example the Facebook Mobile SDK is included to support Facebook Login and Facebook Ads, along with the Google Mobile SDK for similar reasons. [Read more about managing your app size here](https://expo.fyi/managed-app-size).

If you'd like a smaller app size, you should use [EAS Build](/build/setup.md).

</p>
</details>

<details><summary><h4>Native libraries to integrate with proprietary services are usually not included in the SDK</h4></summary>
<p>

Related to the previous point, we typically avoid adding native modules to the SDK if they are tied to external, proprietary services &mdash; we can't add something to the SDK just because a few users need it for their app, we have to think of the broader userbase. In these cases developers will want to use [EAS Build](/build/setup.md), or the [bare workflow](../introduction/managed-vs-bare.md).

</p>
</details>

<details><summary><h4>The only supported third-party push notification service is the Expo notification service</h4></summary>
<p>

If you want to use another third-party push notification service, such as OneSignal, instead of the [Expo Push Notification service/API](../push-notifications/overview.md), you will need to use [EAS Build](/build/setup.md).

Note that you can use the first-party push APIs (APNs and FCM) directly if you like. [Read "Sending Notifications with APNs & FCM"](/push-notifications/sending-notifications-custom.md)

</p>
</details>

<details><summary><h4>The minimum supported OS versions are Android 5+ and iOS 10+</h4></summary>
<p>

If you need to support older versions, you will not be able to use `expo build:ios` or `expo build:android`.

</p>
</details>

<details><summary><h4>Free builds can sometimes be queued</h4></summary>
<p>

You can easily build your app for submission to stores without even installing Xcode or Android Studio by using the free [standalone build service](../distribution/building-standalone-apps.md), but it occasionally has a queue depending on how many other folks are building a binary at that time. You can have access to dedicated build infrastructure with a ["Priority" plan](https://expo.dev/developer-services), or you can [run the builds on your own CI](../distribution/turtle-cli.md) if you prefer.

</p>
</details>

<details><summary><h4>Updates (JS and assets) for updates and builds are size-limited</h4></summary>
<p>

Expo's current update service supports updates around 50 MiB. Updates are published both for updates and to build standalone apps, which embed updates. See more about [optimizing updates](../distribution/optimizing-updates.md).

You also can use the [bare workflow](../bare/exploring-bare-workflow.md) with the [`expo-updates`](../versions/latest/sdk/updates.md) library, which supports arbitrarily large updates that are self-hosted or embedded in apps compiled on your own computer.

</p>
</details>

<details><summary><h4>Your app cannot target only children under 13 years old without customizing native dependencies</h4></summary>
<p>

Both [Apple](https://developer.apple.com/app-store/review/guidelines/#kids) and [Google](https://support.google.com/googleplay/android-developer/answer/9285070?hl=en) provide strict guidelines for any apps that specifically target children under a particular age. One of these guidelines states that certain ad libraries, such as Facebook's Audience Network, cannot be used in the app.

Apps built with `expo build:ios|android` [contain code for the entire Expo SDK](https://expo.fyi/managed-app-size), you cannot customize the native dependencies, including Facebook's Audience Network library, so if you build your app this way you cannot designated it as "designed primarily for children under 13" in the App Store or Play Store, _even though this code is never run unless you explicitly call it_.

Apps built with `eas build -p ios|android` [include only your app's explicit native dependencies](https://blog.expo.dev/expo-managed-workflow-in-2021-d1c9b68aa10), and so this limitation does not apply if you use EAS Build. [Learn about how to use it](https://docs.expo.dev/build/introduction/).

</p>
</details>

<br />

> 👉 We are either actively working on or planning to build solutions to all of the limitations listed above, and if you think anything is missing, please bring it to our attention by posting to our [feature requests board](https://expo.canny.io/feature-requests) or the [forums](https://forums.expo.dev/).

## Limitations of the bare workflow

In the bare workflow we have full access to the underlying native projects and any native code. It's a "bare" native project with React Native and one or more packages from the Expo SDK installed. Anything that you can do in a native project is possible here.

The following list is therefore specifically oriented towards to the limitations that exist around using Expo tools and services in the bare workflow.

<details><summary><h4><span className="strike">Build service only works in the managed workflow</span> (✅ Resolved in December 2020)</h4></summary>
<p>

<span className="strike">To build your app binaries for distribution on the Apple App Store and Google Play Store you will need to follow the same steps that you would in any native project, the Expo build service can't handle it for you. We are working on bringing bare workflow support to the build service in the near future.</span>

You can now use [EAS Build](/build/introduction.md) to build and sign your apps just as easily as in the managed workflow! [Read the announcement blog post](https://blog.expo.dev/expo-application-services-eas-build-and-submit-fc1d1476aa2e).

</p>
</details>

<details><summary><h4>Configuration must be done on each native project rather than once with app.json</h4></summary>
<p>

Configuring app icons, launch screen, and so on must be configured in the native projects for each platform using the standard native tooling, rather than once using a simple JSON object.

</p>
</details>

## Up next

If you've been reading along each section of the introduction then you will have a pretty good high-level understanding of Expo tools.

- 👩‍💻 If you have heard enough and want to get to coding, [jump ahead to "Installation"](../get-started/installation.md).
- ⁉️ If you have some unanswered questions, [continue to the "Common Questions" page](../introduction/faq.md).
