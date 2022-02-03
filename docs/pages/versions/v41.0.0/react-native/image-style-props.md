---
id: image-style-props
title: Image Style Props
---

### Examples

```js
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function DisplayAnImageWithStyle() {
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
}

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
```

```js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

const DisplayAnImageWithStyle = () => (
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

```js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

export function DisplayAnImageWithStyle() {
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
      <Text>
        <Text>borderColor & borderWidth</Text>
      </Text>
    </View>
  );
}

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
```

```js
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

export default function DisplayAnImageWithStyle() {
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
}

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
```

# Reference

## Props

### `borderTopRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `backfaceVisibility`

| Type                      | Required |
| ------------------------- | -------- |
| enum('visible', 'hidden') | No       |

---

### `borderBottomLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `backgroundColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `opacity`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `overflow`

| Type                      | Required |
| ------------------------- | -------- |
| enum('visible', 'hidden') | No       |

---

### `resizeMode`

| Type                                                    | Required |
| ------------------------------------------------------- | -------- |
| enum('cover', 'contain', 'stretch', 'repeat', 'center') | No       |

---

### `tintColor`

Changes the color of all the non-transparent pixels to the tintColor.

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `overlayColor`

When the image has rounded corners, specifying an overlayColor will cause the remaining space in the corners to be filled with a solid color. This is useful in cases which are not supported by the Android implementation of rounded corners:

- Certain resize modes, such as 'contain'
- Animated GIFs

A typical way to use this prop is with images displayed on a solid background and setting the `overlayColor` to the same color as the background.

For details of how this works under the hood, see https://frescolib.org/docs/rounded-corners-and-circles.html

| Type   | Required | Platform |
| ------ | -------- | -------- |
| string | No       | Android  |
