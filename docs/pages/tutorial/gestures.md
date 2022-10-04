---
title: Add gestures
---

import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';
import Video from '~/components/plugins/Video';
import { LinkBase } from '~/ui/components/Text';

Gestures are a great way to provide an intuitive user experience in an app. The <LinkBase href="https://docs.swmansion.com/react-native-gesture-handler/docs/" openInNewTab>React Native Gesture Handler library</LinkBase> provides a way for built-in native components that can handle gestures. It uses the platform's native touch handling system to recognize pan, tap, rotation, and other gestures.

In this chapter, we are going to add two different gestures using the React Native Gesture Handler library:

- Double tap to scale the size of the emoji sticker.
- Pan to move the emoji sticker around the screen so that the user can place the sticker anywhere on the image

## Step 1: Install libraries

To install `react-native-gesture-handler` run the following command:

<Terminal cmd={['$ npx expo install react-native-gesture-handler']} />

The React Native Gesture Handler library provides a way to interact with the native platform's gesture response system. To animate between gesture states, we will use the <LinkBase href="https://docs.swmansion.com/react-native-reanimated/docs/" openInNewTab>Reanimated library</LinkBase>.

Run the following command to install the `react-native-reanimated` library:

<Terminal cmd={['$ npm install react-native-reanimated']} />

Then, add Reanimated's Babel plugin to **babel.config.js**:

<!-- prettier-ignore -->
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    /* @info Add this line */ plugins: ['react-native-reanimated/plugin'],/* @end */

  };
};
```

## Step 2: Enable gesture interactions

To get gesture interactions to work in the app, we’ll use `<GestureHandlerRootView>` from `react-native-gesture-handler` to wrap our project's code.

To accomplish this, replace the root level `<View>` component in **App.js** with `<GestureHandlerRootView>`.

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

## Step 3: Creating animated components

Open the **EmojiSticker.js** file in the **components** directory. Inside it, import `Animated` from the `react-native-reanimated` library to create animated components.

```js
import Animated from 'react-native-reanimated';
```

To make a double tap gesture work, we will apply animations to the `<Image>` component by passing it as an argument to the `Animated.createAnimatedComponent()`.

```js
// after import statements, add the following line

