---
title: Use a third-party library
---

import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';
import Video from '~/components/plugins/Video';

In this chapter, you will learn how to use a third-party library compatible with the Expo Go app. These are the following libraries that we will use:

- [react-native-view-shot](https://github.com/gre/react-native-view-shot): the third-party library that allows you to add the functionality of taking a screenshot.
- [`expo-media-library`](/versions/latest/sdk/media-library/): Expo module that allows you to access a device's media library and save an image.

Both are compatible with Expo Go, a client app to run Expo projects on a device when in development. It comes with a set of native modules pre-packaged that are compatible with [Expo SDK](/workflow/glossary-of-terms/#expo-sdk). You use the Expo Go app on a device or run it on a simulator. Generally, any third-party library is compatible with the Expo Go client as long as it does not require custom native code configuration. An excellent way to seek which libraries in the community are compatible, search the library name on [reactnative.directory](https://reactnative.directory/).

## Step 1: Install expo-media-library

Let's begin by installing `expo-media-library`. Open your Expo project in the terminal and run the command:

<Terminal cmd={['$ npx expo install expo-media-library']} />

After installing it, import the library in the **App.js** file:

```js
import * as MediaLibrary from 'expo-media-library';
```

## Step 2: Ask for permissions

When creating an app that requires access to potentially sensitive information on a device, such as access to the media library, you must first ask for the app user's permission.

`expo-media-library` provides a `usePermissions` hook. It gives the permission `status` and a `requestPermission` method to ask for access to the media library when permission is not granted.

Initially, when the app loads for the first time and the permission status is neither granted nor denied, the value of the `status` is `null`. When asked for permission, a user can either grant the permission or deny it. You can add a condition to check if it is `null`, and if it is, trigger the `requestPermission` method.

Add the following code snippet inside the `App` component:

```js
export default function App() {
  const [status, requestPermission] = MediaLibrary.usePermissions();

  if (status === null) {
    /* @info This will trigger a dialog box for the user to grant or deny the permission. */
    requestPermission();
    /* @end */
  }

  // rest of the code
}
```

Once the permission is allowed, the value of the `status` changes to `granted`. You can also view the `status` by adding a temporary `console.log(status)` statement. In the terminal window, when the permissions are granted, are logged as a JSON objected:

```json
{
  "accessPrivileges": "all",
  "canAskAgain": true,
  "expires": "never",
  "granted": true,
  "status": "granted"
}
```

## Step 3: Picking a library to take screenshots

To allow the user to take a screenshot within the app, let's use [`react-native-view-shot`](https://github.com/gre/react-native-view-shot). It allows capturing a view in a React Native app as an image.

Looking at this library on [reactnative.directory](https://reactnative.directory/?search=react-native-view-shot), you will find that it is compatible with the Expo Go client.

## Step 4: Install react-native-view-shot

Open up the terminal window, and run the command to install `react-native-view-shot`:

<Terminal cmd={['$ npx expo install react-native-view-shot']} />

After installing this library let's import it into **App.js**.

```js
import { captureRef } from 'react-native-view-shot';
```

## Step 5: Create a ref to save the current view

The `react-native-view-shot` library provides a method called `captureRef` that helps capture a screenshot of the view in the app and returns a URI of the captured view as an image. It's the same method you imported in the previous step.

To capture a view, wrap the `ImageViewer` and `EmojiSticker` components inside a `View` and then pass a reference to it. Using `useRef` from React library, let's create `imageRef` inside the `App` component.

```js
import { useState, useRef } from 'react';

export default function App() {
  const imageRef = useRef();

  // ...

  return (
    <GestureHandlerRootView style={styles.container}>
      <View ref={imageRef} style={styles.screenshotContainer} collapsable={false}>
        <ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} />
        {pickedEmoji !== null ? (
          <EmojiSticker imageSize={SIZE} stickerSource={pickedEmoji} />
        ) : null}
      </View>
      /* ... */
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // rest of the styles remain same
  screenshotContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
```

## Step 6: Capture a screenshot and save it

Now, you can capture a screenshot of the view by calling the `captureRef` method from `react-native-view-shot` inside the `saveImageHandler`. This method accepts an optional object where you can pass the `width` and `height` of the area you want to capture a screenshot for, and other options `format` such as `png` or `jpg`, and `quality`. You can [read more about available options](https://github.com/gre/react-native-view-shot#capturerefview-options-lower-level-imperative-api) in the library's documentation.

The `captureRef` method returns a promise that resolves to the URI of the captured view. You will use this URI as a parameter to [`MediaLibrary.saveToLibraryAsync()`](https://docs.expo.dev/versions/latest/sdk/media-library/#medialibrarysavetolibraryasynclocaluri), which will save the file to the device's media library.

Update the `saveImageHandler` function as the following code snippet:

<SnackInline
label="Take a screenshot"
templateId="tutorial/07-screenshot/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons', 'react-native-gesture-handler', 'react-native-reanimated', 'react-native-view-shot', 'expo-media-library']}
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
export default function App() {
  const saveImageHandler = async () => {
    try {
      const localUri = await captureRef(imageRef, {        
        height: 440,
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(localUri);      
      if (localUri) {
        alert("Saved!");
      }
    } catch (e) {
      console.log(e);
    }
  };
  // ...
}
```

</SnackInline>

On running the app on a mobile, you will get a similar output:

<Video file="tutorial/saving-screenshot.mp4" />

At this point, capturing a screenshot and saving it on the machine using the web app won't work. The `react-native-view-shot` and `expo-media-library` work only on mobile platforms.

## Up next

[reactnative.directory](https://reactnative.directory/) is an open source directory that is maintained by Expo and React Native community members. It has a collection of third-party libraries and tells you about what platforms are supported such as (iOS, Android, Web, Windows and so on) compatibility, license information and more.

When developing your own apps, if any library you find is not compatible with the Expo Go client and uses custom native code, you can still use it with [Development Builds](/development/introduction/).

In the next chapter, let's learn how to [handle the differences between mobile and web platforms](/tutorial/platform-differences).
