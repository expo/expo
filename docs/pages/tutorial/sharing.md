---
title: Sharing the image
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

Similar to expo-image-picker, the functionality that we need to share is available in an Expo library &mdash; this one is called [expo-sharing](/versions/latest/sdk/sharing).

## Installing expo-sharing

You can install expo-sharing in the same way as you installed expo-image-picker. In your project directory run:

<Terminal cmd={['$ npx expo install expo-sharing']} />

## Installing expo-image-manipulator

You'll also need expo-image-manipulator. In your project directory run:

<Terminal cmd={['$ npx expo install expo-image-manipulator']} />

## Using expo-sharing to share an image

<SnackInline label="Sharing" templateId="tutorial/sharing-simple" dependencies={['expo-image-picker', 'expo-sharing']}>

{/* prettier-ignore */}
```js
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, /* @info This is required to determine which platform the code is going to run */ Platform /* @end */ } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
/* @info As always, we must import it to use it */ import * as Sharing from 'expo-sharing'; /* @end */

/* @info As always, we must import it to use it */ import * as ImageManipulator from "expo-image-manipulator"; /* @end */

export default function App() {
  const [selectedImage, setSelectedImage] = React.useState(null);

  let openImagePickerAsync = async () => {
    /* most contents of this function were hidden here to keep the example brief */

    setSelectedImage({ localUri: pickerResult.uri });
  };

  /* @info Share the selected image if sharing is available on the user's device */
  let openShareDialogAsync = async () => {    
    if (Platform.OS === 'web') {
      alert(`Uh oh, sharing isn't available on your platform`);
      return;
    }

    const imageTmp = await ImageManipulator.manipulateAsync(selectedImage.localUri);
    await Sharing.shareAsync(imageTmp.uri);
  }; /* @end */

  if (selectedImage !== null) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: selectedImage.localUri }} style={styles.thumbnail} />
        /* @info Add a button to call the new share function */
        <TouchableOpacity onPress={openShareDialogAsync} style={styles.button}>
          <Text style={styles.buttonText}>Share this photo</Text>
        </TouchableOpacity>
        /* @end */
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

Everything is working great! The operating system share dialog opens up and is ready to share our selected image.

## Platform differences with web

<Video file={"tutorial/sharing-web-unavailable.mp4"} />

On running the app in a web browser, when we hit "Share this photo" we see that our `alert` warns us that sharing is not available. This is happening because the desktop Chrome browser does not currently provide a way for users to share content.

In the perfect world we want to write code to perform our task just once and have it run the same on every platform. Even on the web, where this is an explicit design goal, it's often necessary to consider differences between web browsers.

Expo tools try to handle smoothing over these differences between iOS, Android, web (and different web browsers) for you, but it isn't always possible. There are two important differences between how the iOS and Android share APIs work and how the Web Share API works.

- It isn't always available on web.
- We can't share local file URIs on web.

> It's actually technically possible in the latest versions of Chrome for Android to share files, but it's very new and not yet supported by `expo-sharing`, so we will ignore that here for now.

<Collapsible summary="Want to learn more about why we can't use expo-sharing in Chrome?">

Sharing didn't work here because the desktop Chrome browser doesn't yet implement the [Web Share API](https://web.dev/web-share/). _"But wait,"_ you say, _"aren't we using expo-sharing, not the Web Share API?"_ You can think of the Expo SDK libraries as translators for different platforms. They speak the language of Expo and turn it into the language of iOS, Android, and web. It isn't always possible to translate from Expo's language to the platform that you're working with. In other words, if the platform doesn't implement a feature, Expo can't tell it to invoke that feature. In some cases Expo can attempt to [polyfill](<https://en.wikipedia.org/wiki/Polyfill_(programming)>) the feature for you, but this isn't always possible. Invoking your operating system's built-in share dialog to share content with other applications needs to be implemented by the platform itself &mdash; Chrome in this case.

</Collapsible>

## Up next

It's time to shift our focus towards the purely aesthetic. In the next step of this tutorial we will [customize our app icon and splash screen](/tutorial/configuration).

{/* TODO(brentvatne): when we have a better workflow for https in expo-cli and a way to open Snack web on mobile we should revisit this */}

{/* ### Getting it working with another browser

Sharing is supported on the following browsers at the time of writing:

- Recent versions of mobile and desktop Safari.
- Recent versions of Chrome for Android.

There is just one small catch &mdash; we need to use `https`. Close `expo-cli` and run it again with `expo start --https`. Now we can copy and paste the URL into Safari and try again. */}
