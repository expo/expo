---
title: Managed and Bare Workflows
sidebar_title: Workflows
---

The two ways to use Expo tools are called the "managed" and "bare" workflows.

<img src="/static/images/project-lifecycle-workflows.png" className="wide-image" />

We recommend doing the [managed workflow walkthrough](../../workflow/exploring-managed-workflow/) and the [bare workflow walkthrough](../../bare/exploring-bare-workflow/) to get a more complete picture of building an app end-to-end with each approach. They have a bunch of videos and they are relatively easy to skim through. The following is a very brief text-only summary of the two workflows.

## Managed workflow

Apps are built with the managed workflow using the [expo-cli](../../workflow/expo-cli/), the Expo client on your mobile device, and our various services: [push notifications](../../guides/push-notifications/), the [build service](../../distribution/building-standalone-apps/), and [over-the-air (OTA) updates](../../guides/configuring-ota-updates/). Expo tries to manage as much of the complexity of building apps for you as we can, so we call it the managed workflow. A developer using the managed workflow doesn't use Xcode or Android Studio, they just write JavaScript code and managed configuration through [app.json](../../workflow/configuration/). There are tradeoffs that you should consider when building your app this way, check out [Why not Expo?](../../introduction/why-not-expo/) to learn more.

If you get to the point where you need to have more control (eg: to add your own custom native code), you can eject your project to a vanilla React Native app that includes just the Expo tools that you are using, we call this the bare workflow.

## Bare workflow

This is our way of describing the workflow where you use some of the Expo tools in a vanilla React Native app. Unlike in the managed workflow where you don't touch the underlying native code directly, in this workflow the developer has complete control, along with the complexity that comes with that. You can use most APIs in the Expo SDK. Much of the Expo documentation will not apply to building your app if you use this workflow, instead you can refer to tutorials and guides that are oriented towards native iOS and Android apps and React Native.

### What about ExpoKit?

ExpoKit is another way to use Expo tools in a vanilla React Native app. The problem with ExpoKit is it is, compared to the "bare workflow", very monolithic &mdash; you essentially include the entire runtime from the Expo "managed workflow" in your app, rather than only the pieces of it that you want. Developers building a React Native app couldn't just pull in one of the Expo SDK dependencies, it's all or nothing. We have found that this has been difficult for developers to work with for a variety of reasons, and so ExpoKit is on a deprecation path. It will be continued to be supported for at least one SDK release after the Updates API is available for all vanilla React Native apps.