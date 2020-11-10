---
title: Limitations
sidebar_title: Limitations
---

Your success will be limited if you don't know the limitations of your tools. A good software engineer strives to understand the tradeoffs in the decisions they make.

## Limitations of the managed workflow

As explained on the [workflows overview page](managed-vs-bare.md), the managed workflow is kind of like "[Rails](https://rubyonrails.org/)" and "[Create React App](https://github.com/facebook/create-react-app)" for React Native. If you use the tools we provide in the managed workflow to build your app, we try to handle as much of the complexity of building apps for you as we can. The tradeoff here is that this workflow won't be suitable for _every possible app_.

There are plenty of cases where its current constraints may not be appropriate for your project. The following is a list of limitations that we are aware of that may influence your decision on whether the managed workflow is a good fit for your project.

<details><summary><h4>Not all iOS and Android APIs are available</h4></summary> <p>

Many device APIs are supported (check out the "SDK API Reference" in the sidebar), but **not all iOS and Android APIs are available yet**: need Bluetooth? Sorry, we haven't built support for it yet. WebRTC? Not quite. One of the most frequent requests we get is for In-App Purchases and Apple and Google Pay integration. We haven't built this yet, but it's on the roadmap. We are constantly adding new APIs, so if we don't have something you need now, you can either use the [bare workflow](managed-vs-bare.md#bare-workflow) or follow [our blog](https://blog.expo.io) to see the release notes for our SDK updates. Feature prioritization isn't strictly based off of popular vote, but it certainly helps us to gauge what is important to users.

</p>
</details>

<details><summary><h4>The SDK doesn't support all types of background code execution</h4></summary>
<p>

Background execution is the ability to run code when the app is not foregrounded or the device is sleeping. We support background geolocation (including geofencing) and background fetch, but we do not yet support background audio with the operating-system playback controls and you cannot handle push notifications in the background. This is a work in progress.

</p>
</details>

<details><summary><h4>If you need to keep your app size extremely lean, the managed workflow may not be the best choice</h4></summary>
<p>

The size for a managed Expo app on iOS is approximately 20mb (download), and Android is about 15mb. This is because "managed" includes a bunch of APIs regardless of whether or not you are using them &mdash; this lets you push over-the-air updates to use new APIs, but comes at the cost of binary size. Some of the APIs that are included are tied to services that you may not be using, for example the Facebook Mobile SDK is included to support Facebook Login and Facebook Ads, along with the Google Mobile SDK for similar reasons. We will make this customizable in the future, so you can trim down the size of your binaries. [Read more about managing your app size here](https://expo.fyi/managed-app-size).

</p>
</details>

<details><summary><h4>Native libraries to integrate with proprietary services are usually not included in the SDK</h4></summary>
<p>

Related to the previous point, we typically avoid adding native modules to the SDK if they are tied to external, proprietary services &mdash; we can't add something to the SDK just because a few users need it for their app, we have to think of the broader userbase. In these cases developers will want to use the [bare workflow](../introduction/managed-vs-bare.md), and they can easily migrate to it by [ejecting](../workflow/customizing.md).

</p>
</details>

<details><summary><h4>The only supported push notification service is the Expo notification service</h4></summary>
<p>

If you want to use another push notification service, such as OneSignal, instead of the [Expo Push Notification service/API](../push-notifications/overview.md), you will need to use the bare workflow.

</p>
</details>

<details><summary><h4>The minimum supported OS versions are Android 5+ and iOS 10+</h4></summary>
<p>

If you need to support older versions, you will not be able to use the managed workflow.

</p>
</details>

<details><summary><h4>Free builds can sometimes be queued</h4></summary>
<p>

You can easily build your app for submission to stores without even installing Xcode or Android Studio by using the free [standalone build service](../distribution/building-standalone-apps.md), but it occasionally has a queue depending on how many other folks are building a binary at that time. You can have access to dedicated build infrastructure with a ["Priority" plan](https://expo.io/developer-services), or you can [run the builds on your own CI](../distribution/turtle-cli.md) if you prefer.

</p>
</details>

<details><summary><h4>Updates (JS and assets) for OTA updates and builds are size-limited</h4></summary>
<p>

Expo's current update service supports updates around 50 MiB. Updates are published both for OTA updates and to build standalone apps, which embed updates. See more about [optimizing updates](../distribution/optimizing-updates.md).

You also can use the [bare workflow](../bare/exploring-bare-workflow.md) with the [`expo-updates`](../versions/latest/sdk/updates.md) library, which supports arbitrarily large updates that are self-hosted or embedded in apps compiled on your own computer.

</p>
</details>

<details><summary><h4>Your app cannot target only children under 13 years old.</h4></summary>
<p>

Both [Apple](https://developer.apple.com/app-store/review/guidelines/#kids) and [Google](https://support.google.com/googleplay/android-developer/answer/9285070?hl=en) provide strict guidelines for any apps that specifically target children under a particular age. One of these guidelines states that certain ad libraries, such as Facebook's Audience Network, cannot be used in the app. Since managed workflow apps [contain code for the entire Expo SDK by default](https://expo.fyi/managed-app-size), including Facebook's Audience Network library, you cannot list your app as "designed primarily for children under 13" in the App Store or Play Store, _even though this code is never run unless you explicitly call it_.

You can continue to use the managed workflow for all your development, but when it comes time to build your app files for the stores, you should run `expo eject` and build natively with Xcode and Android Studio. We're working on letting you customize exactly what libraries are included in your managed workflow projects, so thank you for your patience in the meantime!

</p>
</details>

<br />

> 👉 We are either actively working on or planning to build solutions to all of the limitations listed above, and if you think anything is missing, please bring it to our attention by posting to our [feature requests board](https://expo.canny.io/feature-requests) or the [forums](http://forums.expo.io/).

## Limitations of the bare workflow

In the bare workflow we have full access to the underlying native projects and any native code. It's a "bare" native project with React Native and one or more packages from the Expo SDK installed. Anything that you can do in a native project is possible here.

The following list is therefore specifically oriented towards to the limitations that exist around using Expo tools and services in the bare workflow.

<details><summary><h4>Build service only works in the managed workflow</h4></summary>
<p>

To build your app binaries for distribution on the Apple App Store and Google Play Store you will need to follow the same steps that you would in any native project, the Expo build service can't handle it for you. We are working on bringing bare workflow support to the build service in the near future.

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
