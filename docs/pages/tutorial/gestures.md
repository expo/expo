---
title: Add gestures
---

import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';
import Video from '~/components/plugins/Video';

Gestures are a great way to provide an intuitive user experience in an application. In React Native, this can be achieved by using a [gesture responder system](https://reactnative.dev/docs/gesture-responder-system). It manages the lifecycle of touch events and gesture recognizers. However, it doesn't help address the performance issues since the gesture system runs on the JavaScript thread.

[React Native Gesture Handler library](https://docs.swmansion.com/react-native-gesture-handler/docs/) provides a way for built-in native components that can handle gestures. It uses the platform's native touch handling system to recognize pan, tap, rotation, and other gestures. It also solves the issue of performance handling complex gestures since it runs on the UI thread.

In this module, you are going to add two different gestures using React Native Gesture Handler library:

- Tap to scale the size of the sticker on double tap.
- Pan to move the sticker around the screen so that the sticker is placed anywhere on the image

> For more information on learning differences between JavaScript thread and UI thread, see [React Native performance](https://reactnative.dev/docs/performance).

## Step 1: Install libraries

To use React Native Gesture Handler library, you have to install the following libraries:

- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)

The `react-native-reanimated` works seamlessly with the `react-native-gesture-handler` library to create smooth animations and interactions.

To install these libraries, run the following command:

<Terminal cmd={['$ npx expo install react-native-gesture-handler react-native-reanimated']} />

> If you are using the starter template, you can skip this step. The library is already installed in the template.

The `react-native-reanimated` library requires an extra configuration step:

- Open `babel.config.js` file at the root of the project.
- Add `react-native-reanimated` to the `plugins` array.

<!-- prettier-ignore -->
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    /* @info */
    plugins: ["react-native-reanimated/plugin"],
    /* @end */
  };
};
```

> If you are using the starter template, you can skip this step. The configuration is already done in **app.json** file.

## Step 2: Enable gesture interactions

To ensure gesture interactions work in the app, use `GestureHandlerRootView` from `react-native-gesture-handler` to wrap the rest of the application's code. Replacing the root level `View` component in **App.js** with `GestureHandlerRootView`.

<!-- prettier-ignore -->
```js
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    return (
    <GestureHandlerRootView style={styles.container}>
    /* rest of the code */
    </GestureHandlerRootView>
  )
}
```

Now, the gestures will work seamlessly when you use them from the `react-native-gesture-handler` library.

## Step 3: Creating animated components

The React Native Gesture Handler library provides a way to interact with the native platform's gesture responding system and detect gestures. However, it does not offer a way to manipulate and transform the component from the initial state to the state you want it to behave.

For this reason, Reanimated library is used to create animated components so that the transition to change from one state can happen by manipulating the styles of the component on those components.

Open the **EmojiSticker.js** file in the **components** directory. Inside it, import `Animated` from the `react-native-reanimated` library to create animated components.

```js
import Animated from 'react-native-reanimated';
```

Then, define the component that you want to apply animations. To make the tap gesture work, you must apply animations to the `Image` component. Pass it as a parameter to the `Animated.createAnimatedComponent()`.

```js
// after import statements, add the following line

