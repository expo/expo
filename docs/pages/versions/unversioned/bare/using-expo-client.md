---
title: Using Expo client in Bare Workflow
sidebar_title: Using Expo client
---

It's not currently possible to include your own native code in the Expo client, so it might surprise you to learn that it is still possible to run your bare app in the Expo client.

## What are the limitations?

You will not be able to use the parts of your app that require custom native code. To run your bare app in the Expo client, you need to avoid calling any custom native code (native code that isn't included in the Expo SDK). For some apps this may mean that you won't be able to use the Expo client almost at all &mdash; for example, if your app depends on custom native code for something as fundamental as navigation or state management (eg: Realm or the Firebase native SDK) then not much of your app will be usable in the client. If your app only has some in app purchases, analytics, a custom map view, an AR view, and so on, then this may actually work great for you &mdash; that particular functionality would not be usable in the client but the rest of the app still would be.

## Why might you want to do this?

There are a number of benefits to keeping your app runnable in the Expo client.

- Share your progress with stakeholders by publishing or sharing the development URL to see changes live
- Deploy ["Review Apps"](https://github.com/FormidableLabs/appr#what-are-review-apps) from pull requests
- No need to do native builds for iOS and Android in development because you use the Expo client instead
- Develop the JavaScript side of your app from any machine of your choice, eg: use Windows for iOS development if you have an iOS device
- Easily get new contributors set up on the project, only Node.js and a phone are required
- You can use `expo-cli` for a great development experience

## Practical patterns for client-compatible bare apps

### Conditional inline requires

