---
title: Build a screen
---

import SnackInline from '~/components/plugins/SnackInline';
import ImageSpotlight from '~/components/plugins/ImageSpotlight'

In this chapter, we will create the first screen of the app.

<ImageSpotlight alt="Initial layout." src="/static/images/tutorial/initial-layout.jpg" style={{ maxWidth: 300 }} />

The screen above displays an image and two buttons. The user will select an image using one of the two buttons provided. The first button allows the user to select an image from their device. The second button allows the user to use a default image.

Once the user selects an image, they'll be able to select and add a sticker to the image. So, let's get started creating this screen.

## Step 1: Break down the layout

Before we build this screen by writing code, let's break it down into some essential elements. Most of these elements directly correspond to the built-in [Core Components](https://reactnative.dev/docs/components-and-apis) from React Native.

<ImageSpotlight alt="Break down of initial layout." src="/static/images/tutorial/breakdown-of-layout.jpg" style={{ maxWidth: 300 }} containerStyle={{ marginBottom: 0 }} />

There are three essential elements:

- The screen has a background color
- There is a large image displayed at the center of the screen
- There are two buttons in the bottom half of the screen

The first button is composed of multiple components. The parent element provides a yellow border and contains both an icon component and a text component.

<ImageSpotlight alt="Break down of the button component with row." src="/static/images/tutorial/breakdown-of-buttons.jpg" style={{ maxWidth: 480 }} containerStyle={{ marginBottom: 0 }} />