const AnimatedImage = Animated.createAnimatedComponent(Image);
```

The `createAnimatedComponent` can wrap any component. It has a built-in case to look at the `style` prop of the component, determine which value is animated, and then apply those updates. It will be useful to apply animated styles later in this chapter.

## Step 4: Add a tap Gesture

A tap gesture recognizes a tap when a finger touches the device's screen. The finger must not move from the initial touch point. During this process, you can also configure the number of taps (one or more) a finger can touch on the screen. React Native Gesture Handler library provides `TapGestureHandler` for handling such gestures.

In the **EmojiSticker.js** file, import `TapGestureHandler` from `react-native-gesture-handler` and hooks from `react-native-reanimated`. These hooks will animate the style on the `AnimatedImage` component for the sticker when the tap gesture is recognized.

```js
import { TapGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';
```

Inside the `EmojiSticker` component, create a reference called `scaleImage` using the `useSharedValue` hook. This hook will take the value of `imageSize` as an initial value.

```js
const scaleImage = useSharedValue(imageSize);
```

Creating a shared value using the `useSharedValue` hook has many advantages. It helps to mutate a piece of data and allows running animations based on the current value. A shared value can be accessed and modified using the `.value` property. It will scale the initial value of `scaleImage` so that when a user double-taps the sticker, it scales to twice its original size. It is done by creating a handler method called `tapGestureHandler`. This method uses the `useAnimatedGestureHandler` hook to animate the transition while scaling the sticker image.

Create the following method in the `EmojiSticker` component:

```js
const tapGestureHandler = useAnimatedGestureHandler({
  onActive: () => {
    if (scaleImage.value) {
      scaleImage.value = scaleImage.value * 2;
    }
  },
});
```

To animate the transition, let's use a spring-based animation. The `withSpring` provided by `react-native-reanimated` is a built-in animation. In the app, it scales the sticker image when a user double-taps it.

The `useAnimatedStyle` hook from `react-native-reanimated` is used to create a style object that will be applied to the sticker image to update the initial values using the shared values when the animation happens. In this case, you are scaling the size of the image which is done by manipulating the `width` and `height` properties. The initial values of these properties are set to `imageSize`. The `imageStyle` property controls the initial values of these properties to the scaled values. Add it to the `EmojiSticker` component:

```js
const imageStyle = useAnimatedStyle(() => {
  return {
    width: withSpring(scaleImage.value),
    height: withSpring(scaleImage.value),
  };
});
```

Next, wrap the `AnimatedImage` component that displays the sticker on the screen with the `TapGestureHandler` component.

<SnackInline
label="Handling tap gesture"
templateId="tutorial/06-gestures/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons', 'react-native-gesture-handler', 'react-native-reanimated']}
files={{
  'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
  'assets/images/emoji1.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/be9751678c0b3f9c6bf55f60de815d30',
  'assets/images/emoji2.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/7c0d14b79e134d528c5e0801699d6ccf',
  'assets/images/emoji3.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/d713e2de164764c2ab3db0ab4e40c577',
  'assets/images/emoji4.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ac2163b98a973cb50bfb716cc4438f9a',
  'assets/images/emoji5.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/9cc0e2ff664bae3af766b9750331c3ad',
  'assets/images/emoji6.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ce614cf0928157b3f7daa3cb8e7bd486',
  'components/ImageViewer.js': 'tutorial/02-image-picker/ImageViewer.js',
  'components/Button.js': 'tutorial/03-button-options/Button.js',
  'components/CircleButton.js': 'tutorial/03-button-options/CircleButton.js',
  'components/IconButton.js': 'tutorial/03-button-options/IconButton.js',
  'components/EmojiPicker.js': 'tutorial/04-modal/EmojiPicker.js',
  'components/EmojiList.js': 'tutorial/05-emoji-list/EmojiList.js',
  'components/EmojiSticker.js': 'tutorial/06-gestures/EmojiSticker.js',
}}>

<!-- prettier-ignore -->
```js
export default function EmojiSticker({ imageSize, stickerSource }) {
  // rest of the code
  return (
    <View style={{ top: -450 }}>
      <TapGestureHandler onGestureEvent={tapGestureHandler} numberOfTaps={2}>
        <AnimatedImage
          source={stickerSource}
          resizeMode="contain"
          style={[imageStyle, { width: imageSize, height: imageSize }]}
        />
      </TapGestureHandler>
    </View>
  );
}
```

</SnackInline>

In the above snippet, the `onGestureEvent` prop takes the value of the `tapGestureHandler` method and triggers it when a user taps the sticker image. The `numberOfTaps` determines the taps that take the method to get triggered.

On running the app, you will get a similar output on all platforms:

<Video file="tutorial/tap-gesture.mp4" />

> For a complete reference on the tap gesture API, refer to the [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/api/gestures/tap-gesture) documentation.

## Step 5: Add a pan gesture

A pan gesture allows recognizing a dragging gesture and tracking its movement simultaneously. This type of gesture is activated when a finger is placed on the screen and moved around for a specific distance.

The tutorial app will use this gesture handler to drag the sticker across the placeholder image. React Native Gesture Handler library provides `PanGestureHandler` for handling such gestures.

In the **EmojiSticker.js**, import `PanGestureHandler` from `react-native-gesture-handler` library.

<!-- prettier-ignore -->
```js
import { /* @info */ PanGestureHandler,/* @end */ TapGestureHandler} from "react-native-gesture-handler";
```

It wraps the top-level `View` component in this file. Create an `AnimatedView` component using the `createAnimatedComponent` method, which wraps both the `TapGestureHandler` and the `AnimatedImage` components.

```js
const AnimatedView = Animated.createAnimatedComponent(View);
```

Inside the `EmojiPicker` component, create two new shared values: `translateX` and `translateY`.

```js
export default function EmojiSticker({ imageSize, stickerSource }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // rest of the code
}
```

These translation values move the sticker around the screen. For example, dragging the sticker moves along the X-axis and Y-axis. Since the sticker moves along both axes, we need to track both the X and Y axes separately.

Using the `useSharedValue` hook, both translation variables have an initial position of `0`. This means that the position the sticker is initially placed is considered the starting point. This value sets the initial position of the sticker when the gesture starts.

In the previous step, you triggered the `onActive` callback for the tap gesture inside the `useAnimatedGestureHandler` method. Similarly, for the pan gesture, you have to specify two callbacks in this method:

- `onStart`: when the gesture starts or is at its initial position
- `onActive`: when the gesture is active and is moving

These callbacks declare the state flows for a gesture. There are other callbacks available where you can manipulate the gesture state. For more information, see [state flows](https://docs.swmansion.com/react-native-gesture-handler/docs/under-the-hood/states-events#state-flows).

Create a `panGestureHandler` method to handle the pan gesture.

<!-- prettier-ignore -->
```js
const panGestureHandler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    context.translateX = translateX.value;
    context.translateY = translateY.value;
  },
  onActive: (event, context) => {
    translateX.value = event.translationX + context.translateX;
    translateY.value = event.translationY + context.translateY;
  },
});
```

Both methods `onStart` and `onActive` accept `event` and `context` as parameters. In the `onStart` callback, you use `context` to store the initial values of `translateX` and `translateY`. In the `onActive` callback, you use the `event` to get the current position of the pan gesture and `context` to get the previously stored values of `translateX` and `translateY`.

Next, use the `useAnimatedStyle` method to `transform` the array. React Native provides this array property to manipulate the position of a component. This array accepts one or multiple objects with a `transform` as its key.

For the `AnimatedView` component, you need to set the `transform` property to the `translateX` and `translateY` values. This will help change the sticker's position when the gesture is active.

<!-- prettier-ignore -->
```js
const containerStyle = useAnimatedStyle(() => {
  return {
    transform: [
      {
        translateX: translateX.value,
      },
      {
        translateY: translateY.value,
      },
    ],
  };
});
```

The `containerStyle` from the above snippet is used on the `AnimatedView` component to apply the transform styles.

Next, update the JSX returned by the `EmojiSticker` component. The `PanGestureHandler` component becomes the top-level component.

<SnackInline
label="Handle pan gesture"
templateId="tutorial/06-gestures/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons', 'react-native-gesture-handler', 'react-native-reanimated']}
files={{
  'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
  'assets/images/emoji1.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/be9751678c0b3f9c6bf55f60de815d30',
  'assets/images/emoji2.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/7c0d14b79e134d528c5e0801699d6ccf',
  'assets/images/emoji3.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/d713e2de164764c2ab3db0ab4e40c577',
  'assets/images/emoji4.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ac2163b98a973cb50bfb716cc4438f9a',
  'assets/images/emoji5.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/9cc0e2ff664bae3af766b9750331c3ad',
  'assets/images/emoji6.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ce614cf0928157b3f7daa3cb8e7bd486',
  'components/ImageViewer.js': 'tutorial/02-image-picker/ImageViewer.js',
  'components/Button.js': 'tutorial/03-button-options/Button.js',
  'components/CircleButton.js': 'tutorial/03-button-options/CircleButton.js',
  'components/IconButton.js': 'tutorial/03-button-options/IconButton.js',
  'components/EmojiPicker.js': 'tutorial/04-modal/EmojiPicker.js',
  'components/EmojiList.js': 'tutorial/05-emoji-list/EmojiList.js',
  'components/EmojiSticker.js': 'tutorial/06-gestures/CompleteEmojiSticker.js',
}}>

<!-- prettier-ignore -->
```js
export default function EmojiSticker({ imageSize, stickerSource }) {
  // rest of the code

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <AnimatedView style={[containerStyle, { top: -450 }]}>
        <TapGestureHandler onGestureEvent={tapGestureHandler} numberOfTaps={2}>
          <AnimatedImage
            source={stickerSource}
            resizeMode="contain"
            style={[imageStyle, { width: imageSize, height: imageSize }]}
          />
        </TapGestureHandler>
      </AnimatedView>
    </PanGestureHandler>
  );
}
```

</SnackInline>

On running the app, you will get a similar output on all platforms:

<Video file="tutorial/pan-gesture.mp4" />

## Up next

You have successfully implemented pan and tap gesture recognizers to handle these gestures in the app.

In the next chapter, let's learn [how to integrate a third-party library in an Expo app](/tutorial/third-party-libraries), use it to take a screenshot of the image and the sticker, and handle any platform differences between mobile and web.
