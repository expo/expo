---
id: maskedviewios
title: MaskedViewIOS
---

Renders the child view with a mask specified in the `maskElement` prop.

## Example

```javascript
import React from 'react';
import { MaskedViewIOS, Text, View } from 'react-native';

class MyMaskedView extends React.Component {
  render() {
    return (
      // Determines shape of the mask
      <MaskedViewIOS
        style={{ flex: 1, flexDirection: 'row', height: '100%' }}
        maskElement={
          <View
            style={{
              // Transparent background because mask is based off alpha channel.
              backgroundColor: 'transparent',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 60,
                color: 'black',
                fontWeight: 'bold',
              }}>
              Basic Mask
            </Text>
          </View>
        }>
        {/* Shows behind the mask, you can put anything here, such as an image */}
        <View style={{ flex: 1, height: '100%', backgroundColor: '#324376' }} />
        <View style={{ flex: 1, height: '100%', backgroundColor: '#F5DD90' }} />
        <View style={{ flex: 1, height: '100%', backgroundColor: '#F76C5E' }} />
      </MaskedViewIOS>
    );
  }
}
```

The following image demonstrates that you can put almost anything behind the mask. The three examples shown are masked `<View>`, `<Text>`, and `<Image>`.

<center><img src="https://facebook.github.io/react-native/docs/assets/MaskedViewIOS/example.png" width="200" /></center>

**The alpha channel of the view rendered by the `maskElement` prop determines how much of the view's content and background shows through.** Fully or partially opaque pixels allow the underlying content to show through but fully transparent pixels block that content.

### Props

- [View props...](../view/#props)

* [`maskElement`](../maskedviewios/#maskelement)

---

# Reference

## Props

### `maskElement`

| Type    | Required |
| ------- | -------- |
| element | Yes      |
