---
title: Sharing the image
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '../../../../components/plugins/Video'

Similar to expo-image-picker, the functionality that we need to share is available in an Expo library &mdash; this one is called [expo-sharing](../../sdk/sharing/).

## Installing expo-sharing

You can install expo-sharing in the same way as you installed expo-image-picker:

- **expo-cli**: Run `expo install expo-sharing` in your project directory.
- **Snack**: add `import * as Sharing from 'expo-sharing';` to the top of your file and confirm that you would like to install it.

## Using it to share a selected image

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