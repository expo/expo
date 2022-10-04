---
title: Use a third-party library
---

import SnackInline from '~/components/plugins/SnackInline';
import { Terminal } from '~/ui/components/Snippet';
import Video from '~/components/plugins/Video';
import { LinkBase } from '~/ui/components/Text';

In this chapter, we will learn how to use a third-party library. We’ll use the following libraries:

- <LinkBase href="https://github.com/gre/react-native-view-shot" openInNewTab>react-native-view-shot</LinkBase> allows taking a screenshot.
- <LinkBase href="/versions/latest/sdk/media-library/" openInNewTab>expo-media-library</LinkBase>: allows accessing a device's media library to save an image.

> We can find hundreds of other libraries on [React Native Directory](https://reactnative.directory/).

## Step 1: Install libraries

To install both libraries, run the following commands:

<Terminal cmd={['$ npx expo install react-native-view-shot expo-media-library']} />

## Step 2: Ask for permissions

When creating an app that requires access to potentially sensitive information, such as access to the media library, we must first ask for the user's permission.

`expo-media-library` provides a `usePermissions()` hook which gives the permission `status` and a `requestPermission()` method to ask for access to the media library when permission is not granted.

Initially, when the app loads for the first time and the permission status is neither granted nor denied, the value of the `status` is `null`. When asked for permission, a user can either grant the permission or deny it. We can add a condition to check if it is `null`, and if it is, trigger the `requestPermission()` method.

Add the following code snippet inside the `<App>` component:

```js
import * as MediaLibrary from 'expo-media-library';

// …

export default function App() {
  const [status, requestPermission] = MediaLibrary.usePermissions();

  if (status === null) {
    /* @info This will trigger a dialog box for the user to grant or deny the permission. */
    requestPermission();
    /* @end */
  }

  // ...
}
```

Once the permission is given, the value of the `status` changes to `granted`.

## Step 3: Picking a library to take screenshots

To allow the user to take a screenshot within the app, we’ll use [`react-native-view-shot`](https://github.com/gre/react-native-view-shot). It allows capturing a `<View>` as an image.

Let's import it into **App.js**.

```js
import { captureRef } from 'react-native-view-shot';
```

## Step 4: Create a ref to save the current view

The `react-native-view-shot` library provides a method called `captureRef()` that captures a screenshot of a `<View>` in the app and returns a URI of the captured `<View>` as an image.

To capture a `<View>`, wrap the `<ImageViewer>` and `<EmojiSticker>` components inside a `<View>` and then pass a reference to it. Using the `useRef()` hook from React, let's create an `imageRef` variable inside `<App>`.

<!-- prettier-ignore -->
```js
import { useState, useRef } from 'react';

export default function App() {
  const imageRef = useRef();

  // ...

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.imageContainer}>
        <View ref={imageRef} collapsable={false}>
          <ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} />
          {pickedEmoji !== null ? (
            <EmojiSticker imageSize={SIZE} stickerSource={pickedEmoji} />
          ) : null}
        </View>
      </View>
            
      /* ... */
    </GestureHandlerRootView>
  );
}
```

## Step 5: Capture a screenshot and save it

Now we can capture a screenshot of the view by calling the `captureRef()` method from `react-native-view-shot` inside the `onSaveImageAsync()` function. `captureRef()` accepts an optional argument where we can pass the `width` and `height` of the area we’d like to capture a screenshot for. We can <LinkBase href="https://github.com/gre/react-native-view-shot#capturerefview-options-lower-level-imperative-api" openInNewTab>read more about available options</LinkBase> in the library's documentation.

The `captureRef()` method returns a promise that resolves to the URI of the captured screenshot. We will pass this URI as a parameter to <LinkBase href="/versions/latest/sdk/media-library/#medialibrarysavetolibraryasynclocaluri" openInNewTab>`MediaLibrary.saveToLibraryAsync()`</LinkBase>, which will save the screenshot to the device's media library.

Update the `onSaveImageAsync()` function with the following code:

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
  const onSaveImageAsync = async () => {
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

Now, choose a photo and add a sticker. Then tap the “Save” button. We should see the following result:

<Video file="tutorial/saving-screenshot.mp4" />

## Up next

The `react-native-view-shot` and `expo-media-library` work only on Android and iOS, but we’d like our app to work on web as well.

In the next chapter, let's learn how to [handle the differences between mobile and web platforms](/tutorial/platform-differences).
