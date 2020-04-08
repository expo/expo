---
title: Workflows
sidebar_title: Workflows
---

The two approaches to building applications with Expo tools are called the "managed" and "bare" workflows.

- With the managed workflow you only write JavaScript / TypeScript and Expo tools and services take care of the rest for you.
- In the bare workflow you have full control over every aspect of the native project, and Expo tools can't help quite as much.

> 💡 **If you've used React Native without any Expo tools** then you have used the "bare workflow", but the name probably doesn't sound familiar. We call this "bare" somewhat in jest and because of the term "bare metal" which and it's easier to talk about something when it has a name. If you have direct access to the native code, it's a bare project. The ["Already used React Native?"](../../workflow/already-used-react-native/) page might be useful for you to quickly understand where Expo fits in.

## Managed workflow

The managed workflow is kind of like "[Rails](https://rubyonrails.org/)" and "[Create React App](https://github.com/facebook/create-react-app)" for React Native.

Apps are built with the managed workflow using the [expo-cli](../../workflow/expo-cli/), the Expo client on your mobile device, and our various services: [push notifications](../../guides/push-notifications/), the [build service](../../distribution/building-standalone-apps/), and [over-the-air (OTA) updates](../../guides/configuring-ota-updates/). **Expo tries to manage as much of the complexity of building apps for you as we can, which is why we call it the managed workflow**. A developer using the managed workflow doesn't use Xcode or Android Studio, they just write JavaScript code and manage configuration for things like the app icon and splash screen through [app.json](../../workflow/configuration/). The Expo SDK exposes an increasingly comprehensive set of APIs that give you the power to access device capabilities like the camera, biometric authentication, file system, haptics, and so on.

While you can do a lot with the managed workflow, you can't do _everything_ with it, so what are your options when you encounter a [limitation](../../introduction/why-not-expo/)?

> 🤓 We will discuss the limitations more in depth soon, for now let's just look at what will happen if it turns out one applies to your application.

### What happens if I run up against a limitation?

If you get to the point where you need to have full control over the native code in your app, you can "eject" (run `expo eject` in your project) and expo-cli will expose all of the underlying native projects and configuration. You'll then be using the bare workflow.

## Bare workflow

In the bare workflow the developer has complete control, along with the complexity that comes with that. You can use most APIs in the Expo SDK, but the build service, notifications, over-the-air updates, and easy configuration with app.json are not yet supported. You can refer to tutorials and guides that are oriented towards native iOS and Android apps and React Native for alternatives.

<!-- <img src="/static/images/project-lifecycle-workflows.png" className="wide-image" /> -->

## Workflow comparison

| Feature                                                | Managed workflow | Bare workflow                               | Vanilla React Native |
| ------------------------------------------------------ | ---------------- | ------------------------------------------- | -------------------- |
| Develop universal apps with only JavaScript/TypeScript | ✅               |                                             |                      |
| Use Expo to create your iOS and Android builds         | ✅               |                                             |                      |
| Use Expo's push notification service                   | ✅               | ✅                                          |                      |
| Use Expo's over the air updates features               | ✅               | ✅                                          |                      |
| Develop with the Expo client app                       | ✅               | ✅ (only if custom native code is disabled) |                      |
| Access to Expo SDK                                     | ✅               | ✅                                          |                      |
| Add custom native code and manage native dependencies  |                  | ✅                                          | ✅                   |
| Develop in Xcode and Android Studio                    |                  | ✅                                          | ✅                   |
| No access to Expo SDK                                  |                  |                                             | ✅                   |

## Which workflow is right for me?

- 🚫🔒**Expo never locks you in**, you can "eject" at any time and your project will just be a typical native project with the React Native and Expo SDK packages that your app is using installed and configured.
- 🆕**If you are new to mobile development** or **new to development in general** we recommend that you use the managed workflow. There is a huge amount of complexity that comes along with the native development toolchain and the managed workflow allows you to deal with that complexity only when absolutely necessary.
- 🧠 **If you are more experienced** it also doesn't hurt to start every new project with the managed workflow and only "eject" if you need to.

In summary, use the bare workflow when you need it due to limitations, otherwise use the managed workflow, and you most likely want to start with the managed workflow.

## Up next

- 📄 If you're hung up on the earlier mention of "limitations" then you can [move ahead to the limitations page](../../introduction/why-not-expo/).
- 📺 Text can only go so far - if you want a more complete picture of building an app end-to-end with the managed workflow, [you should continue to the Walkthrough page](../../introduction/walkthrough/). There are a bunch of videos and it's easy to skim through, and you should leave it with a better sense of what building a managed app looks like. [Go watch them now.](../../introduction/walkthrough/)
