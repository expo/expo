---
title: Use an image picker
---

import SnackInline from '~/components/plugins/SnackInline';
import Video from '~/components/plugins/Video';
import { Terminal } from '~/ui/components/Snippet';

React Native provides pre-built components that work on iOS, Android, and web, such as `<View>`, `<Text>`, and `<Pressable>`. However, React Native does not provide a way to select an image from the device's media library. The app we are building requires this functionality to replace the placeholder image with an image selected from the media library.

At the same time, the tutorial requires a solution that works on all platforms and does not have to worry about supporting each platform from scratch by writing native code.

To achieve this, we’ll use an Expo library called [expo-image-picker](/versions/latest/sdk/imagepicker). Here is a brief description of what the library does:

> `expo-image-picker` provides access to the system's UI to select images and videos from the phone's library or take a photo with the camera.

## Step 1: Pick an image from the device's media library

`expo-image-picker` provides the `launchImageLibraryAsync()` method that displays the system UI for choosing an image or a video from the device’s library.

We can use the button with the primary theme that we created in the previous chapter to pick an image from the device's media library. To implement this functionality, we’ll create a function to launch the device’s image library.

In **App.js**, import the `expo-image-picker` library and create a `pickImageAsync()` function inside the `App` component:

<!-- prettier-ignore -->
```js
/* @info Import the ImagePicker. */ import * as ImagePicker from 'expo-image-picker'; /* @end */

// ... other import statements

export default function App() {
  const pickImageAsync = async () => {
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

- The `launchImageLibraryAsync()` receives an object in which different options are specified. This is known as an [`ImagePickerOptions` object](/versions/latest/sdk/imagepicker/#imagepickeroptions). We can pass the object to specify different options when invoking the method.
- When `allowsEditing` is set to `true`, the user is allowed to crop the image during the selection process on Android and iOS.


## Step 2: Update the button component

Now we need to call the `pickImageAsync()` function when the primary themed button gets pressed. To call it, update the `onPress` property of the `<Button>` component in **components/Button.js**:

<!-- prettier-ignore -->
```js
export default function Button({ label,  theme, /* @info Pass this prop to trigger the handler method from the parent component. */ onPress/* @end */}) {
  // ..rest of the code remains same
  if (theme === "primary") {
    return (
      <View>
        /* ... rest of the code remains unchanged */
        <Pressable
          style={[styles.button, { backgroundColor: '#fff' }]}
          /* @info */ onPress={onPress} /* @end */
        >        
      </View>
    );
  }  
}
```

Back in **App.js**, add the `pickImageAsync()` function to the `onPress` prop on the first `<Button>`.

<!-- prettier-ignore -->
```js
export default function App() {
  // ...rest of the code remains same

  return (
    <View style={styles.container}>
      /* ...rest of the code remains same */
      <Button theme="primary" label="Choose a photo" /* @info */ onPress={pickImageAsync} /* @end */ />
    </View>
  );
}
```

The `pickImageAsync()` function is responsible for invoking `ImagePicker.launchImageLibraryAsync()` and then handling the result. The `launchImageLibraryAsync()` method returns an object containing information about the selected image.

To demonstrate what properties the `result` object contains, here is an example result object:

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

## Step 3: Use the selected image

The `result` object provides the local `uri` of the selected image. Let's take this value from the image picker and use it to show the selected image in the app.

Modify the **App.js** file in the following steps:

- Declare a state variable called `selectedImage` using the [`useState`](https://reactjs.org/docs/hooks-state.html) hook from React. We’ll use this state variable to hold the URI of the selected image.
- Update the `pickImageAsync()` function to save the image URI in the `selectedImage` state variable.
- Then, pass the `selectedImage` as a prop to the `ImageViewer` component.

<!-- prettier-ignore -->
```js
/* @info Import useState hook from React. */ import { useState } from 'react'; /* @end */

// ... rest of the import statements remain unchanged

export default function App() {
  /* @info Create a state variable that will hold the value of selected image. */
  const [selectedImage, setSelectedImage] = useState(null);
  /* @end */
  
  const pickImageAsync = async () => {
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
      <View style={styles.imageContainer}>
        /* @info Pass the selected image URI to the ImageViewer component. */<ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} />/* @end */            
      </View>  
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
    /* @info If the selected image is not null, show the image, otherwise, show the placeholder image */ <Image
      source={selectedImage !== null ? { uri: selectedImage } : placeholderImageSource} style={styles.image} /> /* @end */

  );
}
```

</SnackInline>

In the above snippet, the `<Image>` component uses a conditional operator to load the source of the image. This is because the image picked from the image picker is a [`uri` string](https://reactnative.dev/docs/images#network-images) and not a local asset like the placeholder image. 

Let's take a look at our app now:

<Video file="tutorial/image-picker-demo.mp4" />

> The images used for demo in this tutorial are hand picked from [Unsplash](https://unsplash.com/photos/hpTH5b6mo2s).

## Up next

We added the functionality to pick an image from the device's media library.

In the next chapter, we’ll learn how to [create an emoji picker modal component](/tutorial/create-a-modal).

