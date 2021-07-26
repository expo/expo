---
title: Introduction
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

> ⏩ Want to create a custom client for your project?  Follow the [Getting Started guide](getting-started.md).

> 👀 Want to get notified of new releases with a changelog and upgrade instructions?  Sign up for the [mailing list](https://expo.dev/mailing-list/dev-client).

**Expo Clients** provide a precompiled runtime that can load and run applications built with Expo. With a compatible client for each platform an application targets, you can focus your time and energy building your application fully in JavaScript and gain the developer experience that Expo is known for:

- Easy for new developers without native experience to join the team
- Quickly verify the impact of changes to your project
- Develop iOS applications without needing a machine running MacOS

Depending on your project, you may find that you need to customize the standard runtime provided in Expo Go, either to reduce your bundle size, to use a module offered by developers in the React Native community, or even to add your own custom native code. At that point, you can create a custom development client, install it on your phone, and continue developing.

## How it works

<object width="100%" height="400">
  <param name="movie" value="https://youtube.com/embed/_SWalkrP0CA" />
  <param name="wmode" value="transparent" />
  <embed src="https://youtube.com/embed/_SWalkrP0CA" type="application/x-shockwave-flash" wmode="transparent" width="100%" height="400" />
</object>

`expo-dev-client` is an npm package installable in any Expo or React Native project. Once installed, any Debug builds of your application will gain an extensible debug menu and the ability to load projects from Expo CLI. Release builds of your application will not change other than the addition of a few header files.

Your debug builds can be shared with anyone on your team who needs to work on or review your application. Your team can develop the JavaScript portion of your application with `expo-cli` and your custom client without waiting for your native code to build until the next time you need to upgrade, install a new module, or otherwise change the native code in your project.

## What you'll gain by adopting `expo-dev-client`

### If you are using the Managed workflow with Expo Go

- Add any native code your project needs
- Develop in the same environment as your released application
- Access to the full power of Xcode and Android Studio when you need them

> ⏩ [Create a custom client for your project](getting-started.md).

### If you are using React Native CLI

- Develop iOS applications without a machine running MacOS
- Run your application on a physical device without plugging it
- Develop using any available port
- Quickly connect to your device via QR code
- Improved developer experience of Expo CLI


> ⏩ [Create a custom client for your project](installation.md).