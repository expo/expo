---
title: Introduction
---

import Highlight from '~/components/plugins/Highlight';
import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';

Welcome to the beginner Expo tutorial. This is a complete tutorial to start your journey on building universal applications with Expo. A universal app is simply an app that shares one code base and runs on multiple native platforms such as iOS, Android, and the web.

## About this tutorial

In this tutorial, you are going to build an app for iOS, Android, and the web that, in a nutshell, covers the following topics:

- Initializing an Expo App
- Breaking down app layout and implementing it with Flexbox
- Use a native image picker user interface (UI) to select an image from the platform's media library
- Create a sticker modal using Modal and FlatList components from React Native
- Add and handle gestures to interact with the sticker
- Use third-party libraries to capture a screenshot and save that image on the platform
- Handle any platform differences between mobile and web
- Finally, go through the process of configuring a status bar, a splash screen, and an icon to complete the app

Here is the final demo of the app working on an iOS simulator, an Android device, and the web browser:

<Video file="tutorial/final.mp4" />

From the topic list above, the objective of this tutorial is to get you started with Expo and familiarize you with the Expo SDK. You will use different Expo libraries such as `expo-image-picker`, `expo-media-library`, and `expo-status-bar`. Some of the functionalities these libraries will help you implement are picking an image from the platform's media library, saving the image back to the media library, and so on. In the Expo SDK ecosystem, these modules are available to you, as an app developer, to seamlessly use native functionalities across different platforms without worrying about handling the differences on the mobile platforms.

Further in the tutorial, we will also use libraries like [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) and [Reanimated](https://docs.swmansion.com/react-native-reanimated/) to add interactivity and to implement pan and tap gestures to add interactive functionalities.

We will also dive into using third-party libraries and what are the ways you can find which third-party library to use with your app. Then, using these third-party libraries, you will also learn how to create functionalities by handling platform differences across the web and mobile platforms.

Each module of this tutorial contains the code for that specific part, so feel free to follow along either by creating your own app from scratch or using Expo Snack examples to copy and paste the code if you get lost in between.

## How to use this tutorial

We believe in "learning by doing" so this tutorial emphasizes doing over explaining. You can follow along the journey of building the app in the following ways:

- Create a new Expo project and start building the app from scratch
- Clone the starter project and start building the app from scratch

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

If you're already familiar with Expo, feel free to jump ahead to specific modules you want to learn more about it. However, if you're completely new, go to the next step in which you will learn [how to initialize an app with Expo](/tutorial/initialize-app/).
