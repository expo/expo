---
title: How to set a background image on a component in Expo and React Native
---

If you are looking for a replacement for the `background-image` in css or the `backgroundImage` stylesheet property, or need to display an image as the background for a container in your screen, you’re in the right place.

In Expo and React Native, you use the ImageBackground component to achieve this effect.


## How to use ImageBackground

<SnackInline>

<!-- prettier-ignore -->
```js
import React from "react";
import { /* @info Import ImageBackground from react-native */ ImageBackground, /* @end */ StyleSheet, Text, View } from "react-native";

const image = { uri: "https://docs.expo.io/static/images/tutorial/splash.png" };

const App = () => (
  <View style={styles.container}>
    <ImageBackground source={image} style={styles.image}>
      /* @info Nest your content inside of the ImageBackground component */
      <Text style={styles.text}>Elements</Text>
      <Text style={styles.text}>in Front of</Text>
      <Text style={styles.text}>Background</Text>
    /* @end */
    </ImageBackground>
  </View>
);

const styles = StyleSheet.create({
  container: {
    /* @info Make the containing view fill the screen */
    flex: 1,
    /* @end */
    flexDirection: "column"
  },
  image: {
    /* @info Make the image fill the containing view */
    flex: 1,
    /* @end */
    /* @info Scale up the image to fill the container, preserving aspect ratio */
    resizeMode: "cover",
    /* @end */
    justifyContent: "center"
  },
  text: {
    color: "white",
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#000000a0"
  }
});

export default App;
```

</SnackInline>

