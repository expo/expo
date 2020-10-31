---
title: Coming from React Native
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

**Expo Dev Client** is an open source project to improve your development experience while working on your Expo and React Native projects. It allows your team to focus on the JavaScript portion of your project, only needing to interact with XCode or Android Studio when you need to make changes to the native code used in your project.

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing it to EAS Build! If you want to build a managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../../workflow/customizing/) page to learn how.

## 1. Pre and co requisites

### a. Install Unimodules

Unimodules contains infrastructure and a small set of foundational libraries that are depended on by other modules in the Expo ecosystem. Once it is installed you can use most of the libraries from the Expo SDK, like expo-camera, expo-media-library and many more.

<br />

[Install Steps](../../bare/installing-unimodules)

### b. Install expo-updates

There are some shared installation steps with expo-updates that only need to be done once

## 2. Add expo-dev to your project

Follow the instructions to [add expo-dev to any expo project](../installation/)
