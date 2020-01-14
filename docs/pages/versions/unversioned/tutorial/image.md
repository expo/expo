---
title: Adding an image
---

import SnackInline from '~/components/plugins/SnackInline';

If we wanted to build text-only user interfaces we'd be building a terminal program, not a mobile app. So let's look at adding images to our app.

## Save the logo image to your project assets

Let's imagine that our designer has provided us with a beautiful logo:

<img src="https://imgur.com/TkIrScD.png" style={{maxWidth: 305, maxHeight: 159}} />

<br />
<br />

Save this image to the `assets` directory inside of your project and call it `logo.png`. If you are using Snack, you can drag the logo file into the file explorer sidebar to upload it.

> 💡 An "asset" is any file that your project uses that is not code. Images, videos, sounds, and fonts are all considered to be assets. 

## Displaying the image in the app

We have displayed text using the `Text` component from React Native, and we can display the image using the `Image` component.

```jsx
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

## Loading images by URL

Sometime you want to load images from some web URL rather than from your project directory. Let's change that up here.

<SnackInline>

```jsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      /* @info We can use a URL instead of importing the image from your local assets */
      <Image source="https://i.imgur.com/TkIrScD.png" style={{ width: 305, height: 159 }} />
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

## Time for a code organization break!

Let's organize our code a bit by moving our inline styles into the `StyleSheet.create` object so it's a bit easier to read.

<SnackInline>

```jsx
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image source="https://i.imgur.com/TkIrScD.png" /* @info See below for the styles! */ style={styles.logo} /* @end *//>

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

Oh, hey, we also added some new styles here to make things look a bit prettier. We use `marginBottom` on the logo to space things out between the logo and the instructions, and we added `marginHorizontal` to give our instructions some breathing room.

Time to make things interactive. [Let's move on to adding a button](../../tutorial/button/).
