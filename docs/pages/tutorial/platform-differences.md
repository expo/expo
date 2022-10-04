---
title: Handle platform differences
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Terminal } from '~/ui/components/Snippet';
import { LinkBase } from '~/ui/components/Text';

Android, iOS, and the web have different capabilities. In our case, Android and iOS both are able to capture a screenshot with the `react-native-view-shot` library, however web browsers cannot.

In this chapter, we’ll learn how to make an exception for web browsers to get the same functionality on all platforms.

## Step 1: Install and import dom-to-image

To capture a screenshot and save it as an image, we’ll use a third-party library called <LinkBase href="https://github.com/tsayen/dom-to-image#readme" openInNewTab>dom-to-image</LinkBase>. It allows taking a screenshot of any DOM node and turning it into a vector (SVG) or raster (PNG or JPEG) image.

Run the following command to install it:

<Terminal cmd={['$ npm install dom-to-image']} />

To use it, let's import it into **App.js**:

```js
import domtoimage from 'dom-to-image';
```

## Step 2: Add platform-specific code

React Native provides a `Platform` module that returns the platform on which the app is currently running. Using it, we can implement platform-specific code.

Import the `Platform` module in **App.js**:

```js
import { StyleSheet, View, Platform } from 'react-native';
```

Inside the `onSaveImageAsync()` function in the `<App>` component, we’ll use `Platform.OS` to check whether the platform is `"web"`. If it is not `"web"`, we’ll run the logic added previously. If it is `"web"`, we’ll use the `domtoimage.toJpeg()` method to convert and capture the current `<View>` as a JPEG image.

<SnackInline
label="Take a screenshot"
templateId="tutorial/08-run-on-web/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons', 'react-native-gesture-handler', 'react-native-reanimated', 'react-native-view-shot', 'expo-media-library', 'dom-to-image@2.6.0']}
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

```js
const onSaveImageAsync = async () => {
  if (Platform.OS !== 'web') {
    try {
      const localUri = await captureRef(imageRef, {
        height: 440,
        quality: 1,
      });
      await MediaLibrary.saveToLibraryAsync(localUri);
      if (localUri) {
        alert('Saved!');
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    domtoimage
      .toJpeg(imageRef.current)
      .then(dataUrl => {
        let link = document.createElement('a');
        link.download = 'sticker-smash.jpeg';
        link.href = dataUrl;
        link.click();
      })
      .catch(e => {
        console.log(e);
      });
  }
};
```

</SnackInline>

On running the app in a web browser, we can now save a screenshot:

<Video file="tutorial/web.mp4" />

## Up next

The app does everything we set out for it to do, so it's time to shift our focus towards the purely aesthetic. In the next chapter, you will [customize the app's status bar, splash screen and app icon](/tutorial/configuration.md).
