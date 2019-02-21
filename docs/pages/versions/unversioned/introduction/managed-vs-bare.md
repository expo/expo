---
title: Managed and Bare Workflows
---

The two ways to use Expo tools are called the "managed" and "bare" workflows.

## Managed workflow

Apps are built with the managed workflow using the [expo-cli](../../workflow/expo-cli/), the Expo client on your mobile device, and our various services: [push notifications](../../push-notifications/), the [build service](../../distribution/building-standalone-apps/), and [over-the-air (OTA) updates](../../guides/configuring-ota-updates/). Expo tries to manage as much of the complexity of building apps for you as we can, so we call it the managed workflow. A developer using the managed workflow doesn't use Xcode or Android Studio, they just write JavaScript code and managed configuration through [app.json](../../workflow/configuration/). There are tradeoffs that you should consider when building your app this way, check out [Why not Expo?](../introduction/why-not-expo/) to learn more.

## Bare workflow

Bare apps give the developer complete control, along with the complexity that comes with it. You can use most APIs in the Expo SDK, you will just need to install and configure them manually rather than having them ready for you out-of-the-box. Most of the Expo documentation will not apply to building your app if you use this workflow, instead you can refer to tutorials and guides that are oriented towards native iOS and Android apps and React Native.
