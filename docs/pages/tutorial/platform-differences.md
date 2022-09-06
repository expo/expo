---
title: Handle platform differences
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Terminal } from '~/ui/components/Snippet';

In the perfect world, you will want to write code to perform the task just once and have it run the same on every platform. However, that's not the case sometimes. For example, capturing screenshots on mobile and web is handled differently. Even on the web, where this is an explicit design goal, it's often necessary to consider differences between web browsers.

Expo tools try to sort out these differences between iOS, Android, and web (and different web browsers) for you, but it isn't always possible. In such scenarios, you can handle the code by distinguishing between the mobile and web platforms. In this chapter, let's handle capturing the screenshot and downloading the captured image for the web.

## Step 1: Install dom-to-image

To implement the functionality of capturing a screenshot and saving it as an image file on the machine from the web, let's use a third-party library [dom-to-image](https://github.com/tsayen/dom-to-image#readme). It allows capturing any DOM node and turning it into a vector (SVG) or raster (PNG or JPEG) image.

Install this library in your Expo project by running:

<Terminal cmd={["$ npm install dom-to-image"]} />

After installing this library, import it into **App.js**:

```js
import domtoimage from 'dom-to-image';
```

## Step 2: Add platform-specific code

React Native provides a `Platform` module that detects the platform in which the app is running. Using this module, you can add a detection logic to implement platform-specific code.

First, import the `Platform` module in **App.js**:

```js
import { StyleSheet, View, Platform } from 'react-native';
```

Inside the `saveImageHandler` method in the `App` component, use `Platform.OS` to check whether the code platform is detected as web or not. If it is not web, run the logic added previously. If it is web, use the `domtoimage.toJpeg` method to convert and capture the current view to a JPEG image and download it.

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
const saveImageHandler = async () => {
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
        link.download = 'my-image-name.jpeg';
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

On running the app in a web browser, you will get a similar output:

<Video file="tutorial/web.mp4" />

## Up next

The app does everything we set out for it to do, so it's time to shift our focus towards the purely aesthetic. In the next chapter, you will [customize the app's status bar, splash screen and app icon](/tutorial/configuration.md).
