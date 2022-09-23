---
title: Introduction
---

import Highlight from '~/components/plugins/Highlight';
import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';

Welcome to Expo. We’re about to embark on a journey of building universal apps. In this tutorial, we’ll create a universal app that runs on Android, iOS, and the web; all with a single codebase. Let's get started!

## About this tutorial

The objective of this tutorial is to get started with Expo and get familiar with the Expo SDK. It’ll cover the following topics:

- Create an Expo App
- Breaking down app layout and implementing it with flexbox
- Use a native image picker UI to select an image from the platform's media library
- Create a sticker modal using the Modal and FlatList components from React Native
- Add handle gestures to interact with a sticker
- Use third-party libraries to capture a screenshot and save an image on the platform
- Handle platform differences between Android, iOS, and web
- Finally, go through the process of configuring a status bar, a splash screen, and an icon to complete the app

Before we get started, take a look at what we’ll build: an app named **StickerSmash** that runs on Android, iOS, and the web:

<Video file="tutorial/final.mp4" />

This tutorial provides a hands-on experience by using different Expo libraries such as `expo-image-picker`, `expo-media-library`, and `expo-status-bar`. Some of the functionalities these libraries offer are picking an image from a device's media library, saving the image on the device, and so on. Expo's SDK provides universal libraries that make implementing features across unique platforms a snap. With that said, we can use any native code or library in our apps.

Further in the tutorial, we will also use libraries like [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) and [Reanimated](https://docs.swmansion.com/react-native-reanimated/) to add interactivity and to implement pan and tap gestures to add interactive features.

This tutorial is divided into eight chapters. These chapters cover the fundamentals of how to build a mobile app. It is a self-paced tutorial. On average, it will take around two and a half hours to complete this tutorial.

Each chapter also contains all the necessary code. Feel free to follow along either by creating an app from scratch or using Expo Snack examples to copy and paste the code if you get lost in between.

## How to use this tutorial

We believe in "learning by doing" so this tutorial emphasizes doing over explaining. You can follow along the journey of building the app by cloning the starter template that we will provide.

Throughout the tutorial, any important code or code that has changed between examples will be <Highlight>highlighted in yellow</Highlight>. You can hover over the highlights (on desktop) or tap them (on mobile) to see more context on the change. For example, the code highlighted in the snippet below explains what it does:

<SnackInline label="Hello world">

<!-- prettier-ignore -->
```js
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>    
      /* @info This used to say, "Open up App.js to start working on your app!". Now it's "Hello world!". */<Text>Hello world!</Text>/* @end */      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

</SnackInline>

> **Wait, what is this "Open in Snack" button?**
>
> Snack is a web-based editor that works similarly to an Expo project. It's a great way to share code snippets and try things out without needing to get a project running on your own computer with `npx create-expo-app`.
>
> Go ahead, press the above button. You will see the above code running in a Snack. Try to switch between iOS, Android, or the web. You can also open it on your device in the Expo Go app by pressing the **Run** button.
>
> Throughout this tutorial, use Snack to copy and paste the code into your own project on your computer. We will continue to provide Snacks for each module, and **we recommend you create the app on your machine to go through the experience of building the app**.

## Up next

If you're already familiar with Expo, feel free to jump ahead to specific chapters. However, if you'd like to build an entire app, continue to the next step in which we will learn [how to create an app with Expo](/tutorial/initialize-app/).
