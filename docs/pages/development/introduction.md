---
title: Introduction
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

> ⏩ Want to create a development build for your project? Follow the [Getting Started guide](getting-started.md).

> 👀 Want to get notified of new releases with a changelog and upgrade instructions? Sign up for the [mailing list](https://expo.dev/mailing-list/dev-client).

Building your project with Expo allows you to iterate on your app quickly and safely by allowing you to make most changes in JavaScript. [This workflow](https://blog.expo.dev/javascript-driven-development-with-custom-runtimes-eda87d574c9d) allows your team to:

- Easily onboard new developers without native experience
- Quickly verify the impact of changes to your project
- Develop iOS apps without needing a machine running MacOS

When first starting your project, the standard runtime provided in Expo Go was likely sufficient. As your project moves toward release, you may find that you need to customize your project, either to reduce your bundle size, to use a module offered by developers in the React Native community, or even to add your own custom native code. At that point, you can create a development build of your app, install it on your phone, and continue developing.

## How it works

<object width="100%" height="400">
  <param name="movie" value="https://youtube.com/embed/_SWalkrP0CA" />
  <param name="wmode" value="transparent" />
  <embed src="https://youtube.com/embed/_SWalkrP0CA" type="application/x-shockwave-flash" wmode="transparent" width="100%" height="400" />
</object>

`expo-dev-client` is an npm package installable in any Expo or React Native project. Once installed, any Debug builds of your app will gain extensible development tools and the ability to load projects from Expo CLI. Release builds of your app will not change other than the addition of a few header files.

Development builds of your app can be shared with anyone on your team who needs to work on or review your app. Your team can develop the JavaScript portion of your app with Expo CLI and your development build without waiting for your native code to build until the next time you need to upgrade, install a new module, or otherwise change the native code in your project.

## What you'll gain by adopting `expo-dev-client`

### If you are using the Managed workflow with Expo Go

- Add any native code your project needs
- Develop in the same environment as your released app
- Access to the full power of Xcode and Android Studio when you need them

> ⏩ [Create a development build for your project](getting-started.md).

### If you are using React Native CLI

- Develop iOS apps without a machine running MacOS
- Run your app on a physical device without plugging it in
- Develop using any available port
- Quickly connect to your device via QR code
- Improved developer experience of Expo CLI

> ⏩ [Create a development build for your project](installation.md).
