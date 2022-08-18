---
title: Workflows
sidebar_title: Workflows
---

import { YesIcon, NoIcon } from '~/ui/components/DocIcons';

You can use the [Expo Prebuild](/workflow/prebuild) feature to write your app entirely in JavaScript and continuously generate the native projects.

Prebuilding is [completely optional](/workflow/prebuild#optionality) and it works great with all tools and services offered by Expo. We created the designation _bare workflow_ to refer projects that do not use `npx expo prebuild` — projects where developers make direct changes to their native projects, rather than continuously generating them on demand as with prebuild.

We used to refer to the usage of Expo Prebuild as _managed workflow_ in older versions of Expo that utilized shell apps, this term is being phased out.

### Custom Native Code

_Expo Prebuild_ allows for installing [libraries in the React Native ecosystem](https://reactnative.directory/), ([learn more](/workflow/using-libraries)). It's important to note that Expo Go, the app you download from the app stores will not have access to any custom native code you add to your project. When you make custom build-time changes, you'll need to rebuild your app to see those changes, either locally with the Expo CLI run commands (`npx expo run:ios` and `npx expo run:android`) or in the cloud with `eas build` (preferred for production builds) -- both of which run `npx expo prebuild`.

## Workflow comparison

| Feature                                                      | <YesIcon /> With Prebuild | <NoIcon /> Without Prebuild                                             |
| ------------------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------- |
| Develop apps with **only** JavaScript/TypeScript             | <YesIcon />               | <NoIcon />                                                              |
| Use Expo build service to create your iOS and Android builds | <YesIcon />               | <YesIcon /> ([with EAS Build](/build/introduction))                     |
| Use Expo's push notification service                         | <YesIcon />               | <YesIcon />                                                             |
| Use Expo's updates features                                  | <YesIcon />               | <YesIcon />                                                             |
| Develop with the Expo Go app                                 | <YesIcon />               | <YesIcon /> (if you follow [these guidelines](/bare/using-expo-client)) |
| Access to Expo SDK                                           | <YesIcon />               | <YesIcon />                                                             |
| Add custom native code and manage native dependencies        | <YesIcon />               | <YesIcon />                                                             |

## Deprecated term

> TL;DR: "Managed workflow" is now just referred to as "Using Expo Prebuild".

Up until SDK 41, the workflows had a completely different set of limitations and developers had to choose which set of features they wanted to use.

The term "managed workflow" used to refer to a project that could only be used in Expo Go, had no ability to add custom native code, and was the only way to use Expo's classic services. The term "bare workflow" referred to a project that couldn't make use of Expo services (notifications, updates, builds, submissions), and had a less smooth developer experience -- often it made sense to simply 'not use Expo'.

The most fatal issue with the legacy workflows is that you couldn't switch between them as seamlessly as you can now. You would "eject" from the managed workflow to the bare workflow by running `expo eject` (formerly `exp detach`), a now deprecated command that would perform some archaic native code generation that often didn't work.

With _Expo Prebuild_ you can enjoy all of the features of React Native and scale massive projects with ease!

## Up next

Text can only go so far - if you want a more complete picture of building an app end-to-end with the managed workflow, [you should continue to the Walkthrough page](/introduction/walkthrough). There are a bunch of videos and it's easy to skim through, and you should leave it with a better sense of what building a managed app looks like. [Go watch them now.](/introduction/walkthrough)
