---
title: Expo Go
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import { Terminal } from '~/ui/components/Snippet';
import { BoxLink } from '~/ui/components/BoxLink';

Expo Go is a free, [open-source](https://github.com/expo/expo/tree/main/home) client for running React Native apps on Android and iOS without needing to build anything locally. It is available on the [App Store](https://apps.apple.com/app/apple-store/id982107779) and [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent&referrer=www).

With Expo Go, you can run your projects on your own device faster than ever, and share those projects across your whole team without the need for addition code signing.

## How it works

Expo Go is a native app that is installed on your device. When you run `npx expo start` in your project, [Expo CLI](/workflow/expo-cli) starts a [development server](/workflow/expo-cli#develop) and generates a QR code. You can then open the Expo Go app on your device and scan the QR code to connect to the dev server.

<Terminal cmd={['$ npx expo start']} />

<ImageSpotlight alt="Expo Go connecting to Expo CLI" src="/static/images/fetch-app-development.png" style={{ maxWidth: 600}} />

The dev server returns a JSON manifest file that describes the project. Expo Go uses this manifest to download the JavaScript bundle and any assets required to run the project. Then, the [JavaScript engine](/workflow/glossary-of-terms#javascript-engine) executes this JavaScript bundle to render the React Native app.

You can open and share projects with the members of your [organization](/accounts/account-types/#organizations) by publishing with [EAS Update](/eas-update/introduction). Updates are bundled for production environments using the [`npx expo export`](/workflow/expo-cli#exporting) command.

<Terminal cmd={['$ eas update']} />

## Production

Expo Go is not intended for public distribution. It is a development client that is not optimized for performance. We offer a suite of tools for building and submitting your apps directly to the app stores. For more information, see [Distribution](/distribution/introduction).

## Manifest

The manifest is similar to an **index.html** on the web. It is served from the root URL `/` and allows downloading the project script code from `bundleUrl`. The manifest can be customized using the Expo config (**app.json**, **app.config.js**). Additional fields like `icon` and `splash` can be used to customize how Expo Go or `expo-dev-client` presents the app.

```json
{
  "name": "My New Project",
  "entryPoint": "index.js",
  "bundleUrl": "http://localhost:19000/index.bundle?platform=ios"
}
```

The manifest is also used when publishing your app with [EAS Update](/eas-update/introduction).

## SDK Versions

Expo Go uses **SDK versions** that map to a major release of the `expo` and the Expo Go app. You can see the supported SDK versions in the Expo Go app by navigating to the settings page.

We release a new SDK version approximately every quarter. Find out which [versions of React Native map to which versions of the Expo SDK][version-support].

## Custom native code

Each version of the Expo Go app contains 3-4 versions of React Native and the Expo SDK. This enables you to get up and running fast without performing a native build. However, if you need to use custom native code, you will need to use a custom client. For more information, see [Development builds](/development/introduction).

Projects with custom native code can still partially use Expo Go by [following this guide](/bare/using-expo-client).

## Implementation

Expo Go is a React Native app that uses Expo SDK, CLI, EAS Build, and EAS Update. It is built with the same tools you use to create your apps.

You can view the source code for the [Android](https://github.com/expo/expo/tree/main/android), [iOS](https://github.com/expo/expo/tree/main/ios), and [JavaScript](https://github.com/expo/expo/tree/main/home) on GitHub.

You can create your own Expo Go-type app by using the [`expo-dev-client`](/development/introduction) package. This package allows you to create a native client with any custom native code or configuration.

## Next

<BoxLink 
  title="CLI"
  description="Learn about the Expo CLI and how to use it to develop your app."
  href="/workflow/expo-cli"
/>

<BoxLink 
  title="App config"
  description="Configure the Expo CLI and Expo Go with the app.json."
  href="/workflow/configuration"
/>

[version-support]: versions/latest/#each-expo-sdk-version-depends-on-a
