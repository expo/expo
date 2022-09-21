---
title: Picking an image
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Terminal } from '~/ui/components/Snippet';

So far we have been using code from React and React Native in our app. React gives us a nice way to build components and React Native gives us pre-built components that work on iOS, Android, and web &mdash; like `View`, `Text`, `TouchableOpacity`. React Native does _not_ provide us with an image picker. For this, we can use an Expo library called [expo-image-picker](/versions/latest/sdk/imagepicker):

> **`expo-image-picker`** provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

## Installing expo-image-picker

To use `expo-image-picker` in our project, we first need to install it. In your project directory, run the following command:

<Terminal cmd={['$ npx expo install expo-image-picker']} />

This will tell npm (or yarn) to install a version of the `expo-image-picker` library that is compatible with your project.

## Picking an image

With the library installed in our project, we can now actually use it.

<SnackInline label="Image picker" templateId="tutorial/image-picker-log" dependencies={['expo-image-picker']}>

{/* prettier-ignore */}
```js
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
/* @info Import the ImagePicker */import * as ImagePicker from 'expo-image-picker';/* @end */


export default function App() {
  /* @info Launch the picker and log the result. */
  let openImagePickerAsync = async () => {    
    let pickerResult = await ImagePicker.launchImageLibraryAsync();
    console.log(pickerResult);
  }
  /* @end */

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://i.imgur.com/TkIrScD.png' }} style={styles.logo} />
      <Text style={styles.instructions}>
        To share a photo from your phone with a friend, just press the button below!
      </Text>

      <TouchableOpacity onPress={/* @info This function is a bit long so we moved it out to a variable */openImagePickerAsync/* @end */} style={styles.button}>
        <Text style={styles.buttonText}>Pick a photo</Text>
      </TouchableOpacity>
    </View>
  );
}
```

</SnackInline>

<br />

You should see something like this when you run your app and use the picker:

<Video file="tutorial/cli-logs.mp4" />

> You can see the logs in your expo-cli terminal session or in the browser-based developer tools if you prefer it. To see the logs in Snack, press "Logs" in the footer.

## Using the selected image

Now we will take the data that we get from the image picker and use it to show the selected image in the app.

<SnackInline label="Image picker show image" templateId="tutorial/image-picker-show" dependencies={['expo-image-picker']}>

{/* prettier-ignore */}
```js
/* @info Import React to use useState */import React from 'react';/* @end */

import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  /* @info Initialize a variable to hold our selected image data */const [selectedImage, setSelectedImage] = React.useState(null);/* @end */


  let openImagePickerAsync = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync();

    /* @info Stop running the function here if the user cancelled the dialog */
    if (pickerResult.cancelled === true) {
      return;
    }/* @end */


    /* @info Store away the picked image uri */setSelectedImage({ localUri: pickerResult.uri });/* @end */

  };

  /* @info Show the selected image if we have one */
  if (selectedImage !== null) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: selectedImage.localUri }}
          style={styles.thumbnail}
        />
      </View>
    );
  }/* @end */


  return (
    <View style={styles.container}>
      {/* Our logo, instructions, and picker button are hidden here to keep the example brief */}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Other styles hidden to keep the example brief... */
  /* @info We're giving the selected image a fixed width and height */
  thumbnail: {
    width: 300,
    height: 300,
    resizeMode: "contain"
  }/* @end */

});
```

</SnackInline>

<br />

Your app should now look and behave like this:

<Video file="tutorial/picker-show.mp4" />

> 👀 You might expect that because we gave our image an equal width and height it would be a square, but in the above video it's rectangular. This is because of `resizeMode`, an image style property that lets us control how the image is resized to fit the given dimensions. Try switching it from `contain` to `stretch` or `cover` to see other behaviors.

We have made great progress! Up next, [let's make it possible to share the image](/tutorial/sharing).
