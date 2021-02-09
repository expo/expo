---
title: Routing & Navigation
previous___FILE: ./using-custom-fonts.md
next___FILE: ./push-notifications.md
---

import Video from '~/components/plugins/Video'

Routing and navigation refers to the ability to organize your app into distinct screens, map screens to URLs, move between those screens, and display the appropriate platform-specific navigation-related user interface elements (eg: tabs, navigation bar, screen transition animations and gestures, drawers).

## Our recommendation: React Navigation

<Video file={"routing-and-navigation/preview.mp4"} loop={false} />

> 🎬 This video demonstrates using React Navigation on iOS, Android, and web. Notice that it adapts to the platform conventions in each case. The code that powers this example app is available on GitHub in [react-navigation/example](https://github.com/react-navigation/react-navigation/tree/main/example).

The library that we recommend that you use for routing & navigation for iOS, Android, and web is [React Navigation](https://github.com/react-navigation/react-navigation).

React Navigation is the most popular navigation library in the React Native ecosystem and it is maintained by Expo, so it's guaranteed to work great in your apps. It includes support for common navigation patterns like stacks, tabs, and drawers. It's also built to be customizable, so you can achieve any navigation pattern that you wish with it, even if it's not built-in to the library. It supports using the platform native APIs via [`createNativeStackNavigator`](https://reactnavigation.org/docs/native-stack-navigator), this is commonly referred to in React Native as "native navigation".

### Getting started with React Navigation

- **Install**: To install React Navigation in your project, refer to its ["Getting started" guide](https://reactnavigation.org/docs/getting-started/).
- **Learn**: We strongly advise going through the "Fundamentals" guides to become comfortable with the library, you can start with ["Hello React Navigation"](https://reactnavigation.org/docs/hello-react-navigation) after installing the library in your project.

## Alternatives

- An alternative solution for web is to use [Next.js](../guides/using-nextjs.md). It provides its own routing system and built-in support for code-splitting. Read more in [Using Next.js with Expo for Web](../guides/using-nextjs.md).
- [React Native Navigation](https://github.com/wix/react-native-navigation) will not work in Expo managed workflow apps, but if you are using a bare React Native app it may be something you will consider. Similar to `createNativeStackNavigator` from React Navigation, it uses the platform native APIs.
