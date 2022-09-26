---
id: transforms
title: Transforms
---

Transforms are style properties that will help you modify the appearance and position of your components using 2D or 3D transformations. However, once you apply transforms, the layouts remain the same around the transformed component hence it might overlap with the nearby components. You can apply margin to the transformed component, the nearby components or padding to the container to prevent such overlaps.

## Example

```js
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const App = () => (
  <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.box}>
        <Text style={styles.text}>Original Object</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ scale: 2 }],
          },
        ]}>
        <Text style={styles.text}>Scale by 2</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ scaleX: 2 }],
          },
        ]}>
        <Text style={styles.text}>ScaleX by 2</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ scaleY: 2 }],
          },
        ]}>
        <Text style={styles.text}>ScaleY by 2</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ rotate: '45deg' }],
          },
        ]}>
        <Text style={styles.text}>Rotate by 45 deg</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ rotateX: '45deg' }, { rotateZ: '45deg' }],
          },
        ]}>
        <Text style={styles.text}>Rotate X&Z by 45 deg</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ rotateY: '45deg' }, { rotateZ: '45deg' }],
          },
        ]}>
        <Text style={styles.text}>Rotate Y&Z by 45 deg</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ skewX: '45deg' }],
          },
        ]}>
        <Text style={styles.text}>SkewX by 45 deg</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ skewY: '45deg' }],
          },
        ]}>
        <Text style={styles.text}>SkewY by 45 deg</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ skewX: '30deg' }, { skewY: '30deg' }],
          },
        ]}>
        <Text style={styles.text}>Skew X&Y by 30 deg</Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ translateX: -50 }],
          },
        ]}>
        <Text style={styles.text}>TranslateX by -50 </Text>
      </View>

      <View
        style={[
          styles.box,
          {
            transform: [{ translateY: 50 }],
          },
        ]}>
        <Text style={styles.text}>TranslateY by 50 </Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  box: {
    height: 100,
    width: 100,
    borderRadius: 5,
    marginVertical: 40,
    backgroundColor: '#61dafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    margin: 8,
    color: '#000',
    textAlign: 'center',
  },
});

export default App;
```

---

# Reference

## Methods

### `transform()`

`transform` accepts an array of transformation objects. Each object specifies the property that will be transformed as the key, and the value to use in the transformation. Objects should not be combined. Use a single key/value pair per object.

The rotate transformations require a string so that the transform may be expressed in degrees (deg) or radians (rad). For example:

```js
transform([{ rotateX: '45deg' }, { rotateZ: '0.785398rad' }]);
```

The skew transformations require a string so that the transform may be expressed in degrees (deg). For example:

```js
transform([{ skewX: '45deg' }]);
```

| Type                                                                                                                                                                                                                                                                      | Required |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| array of objects: `{matrix: number[]}, {perspective: number}, {rotate: string}, {rotateX: string}, {rotateY: string}, {rotateZ: string}, {scale: number}, {scaleX: number}, {scaleY: number}, {translateX: number}, {translateY: number}, {skewX: string}, {skewY: string}` | No       |

---

### `decomposedMatrix`, `rotation`, `scaleX`, `scaleY`, `transformMatrix`, `translateX`, `translateY`

> **Deprecated.** Use the [`transform`](transforms.md#transform) prop instead.
