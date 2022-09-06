---
title: Introduction
---

import Highlight from '~/components/plugins/Highlight';
import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';

Welcome to Expo. You're about to embark on a journey of building universal apps. In this tutorial, you'll create a universal app that runs on Android, iOS, and the web; all with a single codebase. Let's get started!

## About this tutorial

The objective of this tutorial is to get you started with Expo and get familiar with the Expo SDK. and build an app for Android, iOS and the web. It covers the following topics:

- Initializing an Expo App
- Breaking down app layout and implementing it with flexbox
- Use a native image picker user interface (UI) to select an image from the platform's media library
- Create a sticker modal using the Modal and FlatList components from React Native
- Add handle gestures to interact with a sticker
- Use third-party libraries to capture a screenshot and save an image on the platform
- Handle platform differences between Android, iOS, and web
- Finally, go through the process of configuring a status bar, a splash screen, and an icon to complete the app

Before you get started, take a look at what you'll build: an app named **StickerSmash** that runs on Android, iOS, and the web:

<Video file="tutorial/final.mp4" />

You will get some hands-on experience by using different Expo libraries such as `expo-image-picker`, `expo-media-library`, and `expo-status-bar`. Some of the functionalities these libraries offer are picking an image from a device's media library, saving the image on the device, and so on. Expo's SDK provides universal libraries that make implementing features across unique platforms a snap. With that said, you can use any native code or library in your apps.

Further in the tutorial, you will also use libraries like [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) and [Reanimated](https://docs.swmansion.com/react-native-reanimated/) to add interactivity and to implement pan and tap gestures to add interactive features.

This tutorial is divided into eight chapters. Each chapter covers a different topic that we thought will be essential for you to grasp the fundamentals of how different pieces come together when you are building a mobile app.

This is a self-paced tutorial. On average, it will take around two and a half hours to complete this tutorial. Feel free to take your time and go through each chapter at your own pace or leave out any section and come back to it later.

Each chapter also contains the code for that specific part. Feel free to follow along either by creating your own app from scratch or using Expo Snack examples to copy and paste the code if you get lost in between.

## How to use this tutorial

We believe in "learning by doing" so this tutorial emphasizes doing over explaining. You can follow along the journey of building the app in the following ways:

- Clone the starter project and start building the app from scratch
- Create a new Expo project and start building the app from scratch

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

> **Wait, what is this "Try this example on Snack" button?**
>
> Snack is a web-based editor that works similarly to an Expo project. It's a great way to share code snippets and try things out without needing to get a project running on your own computer with `npx create-expo-app`.
>
> Go ahead, press the above button. You will see the above code running in a Snack. Try to switch between iOS, Android, or the web. You can also open it on your device in the Expo Go app by pressing the **Run** button.
>
> Throughout this tutorial, use Snack to copy and paste the code into your own project on your computer. We will continue to provide Snacks for each module, and **we recommend you create the app on your machine to go through the experience of building the app**.

## Up next

If you're already familiar with Expo, feel free to jump ahead to specific chapters. However, if you'd like to build an entire app, continue to the next step in which you will learn [how to initialize an app with Expo](/tutorial/initialize-app/).
