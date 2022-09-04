---
title: Overview
sidebar_title: Introduction
hideTOC: true
---

import { BoxLink } from '~/ui/components/BoxLink';
import { Terminal } from '~/ui/components/Snippet';
import { InlineCode } from '~/components/base/code';

A bare React Native app is a project where developers make direct changes to their native `ios` and `android` project directories, rather than continuously generating them on demand using the [Expo config (**app.json**) and prebuild](/workflow/prebuild).

All tools and services offered by Expo including [EAS](/eas), Expo CLI, and the libraries in the Expo SDK are built to **fully support** bare React Native apps.

> If you already have a React Native app and want to use Expo tools, read the [existing apps guide](/bare/existing-apps).

Before you get started with a bare React Native project, make sure you set up your environment for [React Native CLI](https://reactnative.dev/docs/environment-setup).

Now we can bootstrap a new bare project with `create-expo-app`. If you want to bootstrap a project with `npx react-native init` then you'll need to [install and configure the `expo` package](/bare/installing-expo-modules) manually.

<Terminal cmd={[
"# Create a new native project",
"$ npx create-expo-app --template bare-minimum",
]} cmdCopy="npx create-expo-app --template bare-minimum" />

Change into your project directory, then run this project locally:

<Terminal cmd={[
'# Build your native Android project',
'$ npx expo run:android',
'',
'# Build your native iOS project',
'$ npx expo run:ios'
]} />

> Learn more about [compiling native apps](/workflow/expo-cli#compiling).

## Next

<BoxLink title="Using libraries" description="Learn how to install and configure native libraries." href="/workflow/using-libraries#installing-a-third-party-library" />
<BoxLink title="API Reference" description="Start adding more features to your app." href="/versions/" />
<BoxLink title="Adopt Prebuild" description="Automate your native directories using the app.json." href="/guides/adopting-prebuild" />
