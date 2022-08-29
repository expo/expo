---
title: Use an image picker
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Terminal } from '~/ui/components/Snippet';

React Native provides pre-built components that work on iOS, Android, and web, such as `View`, `Text`, and `Pressable`. However, React Native does not provide a way to select an image from the device's media library. The app you are building requires this functionality to replace the placeholder image with the selected image.

At the same time, the tutorial requires a solution that works on all platforms and does not have to worry about supporting each platform from scratch by writing native code.

To achieve this, let's use an Expo library called [expo-image-picker](/versions/latest/sdk/imagepicker). Here is a brief description of what the library does:

> `expo-image-picker` provides access to the system's user interface (UI) to select images and videos from the phone's library or take a photo with the camera.

## Step 1: Install expo-image-picker

Install the `expo-image-picker` library in your Expo project by running the following command:

<Terminal cmd={['$ npx expo install expo-image-picker']} />

> If you are using the starter template, you can skip this step.

This will tell npm (or yarn) to install a version of the library that is compatible with the Expo SDK version that your project uses.

## Step 2: Pick an image from the device's media library

After installing the library, you can use it in your project. `expo-image-picker` provides the `launchImageLibraryAsync()` method that displays the system UI for choosing an image or a video from the phone's library.

The styled button created in the previous module is used to pick an image from the device's media library. To implement the functionality, a custom handler method is invoked when this button is pressed to pick the image.

In **App.js**, import the `expo-image-picker` library and create `pickImageHandler()` method inside the `App` component:

<!-- prettier-ignore -->
```js
/* @info Import the ImagePicker. */ import * as ImagePicker from 'expo-image-picker'; /* @end */

// ... other import statements

export default function App() {
  const pickImageHandler = async () => {
    /* @info Pass image picker options to launchImageLibraryAsync() */
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });
    /* @end */

    if (!result.cancelled) {
      /* @info If the image is picked, print its information in terminal window. */
      console.log(result);
      /* @end */
    } else {
      /* @info If the user does not picks an image, show an alert. */
      alert('You did not select any image.');
      /* @end */
    }
  };

  // ...rest of the code remains same
}
```

Let's learn what the above code does.

