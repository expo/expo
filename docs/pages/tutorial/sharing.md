---
title: Sharing the image
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

Similar to expo-image-picker, the functionality that we need to share is available in an Expo library &mdash; this one is called [expo-sharing](../versions/latest/sdk/sharing.md).

## Installing expo-sharing

You can install expo-sharing in the same way as you installed expo-image-picker. In your project directory run:

<Terminal cmd={['$ expo install expo-sharing']} />

## Using expo-sharing to share an image

<SnackInline label="Sharing" templateId="tutorial/sharing-simple" dependencies={['expo-image-picker', 'expo-sharing']}>

<!-- prettier-ignore -->
```js
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
/* @info As always, we must import it to use it */ import * as Sharing from 'expo-sharing'; /* @end */

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

    await Sharing.shareAsync(selectedImage.localUri);
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

🥰 Everything is working great! The operating system share dialog opens up and is ready to share our selected image.

## Running the app on the web

<!-- ### Using Google Chrome for desktop -->

<Video file={"tutorial/sharing-web-unavailable.mp4"} />

😱 Uh oh. When we hit "Share this photo" we see that our `alert` warns us that sharing is not available. This is happening because the desktop Chrome browser does not currently provide a way for users to share content.

<Collapsible summary="Want to learn more about why we can't use expo-sharing in Chrome?">

Sharing didn't work here because the desktop Chrome browser doesn't yet implement the [Web Share API](https://web.dev/web-share/). _"But wait,"_ you say, _"aren't we using expo-sharing, not the Web Share API?"_ You can think of the Expo SDK libraries as translators for different platforms. They speak the language of Expo and turn it into the language of iOS, Android, and web. It isn't always possible to translate from Expo's language to the platform that you're working with. In other words, if the platform doesn't implement a feature, Expo can't tell it to invoke that feature. In some cases Expo can attempt to [polyfill](<https://en.wikipedia.org/wiki/Polyfill_(programming)>) the feature for you, but this isn't always possible. Invoking your operating system's built-in share dialog to share content with other applications needs to be implemented by the platform itself &mdash; Chrome in this case.

</Collapsible>

## Working with what we have available

In the next section we are going to look at how we can handle this and another important platform difference. [Continue to "Handling platform differences"](../tutorial/platform-differences.md).

<!-- TODO(brentvatne): when we have a better workflow for https in expo-cli and a way to open Snack web on mobile we should revisit this -->

<!-- ### Getting it working with another browser

Sharing is supported on the following browsers at the time of writing:

- Recent versions of mobile and desktop Safari.
- Recent versions of Chrome for Android.

There is just one small catch &mdash; we need to use `https`. Close `expo-cli` and run it again with `expo start --https`. Now we can copy and paste the URL into Safari and try again. -->
