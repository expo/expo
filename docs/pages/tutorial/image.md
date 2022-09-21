---
title: Adding an image
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import SnackInline from '~/components/plugins/SnackInline';

Let's imagine that our designer has provided us with a beautiful logo:

<ImageSpotlight alt="A pretty bad logo with the text 'Image Share' and the emoji of the sun behind mountains" src="/static/images/tutorial/logo.png" style={{maxWidth: 305, maxHeight: 159}} />

Save this image to the **assets** directory inside of your project and call it **logo.png**.

> An "asset" is any file that your project uses that is not code. Images, videos, sounds, and fonts are all considered to be assets.

## Displaying the image in the app

We have displayed text using the `Text` component from React Native, and we can display the image using the `Image` component. When creating an `Image` component, you will need to explicitly specify a width and height, or the image won't be visible.

{/* prettier-ignore */}
```js
import React from 'react';
import { /* @info Add the Image component to your list of imports */ Image, /* @end */ StyleSheet, Text, View } from 'react-native';
/* @info Import the logo image */ import logo from './assets/logo.png'; /* @end */


export default function App() {
  return (
    <View style={styles.container}>
      /* @info Use the Image component */ <Image source={logo} style={{ width: 305, height: 159 }} /> /* @end */


      <Text style={{color: '#888', fontSize: 18}}> 
        To share a photo from your phone with a friend, just press the button below!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

> 📏 **What units are width and height in?** A useful simplification is to treat the units for numbers in styles as pixels. If your screen resolution is 640x480, then an image that is 320x240 will be half of the width and height. On the web, React Native's `width: 305` is directly translated to `305px`. [Learn more about pixels, if you're curious](https://medium.com/@pnowelldesign/pixel-density-demystified-a4db63ba2922).

## Loading images by URL

Sometimes you will want to load images from the web rather than from your project directory. We can replace the `logo` source for the image with something of the format `{ uri: 'http://path-to-your-image' }`:

<SnackInline>

{/* prettier-ignore */}
```js
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      /* @info We can use a URL instead of importing the image from your local assets */
      <Image source={{ uri: "https://i.imgur.com/TkIrScD.png" }} style={{ width: 305, height: 159 }} />
    /* @end */

      <Text style={{color: '#888', fontSize: 18}}> 
        To share a photo from your phone with a friend, just press the button below!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

</SnackInline>

<br />

> **What's a URI? Is that like a URL?** Yes, you can use the terms interchangeably. Technically there are some subtle differences in meaning, but this typically won't matter for your usage with Expo. Documentation will tell you whether to use `uri` or `url`.

## Time for a code organization break!

Let's organize our code a bit by moving our styles into one place so our code is easier to read:

<SnackInline>

{/* prettier-ignore */}
```js
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: "https://i.imgur.com/TkIrScD.png" }} /* @info See below for the styles! */ style={styles.logo} /* @end *//>

      <Text /* @info See below for the styles! */ style={styles.instructions} /* @end */>
        To share a photo from your phone with a friend, just press the button below!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* @info We've now moved all of our styles here */
  logo: {
    width: 305,
    height: 159,
    marginBottom: 10,
  },
  instructions: {
    color: '#888',
    fontSize: 18,
    marginHorizontal: 15,
  }, /* @end */

});
```

</SnackInline>

<br/>

You might notice that we also added some new styles here to make things look a bit prettier. We used `marginBottom` on the logo to space things out between the logo and the instructions, and we added `marginHorizontal` to give our instructions some spacing around the edges of the screen.

Time to make things interactive. [Let's move on to creating a button](/tutorial/button).