- First, notice that the `launchImageLibraryAsync()` receives an object in which different options are specified. This is known as an [`ImagePickerOptions` object](/versions/latest/sdk/imagepicker/#imagepickeroptions). You can pass the object to specify different options when invoking the method.

- When `allowsEditing` is set to true, the user is allowed to crop the image during the selection process on mobile platforms.
- You can also pass `mediaTypes` to specify the types of media the user can pick. For example, the default value of this option is `ImagePicker.MediaTypeOptions.Images` which means that the user can only select images.

> **Tip**: You can read more about what each option does in the [ImagePickerOptions](/versions/latest/sdk/imagepicker/#imagepickeroptions) table.

## Step 3: Update the button component

The handler method is triggered when the styled button gets pressed. To invoke it, update the `onPress` property of the `Button` component in **components/Button.js**:

<!-- prettier-ignore -->
```js
export default function Button({ label, isBorderLess = false, /* @info Pass this prop to trigger the handler method from the parent component. */ onPressHandler/* @end */}) {
  // ..rest of the code remains same

  return (
    <View>
      /* ... rest of the code remains unchanged */
      <Pressable
        style={[styles.button, { backgroundColor: '#fff' }]}
        /* @info */ onPress={onPressHandler} /* @end */
      >        
    </View>
  );
}
```

The `onPressHandler` prop on the `Button` component triggers the `pickImageHandler` when it is passed to the `Button` component in the **App.js**:

<!-- prettier-ignore -->
```js
export default function App() {
  // ...rest of the code remains same

  return (
    <View style={styles.container}>
      /* ...rest of the code remains same */
      <Button label="Choose a photo" /* @info */ onPressHandler={pickImageHandler} /* @end */ />
    </View>
  );
}
```

The `pickImageHandler` handler method is responsible for invoking `ImagePicker.launchImageLibraryAsync()` and then handling the result. The `launchImageLibraryAsync()` method returns an object containing information about the selected image.

To demonstrate what properties the `result` object contains, here is a snippet of information printed in the logs of the terminal window:

```json
{
  "assetId": "ED7AC36B-A150-4C38-BB8C-B6D696F4F2ED/L0/001",
  "cancelled": false,
  "fileName": "IMG_0005.JPG",
  "fileSize": 3423356,
  "height": 2002,
  "type": "image",
  "uri": "file:///Users/your-mac-os-username/Library/Developer/CoreSimulator/Devices/7C9DD290-834F-426D-A774-EBD583305F84/data/Containers/Data/Application/C5EC31DB-A654-48DF-9F42-5864DF16257B/Library/Caches/ExponentExperienceData/%2540anonymous%252FStickerSmash-a004aacc-74c3-4374-a6a9-1748f56f6b8e/ImagePicker/C1AE11EF-C8B6-4BE8-8EE3-E1779A43653A.jpg"
}
```

## Step 4: Use the selected image

The `result` object provides the local `uri` of the selected image. Let's take this value from the image picker and use it to show the selected image in the app.

Modify the **App.js** file in the following steps:

- Declare a state variable called `selectedImage` using [`useState`](https://reactjs.org/docs/hooks-state.html) hook from React. This state variable is used to hold the URI of the selected image.
- Update the `pickImageHandler` method to save the image URI in the `selectedImage` state variable.
- Then, pass the `selectedImage` as a prop to the `ImageViewer` component.

<!-- prettier-ignore -->
```js
/* @info Import useState hook from React. */ import { useState } from 'react'; /* @end */

// ... rest of the import statements remain unchanged

export default function App() {
  /* @info Create a state variable that will hold the value of selected image. */
  const [selectedImage, setSelectedImage] = useState(null);
  /* @end */
  
  const pickImageHandler = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      /* @info */
      setSelectedImage(result.uri);
      /* @end */
    } else {
      alert('You did not select any image.');
    }
  };


  return (
    <View style={styles.container}>
      /* @info Pass the selected image URI to the ImageViewer component. */<ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} />/* @end */            
    </View>
  );
}
```

Now, modify the **components/ImageViewer.js** file to conditionally display the selected image in place of the placeholder image.

<SnackInline
label="Image picker"
templateId="tutorial/02-image-picker/App"
dependencies={['expo-image-picker', 'expo-status-bar', '@expo/vector-icons', '@expo/vector-icons/FontAwesome']}
files={{
'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
'components/ImageViewer.js': 'tutorial/02-image-picker/ImageViewer.js',
'components/Button.js': 'tutorial/02-image-picker/Button.js'
}}>

<!-- prettier-ignore -->
```js
export default function ImageViewer({ placeholderImageSource, selectedImage }) {
  return (
    <View style={styles.imageContainer}>
      /* @info If the selected image is not null, show the image, otherwise, show the placeholder image */
      <Image
        source={selectedImage !== null ? { uri: selectedImage } : placeholderImageSource}
        style={styles.image}
      />
      /* @end */
    </View>
  );
}
```

</SnackInline>

In the above snippet, the `Image` component uses the conditional operator to load the source of the image. This is because the image picked from the image picker is a [`uri` string](https://reactnative.dev/docs/images#network-images) and not a local asset like the placeholder image. For this reason, you cannot use the `require` syntax to load the image from the device.

On running the app, you will get a similar output on all platforms:

<Video file="tutorial/image-picker-demo.mp4" />

> The images used for demo in this tutorial are hand picked from [Unsplash](https://unsplash.com/photos/hpTH5b6mo2s).

## Up next

You have now added the functionality to pick an image from the device's media library. The `expo-image-picker` library supports both mobile and web platforms.

In the next module, let's learn how to [create an emoji picker modal component](/tutorial/create-a-modal).
