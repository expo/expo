---
title: Workflows
sidebar_title: Workflows
---

The two approaches to building applications with Expo tools are called the "managed" and "bare" workflows.

- With the _managed workflow_ you only write JavaScript / TypeScript and Expo tools and services take care of everything else for you.
- In the _bare workflow_ you can use any Expo library and service, and you are responsible for the native iOS and Android projects.

> 💡 **If you've used React Native without any Expo tools** then you have used the "bare workflow", but the name probably doesn't sound familiar. It's easier to talk about something when it has a name, so we call this "bare" – somewhat in jest, and because of the existing term "bare metal". If you have direct access to the native code it's a _bare_ project. The ["Already used React Native?"](../workflow/already-used-react-native.md) page might be useful for you to quickly understand where Expo fits in.

## Managed workflow

The managed workflow is kind of like [Rails](https://rubyonrails.org/) and [Create React App](https://github.com/facebook/create-react-app), but for React Native.

Developers build managed workflow apps using [expo-cli](../workflow/expo-cli.md) on their computer and a development client on their mobile devices (either the Expo Go app for more simple projects or a [development build](../development/introduction.md) when your project grows). Manged workflows apps typically use one or more Expo services, such as [push notifications](../push-notifications/overview.md), [build](../distribution/building-standalone-apps.md), and [updates](../guides/configuring-updates.md).

**Expo tries to manage as much of the complexity of building apps for you as we can, which is why we call it the managed workflow**. A developer using the managed workflow doesn't use Xcode or Android Studio often (although it may be useful for debugging), they write JavaScript code and manage configuration, such as the app icon and splash screen, through [app.json / app.config.js](../workflow/configuration.md) or [config plugins](../guides/config-plugins.md). The Expo SDK exposes an increasingly comprehensive set of APIs that give you the power to access device capabilities like the camera, biometric authentication, file system, haptics, and so on. Developers can also make use of most [libraries in the React Native ecosystem](https://reactnative.directory/), ([learn more](../workflow/using-libraries.md)).

While you can do a lot with the managed workflow, you can't do _everything_ with it, so what are your options when you encounter a [limitation](../introduction/why-not-expo.md)?

### What happens if I run up against a limitation?

If you get to the point where you need to have full control over the native code in your app, you can generate the native projects and continue development using the bare workflow. You can do this by running `expo prebuild`.

## Bare workflow

In the bare workflow the developer has complete control, along with the complexity that comes with that. You can use all packages from the Expo SDK, development builds, and all Expo and [EAS Services](https://expo.dev/eas). Configuration with **app.json** / **app.config.js** is mostly not supported in this context; instead, you will need to configure each native project directly.

## Workflow comparison

| Feature                                                      | Managed workflow | Bare workflow                                                      |
| ------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------ |
| Develop apps with **only** JavaScript/TypeScript             | ✅               |                                                                    |
| Use Expo build service to create your iOS and Android builds | ✅               | ✅ ([with EAS Build](/build/introduction.md))                      |
| Use Expo's push notification service                         | ✅               | ✅                                                                 |
| Use Expo's updates features                                  | ✅               | ✅                                                                 |
| Develop with the Expo Go app                                 | ✅               | ✅ (if you follow [these guidelines](../bare/using-expo-client.md)) |
| Access to Expo SDK                                           | ✅               | ✅                                                                 |
| Add custom native code and manage native dependencies        | ✅               | ✅                                                                 |
| Develop in Xcode and Android Studio                          |                  | ✅                                                                 |

## Which workflow is right for me?

- 🚫🔒**Expo never locks you in**, you can generate the native iOS and Android projects from your managed project at any time you like. You can use one library or service or many, in managed or bare projects.
- 🆕**If you are new to mobile development** or **new to development in general** we recommend that you use the managed workflow. There is a huge amount of complexity that comes along with the native development toolchain and the managed workflow allows you to deal with that complexity only when absolutely necessary.
- 🧠 **If you are more experienced** it also doesn't hurt to start every new project with the managed workflow and only generate the native projects when needed.

In summary, use the bare workflow when you need it due to limitations, otherwise use the managed workflow, and you most likely want to start with the managed workflow.

## Up next

- 📺 Text can only go so far - if you want a more complete picture of building an app end-to-end with the managed workflow, [you should continue to the Walkthrough page](../introduction/walkthrough.md). There are a bunch of videos and it's easy to skim through, and you should leave it with a better sense of what building a managed app looks like. [Go watch them now.](../introduction/walkthrough.md)
