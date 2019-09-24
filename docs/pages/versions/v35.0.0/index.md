---
title: Getting to know Expo
---

import Video from '../../../components/plugins/Video'

Welcome to the documentation for [Expo](http://expo.io) -- a set of tools and services for building, deploying, and quickly iterating on native iOS, Android, and web apps from the same codebase. The tools we provide are the Expo client app, CLI, SDK, and Snack. The services are build, update, and notify.

There are two ways to build a project with Expo, we call these workflows: you can use the "managed" workflow or the "bare" workflow. With the "managed" workflow, you only write JavaScript and lean on the [Expo SDK](sdk/overview/) to give you access to your device capabilities and the Expo services to handle the heavy lifting of building your app binary and uploading it to the store, all without you touching Xcode or Android Studio. With the "bare" workflow, we also speed up your development with the [Expo SDK](sdk/overview/) and React Native, and you have full control over your iOS and Android projects.

<Video file="introduction.mp4" loop={false} />

> *Look at that, the same React code using TypeScript running natively on iOS, Android, and web! This is what Expo is all about &mdash; providing a universal platform for React*

## More about the Expo SDK

The Expo SDK is a set of libraries written natively for each platform which provides access to the device's system functionality (things like the camera, push notifications, contacts, local storage, and other hardware and operating system APIs) from JavaScript. The SDK is designed to smooth out differences in platforms as much as possible, which makes your project very portable because it can run in any native environment containing the Expo SDK.

Expo also provides UI components to handle a variety of use-cases that almost all apps will cover but are not built into React Native core, e.g. icons, blur views, and more.

## Considering using Expo?

- If you'd like an overview of what Expo offers, you might want to familiarize yourself with the [lifecycle of an Expo project](introduction/managed-vs-bare/), which describes how you go from square one to a production iOS and Android app.
- For further explanation, it's also good to check out the [Frequently Asked Questions](introduction/faq/).

## Ready to get started?

- Head over to [Installation](introduction/installation/) to grab our tools and have a look around.
- Make your first project by following the [Up and Running](workflow/up-and-running/) guide.
- If you're not already familiar with React and React Native, you can bootstrap your knowledge with [React Native Express](http://www.reactnativeexpress.com/).
- For hands-on React Native projects from beginner to advanced, check out [Fullstack React Native](https://www.fullstackreact.com/react-native/), a (paid) book by the author of React Native Express.
- Join our [Community](introduction/community/) and let us know what you're working on!