These elements use custom styles. In React Native, styling is done using JavaScript. All of the React Native core components accept a `style` prop that accepts a JavaScript object as its value. For detailed information on styling, see [Styling in React Native](https://reactnative.dev/docs/styles).

Now that we've broken down the UI into smaller chunks, we're ready to start coding.

## Step 2: Style the background

First, let's change the background color. This value is defined in the `styles` object in **App.js**.

Replace the default value of `#fff` with `#25292e` for the  `styles.container.backgroundColor` property. It will change the background color of the screen.

<!-- prettier-ignore -->
```js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    /* @info Replace the default value of backgroundColor property to "#25292e". */
    backgroundColor: '#25292e',
    /* @end */
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## Step 3: Change the text color

Now that the background is a dark color, the text is difficult to read. By default, the `<Text>` component uses `#000` (black) as its default color. Let's add a style to the `<Text>` component to change the text color to `#fff` (white).

<SnackInline label="Styled Background" dependencies={['expo-status-bar']}>

<!-- prettier-ignore -->
```js
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      /* @info Replace the default value of color property to "#fff". */
      <Text style={{ color: '#fff' }}>Open up App.js to start working on your app!</Text>
      /* @end */
      <StatusBar style="auto" />
    </View>
  );
}

/* @hide const styles = StyleSheet.create({*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e", 
    alignItems: "center",
    justifyContent: "center",
  },
});
/* @end */
```

</SnackInline>

> React Native uses the same color format as the web. It supports hex triplets (this is what `#fff` is), `rgba`, `hsl`, and a set of named colors like `red`, `green`, `blue`, `peru` and `papayawhip`. For more information, see [Colors in React Native](https://reactnative.dev/docs/colors).

## Step 4: Display the image

We can use React Native's `<Image>` component to display the image in the app. The `<Image>` component requires a source of an image. This source can be a [static asset](https://reactnative.dev/docs/images#static-image-resources) or a URL. For example, the source can be required from the app's **./assets/images** directory, or the source can come from the [Network](https://reactnative.dev/docs/images#network-images) in the form of a `uri` property.

<ImageSpotlight alt="Background image that we are going to use as a placeholder for the tutorial." src="/static/images/tutorial/background-image.png" style={{ maxWidth: 250 }} />

Next, import and use the `Image` component from React Native. Also, import `background-image.png` in the **App.js**:

<SnackInline label="Display placeholder image" dependencies={['expo-status-bar']} files={{
    'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910'
}}>

<!-- prettier-ignore -->
```js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, /* @info Import the image component. */ Image /* @end */ } from 'react-native';

/* @info Import the image from the "/assets/images" directory. Since this picture is a static resource, you have to reference it using "require". */
const PlaceholderImage = require('./assets/images/background-image.png');
/* @end */

export default function App() {
  return (
    <View style={styles.container}>
      /* @info Wrap the Image component inside a container. Also, add the image component to display the placeholder image. */
        <View style={styles.imageContainer}>
         <Image source={PlaceholderImage} style={styles.image} />
        </View>
      /* @end */
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    /* @info Modify container styles to remove justifyContent property. */
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    /* @end */
  },
  imageContainer: {
    flex:1, 
    paddingTop: 58
  },
  image: {
    width: 320,
    height: 440,
    borderRadius: 18,
  },
});
```

</SnackInline>

The `PlaceholderImage` variable references the **./assets/images/background-image.png** and is used as the `source` prop on the `<Image>` component.

## Step 5: Dividing components into files

As we add more components to this screen, let's divide the code into multiple files.

- Create a **components** directory at the root of the project. This will contain all the custom components created throughout this tutorial.
- Then, create a new file **ImageViewer.js** inside the **components** folder.
- Move the code to display the image into this file.

<!-- prettier-ignore -->
```js
import { StyleSheet, Image } from 'react-native';

export default function ImageViewer({ placeholderImageSource }) {
  return (    
    <Image source={placeholderImageSource} style={styles.image} />    
  );
}

const styles = StyleSheet.create({  
  image: {
    width: 320,
    height: 440,
    borderRadius: 18,
  },
});
```

Next, let's import this component and use it in the **App.js**:

<!-- prettier-ignore -->
```js
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

/* @info */ import ImageViewer from './components/ImageViewer'; /* @end */

const PlaceholderImage = require('./assets/images/background-image.png');

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        /* @info */ <ImageViewer placeholderImageSource={PlaceholderImage} /> /* @end */
      
      </View> 
      <StatusBar style="auto" />
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
  },
});
/* @end */
```

## Step 6: Create buttons using Pressable


React Native provides various components to handle touch events on native platforms. For this tutorial, we’ll use the [`<Pressable>`](https://reactnative.dev/docs/pressable) component. It is a core component wrapper that can detect various stages of interactions, from basic single tap events to advanced events such as a long press.

In the design, there are two buttons we need to implement. Each has different styles and labels. Let's start by creating a function component that can be reused to create the two buttons.

Create a new file called **Button.js** inside the **components** folder with the following code snippet:

<!-- prettier-ignore -->
```js
import { StyleSheet, View, Pressable, Text } from 'react-native';

export default function Button({ label }) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable style={styles.button} onPress={() => alert('You pressed a button.')}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
```


Now, in the app, when the user taps any of the buttons on the screen, an alert will be displayed. This happens because the `<Pressable>` uses an `alert()` function with its `onPress` prop.

Let's import this component into **App.js** and see it in action:

<!-- prettier-ignore -->
```js
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View} from "react-native";

/* @info */ import Button from './components/Button'; /* @end */

import ImageViewer from './components/ImageViewer';

const PlaceholderImage = require("./assets/images/background-image.png");

export default function App() {
  return (
    <View style={styles.container}>    
      <View style={styles.imageContainer}>  
        <ImageViewer placeholderImageSource={PlaceholderImage} />
      </View>  
      /* @info Use the reusable Button component to create two buttons. */
      <View style={styles.footerContainer}>
        <Button label="Choose a photo" />
        <Button label="Use this photo" />
      </View>
      /* @end */
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  /* @hide // Styles that are unchanged from previous step are hidden for brevity. */
  container: {    
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",    
  },
  imageContainer: {
    flex: 1,
    paddingTop: 58,    
  },
  image: {    
    width: 356,
    height: 522,
    borderRadius: 18,
  },
  /* @end */

  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },  
});
```

The second button with the label "Use this photo" resembles the actual button from the design. However, the first button needs more styling to match the design.

## Step 7: Enhance the reusable button component

The "Choose a photo" button requires different styling than the "Use this photo" button, so we will add a new button theme that will allow us to apply a `primary` theme.

This button also has an icon before the label. [`@expo/vector-icons` library](/guides/icons/#expovector-icons) provides icons from popular icon sets such as Ionicons, Feather, FontAwesome, MaterialCommunityIcons and so on. To load and display the icon on the button, let's use `<FontAwesome>` from the library.

Modify **Button.js** to add the following code snippet:

<!-- prettier-ignore -->
```js
import { StyleSheet, View, Pressable, Text } from 'react-native';
/* @info Import FontAwesome. */import FontAwesome from "@expo/vector-icons/FontAwesome";/* @end */


export default function Button({ label, /* @info The prop theme to detect the button variant. */ theme/* @end */ }) {
  /* @info Conditionally render the primary themed button. */
  if (theme === "primary") {
    return (
      <View
      style={[
        styles.buttonContainer,
        { borderWidth: 4, borderColor: "#ffd33d", borderRadius: 18 },
      ]}
    >
      <Pressable
        style={[styles.button, { backgroundColor: "#fff" }]}
        onPress={onPressHandler}
      >
        <FontAwesome
          name="picture-o"
          size={18}
          color="#25292e"
          style={styles.buttonIcon}
        />
        <Text style={[styles.buttonLabel, { color: "#25292e" }]}>{label}</Text>
      </Pressable>
    </View>      
    );
  }
 /* @end */

 return (
    <View style={styles.buttonContainer}>
      <Pressable style={styles.button} onPress={onPressHandler}>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Pressable>
    </View>
  );

}

const styles = StyleSheet.create({
  // Styles from previous step remain unchanged.
});
```

Let's learn what the above code does:

- The primary theme button uses **inline styles** to apply styles to override the styles defined in `styles`.
- The `<Pressable>` component in the primary theme uses a `backgroundColor` property of `#fff` to set the background color of the button. If we add this property to the `styles.button`, then the background color value will be set for both the primary theme and the unstyled one.
- Using inline styles allows overriding the default styles for a specific value.

Now, modify the **App.js** file to use `theme="primary"` prop on the first button.

<SnackInline label="Complete Screen"
templateId="tutorial/01-layout/App"
dependencies={['expo-status-bar', '@expo/vector-icons', '@expo/vector-icons/FontAwesome']}
files={{
    'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
    'components/ImageViewer.js': 'tutorial/01-layout/ImageViewer.js',
    'components/Button.js': 'tutorial/01-layout/Button.js'
}}>

<!-- prettier-ignore -->
```js
// ...
export default function App() {
  return (
    <View style={styles.container}>      
      <View style={styles.imageContainer}>              
        <ImageViewer placeholderImageSource={PlaceholderImage} />    
      </View>      
      <View style={styles.footerContainer}>
        /* @info Add primary theme on the first button */
        <Button theme="primary" label="Choose a photo" />
        /* @end */
        <Button label="Use this photo" />
      </View>      
      <StatusBar style="auto" />
    </View>
  );
}
```

</SnackInline>

Let's take a look at our app now on Android, iOS, and the web:

<ImageSpotlight alt="Complete layout screen running on multiple platforms." src="/static/images/tutorial/complete-layout.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Up next

We implemented the initial design. In the next chapter, we’ll add the functionality to [pick an image from the device's media library](/tutorial/image-picker).
