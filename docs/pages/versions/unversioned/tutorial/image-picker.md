---
title: Picking an image
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '../../../../components/plugins/Video'

So far we have been using code from React and React Native in our app. React gives us a nice way to build components and React Native gives us pre-built components that work on iOS, Android, and web &mdash; like `View`, `Text`, `TouchableOpacity`. React Native does *not* provide us with an image picker. For this, we can use an Expo library called [expo-image-picker](../../sdk/imagepicker/):

> **`expo-image-picker`** provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

<details><summary><h4>👉 Do you want to see a quick video preview of expo-image-picker in action? Click here 👈</h4></summary>

<p>

<Video file={"sdk/imagepicker.mp4"} />

</p>
</details>


## Installing expo-image-picker

To use expo-image-picker in our project, we first need to install it. The way you install it will depend on whether you are using expo-cli or Snack for this tutorial.

<details><summary><h4>Instructions for expo-cli</h4></summary>

<p>

In your project directory, run `expo install expo-image-picker`. This will tell npm (or yarn) to install the a version of the `expo-image-picker` library that is compatible with your project. That's it!

<Video file={"tutorial/cli-install.mp4"} />

> 🔢 The version numbers you see here may be different depending on when you do this tutorial.

> 🧶 expo-cli used yarn here instead of npm, the installation text will be slightly different if you do not have yarn installed. It's fine.

</p>
</details>


<details><summary><h4>Instructions for Snack</h4></summary>
<p>

Write `import * as ImagePicker from 'expo-image-picker';` at the top of your file. You will be prompted to install the package, confirm it.

<Video file={"tutorial/snack-install.mp4"} />

</p>
</details>

## Picking an image

With the library installed our project, we can now actually use it.

<SnackInline label="Image picker" templateId="tutorial/image-picker-log" dependencies={['expo-image-picker']}>

```jsx
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
/* @info Import the ImagePicker */import * as ImagePicker from 'expo-image-picker';/* @end */


export default function App() {
  /* @info Request permissions to access the "camera roll", then launch the picker and log the result. */
  let openImagePickerAsync = () => {
    let permissionResult = await ImagePicker.requestCameraRollPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

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

> 💡 You can see the logs in your expo-cli terminal session or in the browser-based developer tools if you prefer it. To see the logs in Snack, press "Logs" in the footer.

## Using the selected image

<SnackInline label="Image picker" templateId="tutorial/image-picker-show" dependencies={['expo-image-picker']}>

```jsx
export default function App() {
  /* @info Initialize a variable to hold our selected image data */let [selectedImage, setSelectedImage] = React.useState(null);/* @end */

  let openImagePickerAsync = async () => {
    let permissionResult = await ImagePicker.requestCameraRollPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

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
      { /* Our logo, instructions, and picker button are hidden here to keep the example brief */}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Other styles hidden to keep the example brief... */
  thumbnail: {
    width: 300,
    height: 300,
    resizeMode: "contain"
  }
});
```

</SnackInline>
