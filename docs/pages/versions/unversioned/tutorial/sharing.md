---
title: Sharing the image
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '../../../../components/plugins/Video'

Similar to expo-image-picker, the functionality that we need to share is available in an Expo library &mdash; this one is called [expo-sharing](../../sdk/sharing/).

## Installing expo-sharing

You can install expo-sharing in the same way as you installed expo-image-picker:

- Run `expo install expo-sharing` in your project directory.

## Using expo-sharing to share an image

<SnackInline label="Sharing" templateId="tutorial/sharing-simple" dependencies={['expo-image-picker', 'expo-sharing']}>

```jsx
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
/* @info As always, we must import it to use it */import * as Sharing from 'expo-sharing';/* @end */


export default function App() {
  let [selectedImage, setSelectedImage] = React.useState(null);

  let openImagePickerAsync = async () => {
    /* most contents of this function were hidden here to keep the example brief */

    setSelectedImage({ localUri: pickerResult.uri });
  };

  /* @info Share the selected image if sharing is available on the user's device */
  let openShareDialogAsync = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      alert(`Uh oh, sharing isn't available on your platform`);
      return;
    }

    Sharing.shareAsync(selectedImage.localUri);
  };/* @end */


  if (selectedImage !== null) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: selectedImage.localUri }} style={styles.thumbnail} />

        /* @info Add a button to call the new share function */
        <TouchableOpacity onPress={openShareDialogAsync} style={styles.button}>
          <Text style={styles.buttonText}>Share this photo</Text>
        </TouchableOpacity>/* @end */

      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Our logo, instructions, and picker button are hidden here to keep the example brief */}
    </View>
  );
}
```

</SnackInline>

## Running the app on Android and iOS

<Video file={"tutorial/sharing-native.mp4"} />

🥰 Everything is working great! The operating system share dialog opens up and is ready to share our selected image.

## Running the app on the web

<!-- ### Using Google Chrome for desktop -->

<Video file={"tutorial/sharing-web-unavailable.mp4"} />

😱 Uh oh. When we hit "Share this photo" we see that our `alert` warns us that sharing is not available. This is happening because the desktop Chrome browser does not currently provide a way for users to share content.

<div style={{marginTop: '-1rem'}} />

<details><summary><h4>Want to learn more about why we can't use expo-sharing in Chrome?</h4></summary>

<p>

Sharing didn't work here because the desktop Chrome browser doesn't implement the [Web Share API](https://web.dev/web-share/) [(you can see a list of supported browsers here)](https://caniuse.com/#feat=web-share). But wait, aren't we using expo-sharing, not the Web Share API? The way `expo-sharing` and other Expo packages work is that they provide a uniform way to use the same functionality on different platforms when it is possible to do so. You can think of these libraries as translators. Imagine we had `Greeting.sayHelloWorld()` &mdash; in California this function would say would say "Hello, world!", in England it would say "'Ello guvna!", and in Spain it would say "Hola, mundo!". If a language did not have a translation for "Hello, world!" then the function would not be able to run successfully. This is what is happening here &mdash; the web is our language and some web browsers don't have the Web Share API, so we can't say "share this image!".

</p>
</details>

## Working with what we have available

In the next section we are going to look at how we can handle this and another import platform difference. [Continue to Handling platform differences](../../tutorial/platform-differences/).


<!-- ### Getting it working with another browser

Sharing is supported on the following browsers at the time of writing:

- Recent versions of mobile and desktop Safari.
- Recent versions of Chrome for Android.

There is just one small catch &mdash; we need to use `https`. Close `expo-cli` and run it again with `expo start --https`. Now we can copy and paste the URL into Safari and try again. -->