---
title: Creating a button
---

import SnackInline from '~/components/plugins/SnackInline';

We're going to create our own custom button using the `TouchableOpacity` component and some styled `Text` inside of it.

<SnackInline label="Simple button">

{/* prettier-ignore */}
```js
import React from 'react';
import { Image, StyleSheet, Text, /* @info Add the TouchableOpacity component to your list of imports */ TouchableOpacity,/* @end */ View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://i.imgur.com/TkIrScD.png' }} style={styles.logo} />
      <Text style={styles.instructions}>
        To share a photo from your phone with a friend, just press the button below!
      </Text>

      /* @info onPress takes a function that should be called when the button is pressed */
      <TouchableOpacity
        onPress={() => alert('Hello, world!')}
        style={{ backgroundColor: 'blue' }}>
        <Text style={{ fontSize: 20, color: '#fff' }}>Pick a photo</Text>
      </TouchableOpacity>/* @end */

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
  logo: {
    width: 305,
    height: 159,
    marginBottom: 20,
  },
  instructions: {
    color: '#888',
    fontSize: 18,
    marginHorizontal: 15,
    marginBottom: 10,
  },
});
```

</SnackInline>

<br />

Give it a try! Notice that when you press on the button it fades a little bit &mdash; this is because our background is white and the button becomes slightly translucent. When you release, you will see an alert dialog. You can show this dialog any time in your apps by calling the `alert` function.

## Making it easier to press the button

When you are using your finger to tap on a button, you don't want to have to hold your breath and carefully aim your finger &mdash; the button should be big enough that it's easy to press for people with varying levels of dexterity and an assortment of finger sizes, from baby right up to big boy.

We can make our button bigger by adding some `padding` to our `TouchableOpacity`. We've already seen `width`, `height`, and various `margin` properties on our styles, `padding` is in the same family as those. They all tell React Native's layout system how big components should be and how they should be positioned relative to other components. The layout system is called [flexbox](https://reactnative.dev/docs/flexbox), but don't worry about that for now, in this tutorial we will tell you exactly what styles to use and you can learn about flexbox later.

<SnackInline label="Simple button">

{/* prettier-ignore */}
```js
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://i.imgur.com/TkIrScD.png' }} style={styles.logo} />
      <Text style={styles.instructions}>
        To share a photo from your phone with a friend, just press the button below!
      </Text>

      <TouchableOpacity onPress={() => alert('Hello, world!')} /* @info We moved our our style down to the StyleSheet, keep scrolling! */ style={styles.button}/* @end */>
        <Text /* @info See StyleSheet */style={styles.buttonText}/* @end */>Pick a photo</Text>
      </TouchableOpacity>
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
  logo: {
    width: 305,
    height: 159,
    marginBottom: 20,
  },
  instructions: {
    color: '#888',
    fontSize: 18,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  /* @info Our button, now with some padding. Rounded corners are a bonus thanks to borderRadius. */
  button: {
    backgroundColor: "blue",
    padding: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  }, /* @end */

});
```

</SnackInline>

<br />

> Yikes, these code snippets are getting long. For the rest of the tutorial we'll show only relevant code here, and you can click through to Snack to see the full code.

- We have a button! We can now make that button do what we want it to do: open an "image picker" - a screen with a gallery of images on your device. [Continue to the next section](/tutorial/image-picker).
