---
title: Project Lifecycle
---

Expo makes it easy to get started writing apps and to take them all the way to production using the managed workflow. Here's an overview of the tools and services you might use along the way.

This guide is meant to give a high-level explanation of what Expo offers. For the curious, the technical implementation of these topics is covered in much more detail [here](../../workflow/how-expo-works/).

<img src="/static/images/project-lifecycle-workflows.png" className="wide-image" />

## Creating an Expo project

You can create a new Expo project with only our desktop tool and a text editor. See [Up and Running](../../workflow/up-and-running/) for a fast guide to creating a project, running it on a device, and making changes.

Expo apps are React Native apps with the Expo SDK built-in. The fastest way to get started is using the [Up and Running](../../workflow/up-and-running/) guide, but you can also [convert an existing React Native app](../faq/#how-do-i-get-my-existing-react) or adopt only bits and pieces of Expo into your app.

## Developing locally

When you work on a managed Expo project, we serve an instance of your project from your local computer. If you close the project or turn off your computer, your development project stops being served.

During this time, you test your project using a pre-built iOS/Android app called [Expo client](../installation/). It asks your computer for a local copy of your project (via localhost, LAN, or a tunnel), downloads it, and runs it. You can take advantage of various development tools such as [debugging](../../workflow/debugging/), [streaming device logs](../../workflow/logging/), inspecting elements, hot module reloading, and more.

## Publishing your project

If you click the **Publish** button in Expo Dev Tools, we upload a minified copy of your app to our CDN, and give you a shareable url of the form `expo.io/@your-username/your-app-slug`.

You can share this link immediately with anybody who has the Expo client app for Android. [Read more about Publishing here](../../workflow/publishing/).

On iOS, you'll need to use Apple TestFlight to share your app with others.

## Updating your app

You can continue making changes locally without disrupting your users. Any time you **Publish** changes to your app, your new version becomes available immediately to anybody with the link.

We frequently release updates to the [Expo SDK](../../sdk/overview/). Each update includes instructions for how to upgrade your project. If you decide to update to a newer version of our SDK, copies of the older version will continue to work fine. Users will download the newest copy that their client supports.

## Deploying to the Apple App Store and Google Play

When you're ready to list your app officially on the Apple App Store and Google Play Store, Expo can generate deployment-ready `.ipa` and `.apk` archives which are ready to submit to Apple and Google. We generate them on our servers, so you still don't need any Apple or Google software. See the documentation about [Distributing Apps](../../distribution/app-stores/).

## Changing native code

You can take your app all the way to the App Store and Play Store while writing only JS using the managed workflow. However, if you run into needs which aren't met by the Expo SDK ([see "Why not Expo?" to help anticipate whether you will encounter this](../why-not-expo/)), we provide the ability to eject, which gives you the native Xcode and Android Studio representation of your project so you can change anything that you need to.

**Note:** If you choose to eject, some Expo services are no longer available. For example, `expo-cli` won't work, we can't generate standalone builds for you anymore, and you won't be able to publish updates using `expo publish`. Your project becomes a normal React Native project with most of the Expo SDK APIs included.
