---
id: image-style-props
title: Image Style Props
---

## Examples

### Image Resize Mode

```js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const DisplayAnImageWithStyle = () => {
  return (
    <View style={styles.container}>
      <View>
        <Image
          style={{
            resizeMode: 'cover',
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>resizeMode : cover</Text>
      </View>
      <View>
        <Image
          style={{
            resizeMode: 'contain',
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>resizeMode : contain</Text>
      </View>
      <View>
        <Image
          style={{
            resizeMode: 'stretch',
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>resizeMode : stretch</Text>
      </View>
      <View>
        <Image
          style={{
            resizeMode: 'repeat',
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>resizeMode : repeat</Text>
      </View>
      <View>
        <Image
          style={{
            resizeMode: 'center',
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>resizeMode : center</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'vertical',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
  },
});

export default DisplayAnImageWithStyle;
```

### Image Border

```js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

const DisplayAnImageWithStyle = () => {
  return (
    <View style={styles.container}>
      <Image
        style={{
          borderColor: 'red',
          borderWidth: 5,
          height: 100,
          width: 200,
        }}
        source={require('@expo/snack-static/react-native-logo.png')}
      />
      <Text>borderColor & borderWidth</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'vertical',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
  },
});

export default DisplayAnImageWithStyle;
```

### Image Border Radius

```js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

const DisplayAnImageWithStyle = () => {
  return (
    <View style={styles.container}>
      <View>
        <Image
          style={{
            borderTopRightRadius: 20,
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>borderTopRightRadius</Text>
      </View>
      <View>
        <Image
          style={{
            borderBottomRightRadius: 20,
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>borderBottomRightRadius</Text>
      </View>
      <View>
        <Image
          style={{
            borderBottomLeftRadius: 20,
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>borderBottomLeftRadius</Text>
      </View>
      <View>
        <Image
          style={{
            borderTopLeftRadius: 20,
            height: 100,
            width: 200,
          }}
          source={require('@expo/snack-static/react-native-logo.png')}
        />
        <Text>borderTopLeftRadius</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'vertical',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
  },
});

export default DisplayAnImageWithStyle;
```

### Image Tint

```js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

const DisplayAnImageWithStyle = () => {
  return (
    <View style={styles.container}>
      <Image
        style={{
          tintColor: '#000000',
          resizeMode: 'contain',
          height: 100,
          width: 200,
        }}
        source={require('@expo/snack-static/react-native-logo.png')}
      />
      <Text>tintColor</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'vertical',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
  },
});

export default DisplayAnImageWithStyle;
```

# Reference

## Props

### `backfaceVisibility`

The property defines whether or not the back face of a rotated image should be visible.

| Type                          | Default     |
| ----------------------------- | ----------- |
| enum(`'visible'`, `'hidden'`) | `'visible'` |

---

### `backgroundColor`

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `borderBottomLeftRadius`

| Type   |
| ------ |
| number |

---

### `borderBottomRightRadius`

| Type   |
| ------ |
| number |

---

### `borderColor`

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `borderRadius`

| Type   |
| ------ |
| number |

---

### `borderTopLeftRadius`

| Type   |
| ------ |
| number |

---

### `borderTopRightRadius`

| Type   |
| ------ |
| number |

---

### `borderWidth`

| Type   |
| ------ |
| number |

---

### `opacity`

Set an opacity value for the image. The number should be in the range from `0.0` to `1.0`.

| Type   | Default |
| ------ | ------- |
| number | `1.0`   |

---

### `overflow`

| Type                          | Default     |
| ----------------------------- | ----------- |
| enum(`'visible'`, `'hidden'`) | `'visible'` |

---

### `overlayColor` **(Android)**

When the image has rounded corners, specifying an overlayColor will cause the remaining space in the corners to be filled with a solid color. This is useful in cases which are not supported by the Android implementation of rounded corners:

- Certain resize modes, such as `'contain'`
- Animated GIFs

A typical way to use this prop is with images displayed on a solid background and setting the `overlayColor` to the same color as the background.

For details of how this works under the hood, see [Fresco documentation](https://frescolib.org/docs/rounded-corners-and-circles.html).

| Type   |
| ------ |
| string |

---

### `resizeMode`

| Type                                                              | Default   |
| ----------------------------------------------------------------- | --------- |
| enum(`'cover'`, `'contain'`, `'stretch'`, `'repeat'`, `'center'`) | `'cover'` |

---

### `tintColor`

Changes the color of all the non-transparent pixels to the tintColor.

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |
