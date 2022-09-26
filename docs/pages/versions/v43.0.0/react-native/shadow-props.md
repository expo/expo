---
id: shadow-props
title: Shadow Props
---

```js
import React, { useState } from 'react';
import { Text, View, StyleSheet, Slider } from 'react-native';

const ShadowPropSlider = ({ label, value, ...props }) => {
  return (
    <>
      <Text>
        {label} ({value.toFixed(2)})
      </Text>
      <Slider step={1} value={value} {...props} />
    </>
  );
};

const App = () => {
  const [shadowOffsetWidth, setShadowOffsetWidth] = useState(0);
  const [shadowOffsetHeight, setShadowOffsetHeight] = useState(0);
  const [shadowRadius, setShadowRadius] = useState(0);
  const [shadowOpacity, setShadowOpacity] = useState(0.1);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.square,
          {
            shadowOffset: {
              width: shadowOffsetWidth,
              height: -shadowOffsetHeight,
            },
            shadowOpacity,
            shadowRadius,
          },
        ]}
      />
      <View style={styles.controls}>
        <ShadowPropSlider
          label="shadowOffset - X"
          minimumValue={-50}
          maximumValue={50}
          value={shadowOffsetWidth}
          onValueChange={val => setShadowOffsetWidth(val)}
        />
        <ShadowPropSlider
          label="shadowOffset - Y"
          minimumValue={-50}
          maximumValue={50}
          value={shadowOffsetHeight}
          onValueChange={val => setShadowOffsetHeight(val)}
        />
        <ShadowPropSlider
          label="shadowRadius"
          minimumValue={0}
          maximumValue={100}
          value={shadowRadius}
          onValueChange={val => setShadowRadius(val)}
        />
        <ShadowPropSlider
          label="shadowOpacity"
          minimumValue={0}
          maximumValue={1}
          step={0.05}
          value={shadowOpacity}
          onValueChange={val => setShadowOpacity(val)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  square: {
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 4,
    height: 150,
    shadowColor: 'black',
    width: 150,
  },
  controls: {
    paddingHorizontal: 12,
  },
});

export default App;
```

# Reference

## Props

### `shadowColor`

Sets the drop shadow color.

This property will only work on Android API 28 and above. For similar functionality on lower Android APIs, use the [`elevation` property](view-style-props.md#elevation-android).

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `shadowOffset` **(iOS)**

Sets the drop shadow offset.

| Type                                                    |
|---------------------------------------------------------|
| object: &lbrace; width: number, height: number&rbrace;` |

---

### `shadowOpacity` **(iOS)**

Sets the drop shadow opacity (multiplied by the color's alpha component).

| Type   |
| ------ |
| number |

---

### `shadowRadius` **(iOS)**

Sets the drop shadow blur radius.

| Type   |
| ------ |
| number |