const AnimatedImage = Animated.createAnimatedComponent(Image);
```

The `createAnimatedComponent()` can wrap any component. It looks at the `style` prop of the component, determines which value is animated, and then applies updates to create an animation.

## Step 4: Add a tap Gesture

React Native Gesture Handler allows us to add behavior when it detects user input, like a double tap event.

In the **EmojiSticker.js** file, import `TapGestureHandler` from `react-native-gesture-handler` and the hooks below from `react-native-reanimated`. These hooks will animate the style on the `<AnimatedImage>` component for the sticker when the tap gesture is recognized.

```js
import { TapGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';
```

Inside the `<EmojiSticker>` component, create a reference called `scaleImage` using the `useSharedValue()` hook. This hook will take the value of `imageSize` as its initial value.

```js
const scaleImage = useSharedValue(imageSize);
```

Creating a shared value using the `useSharedValue()` hook has many advantages. It helps to mutate a piece of data and allows running animations based on the current value. A shared value can be accessed and modified using the `.value` property. It will scale the initial value of `scaleImage` so that when a user double-taps the sticker, it scales to twice its original size. It is done by creating a function called `onDoubleTap()`. This method will use the `useAnimatedGestureHandler()` hook to animate the transition while scaling the sticker image.

Create the following function in the `<EmojiSticker>` component:

```js
const onDoubleTap = useAnimatedGestureHandler({
  onActive: () => {
    if (scaleImage.value) {
      scaleImage.value = scaleImage.value * 2;
    }
  },
});
```

To animate the transition, let's use a spring-based animation. We will use the `withSpring()` hook provided by `react-native-reanimated`.

The `useAnimatedStyle()` hook from `react-native-reanimated` is used to create a style object that will be applied to the sticker image. It will update styles using the shared values when the animation happens. In this case, we are scaling the size of the image, which is done by manipulating the `width` and `height` properties. The initial values of these properties are set to `imageSize`. Create an `imageStyle` variable and add it to the `EmojiSticker` component:

```js
const imageStyle = useAnimatedStyle(() => {
  return {
    width: withSpring(scaleImage.value),
    height: withSpring(scaleImage.value),
  };
});
```

Next, wrap the `<AnimatedImage>` component that displays the sticker on the screen with the `<TapGestureHandler>` component.

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
    <View style={{ top: -350 }}>
      <TapGestureHandler onGestureEvent={onDoubleTap} numberOfTaps={2}>
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

In the above snippet, the `onGestureEvent` prop takes the value of the `onDoubleTap()` function and triggers it when a user taps the sticker image. The `numberOfTaps` prop determines how many taps are required.

Let's take a look at our app now:

<Video file="tutorial/tap-gesture.mp4" />

> For a complete reference on the tap gesture API, refer to the <LinkBase href="https://docs.swmansion.com/react-native-gesture-handler/docs/api/gestures/tap-gesture" openInNewTab>React Native Gesture Handler</LinkBase> documentation.

## Step 5: Add a pan gesture

A pan gesture allows recognizing a dragging gesture and tracking its movement.

We will use the gesture handler to drag the sticker across the image. React Native Gesture Handler library provides the `<PanGestureHandler>` component for handling such gestures.

In the **EmojiSticker.js**, import `PanGestureHandler` from `react-native-gesture-handler` library.

<!-- prettier-ignore -->
```js
import { /* @info */ PanGestureHandler,/* @end */ TapGestureHandler} from "react-native-gesture-handler";
```

Create an `<AnimatedView>` component using the `Animated.createAnimatedComponent()` method. Then use it to wrap the `<TapGestureHandler>` component.

```js
const AnimatedView = Animated.createAnimatedComponent(View);

// …

<AnimatedView style={{ top: -350 }}>
  <TapGestureHandler onGestureEvent={onDoubleTap} numberOfTaps={2}>
    // …
  </TapGestureHandler>
</AnimatedView>;
```

Now, create two new shared values: `translateX` and `translateY`.

```js
export default function EmojiSticker({ imageSize, stickerSource }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // rest of the code
}
```

These translation values will move the sticker around the screen. Since the sticker moves along both axes, we need to track both the X and Y values separately.

Using the `useSharedValue()` hook, both translation variables have an initial position of `0`. This means that the position the sticker is initially placed is considered the starting point. This value sets the initial position of the sticker when the gesture starts.

In the previous step, we triggered the `onActive()` callback for the tap gesture inside the `useAnimatedGestureHandler()` method. Similarly, for the pan gesture, we have to specify two callbacks:

- `onStart()`: when the gesture starts or is at its initial position
- `onActive()`: when the gesture is active and is moving

Create an `onDrag()` method to handle the pan gesture.

<!-- prettier-ignore -->
```js
const onDrag = useAnimatedGestureHandler({
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

Both the `onStart` and `onActive` methods accept `event` and `context` as parameters. In the `onStart` method, we’ll use `context` to store the initial values of `translateX` and `translateY`. In the `onActive` callback, we’ll use the `event` to get the current position of the pan gesture and `context` to get the previously stored values of `translateX` and `translateY`.

Next, use the `useAnimatedStyle()` hook to transform the array. React Native provides this array property to manipulate the position of a component. This array accepts one or multiple objects with a `transform` as its key.

For the `<AnimatedView>` component, we need to set the `transform` property to the `translateX` and `translateY` values. This will change the sticker's position when the gesture is active.

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

Then add the `containerStyle` from the above snippet on the `<AnimatedView>` component to apply the transform styles.

Finally, update the `<EmojiSticker>` component so that the `<PanGestureHandler>` component becomes the top-level component.

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
    <PanGestureHandler onGestureEvent={onDrag}>
      <AnimatedView style={[containerStyle, { top: -350 }]}>
        <TapGestureHandler onGestureEvent={onDoubleTap} numberOfTaps={2}>
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

Let's take a look at our app:

<Video file="tutorial/pan-gesture.mp4" />

## Up next

We successfully implemented pan and tap gestures.

In the next chapter, we’ll learn [how to integrate a third-party library in an Expo app](/tutorial/third-party-libraries), use it to take a screenshot of the image and the sticker, and handle any platform differences between mobile and web.
