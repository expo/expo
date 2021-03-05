---
id: modal
title: Modal
---

The Modal component is a basic way to present content above an enclosing view.

> Note: If you need more control over how to present modals over the rest of your app, then consider using a top-level Navigator.

```javascript
import React, { Component, useState } from 'react';
import { Modal, Text, TouchableHighlight, View, Alert } from 'react-native';

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={{ marginTop: 22 }}>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
        }}>
        <View style={{ marginTop: 22 }}>
          <View>
            <Text>Hello World!</Text>

            <TouchableHighlight
              onPress={() => {
                setModalVisible(!modalVisible);
              }}>
              <Text>Hide Modal</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      <TouchableHighlight
        onPress={() => {
          setModalVisible(true);
        }}>
        <Text>Show Modal</Text>
      </TouchableHighlight>
    </View>
  );
}
```

---

# Reference

## Props

### `animated`

> **Deprecated.** Use the [`animationType`](modal.md#animationtype) prop instead.

---

### `animationType`

The `animationType` prop controls how the modal animates.

- `slide` slides in from the bottom
- `fade` fades into view
- `none` appears without an animation

Default is set to `none`.

| Type                          | Required |
| ----------------------------- | -------- |
| enum('none', 'slide', 'fade') | No       |

---

### `hardwareAccelerated`

The `hardwareAccelerated` prop controls whether to force hardware acceleration for the underlying window.

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `onDismiss`

The `onDismiss` prop allows passing a function that will be called once the modal has been dismissed.

| Type     | Required | Platform |
| -------- | -------- | -------- |
| function | No       | iOS      |

---

### `onOrientationChange`

The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed. The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.

| Type     | Required | Platform |
| -------- | -------- | -------- |
| function | No       | iOS      |

---

### `onRequestClose`

The `onRequestClose` callback is called when the user taps the hardware back button on Android or the menu button on Apple TV. Because of this required prop, be aware that `BackHandler` events will not be emitted as long as the modal is open.

| Type     | Required | Platform                 |
| -------- | -------- | ------------------------ |
| function | Yes      | Android, Platform.isTVOS |
| function | No       | (Others)                 |

---

### `onShow`

The `onShow` prop allows passing a function that will be called once the modal has been shown.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `presentationStyle`

The `presentationStyle` prop controls how the modal appears (generally on larger devices such as iPad or plus-sized iPhones). See https://developer.apple.com/reference/uikit/uimodalpresentationstyle for details.

- `fullScreen` covers the screen completely
- `pageSheet` covers portrait-width view centered (only on larger devices)
- `formSheet` covers narrow-width view centered (only on larger devices)
- `overFullScreen` covers the screen completely, but allows transparency

Default is set to `overFullScreen` or `fullScreen` depending on `transparent` property.

| Type                                                           | Required | Platform |
| -------------------------------------------------------------- | -------- | -------- |
| enum('fullScreen', 'pageSheet', 'formSheet', 'overFullScreen') | No       | iOS      |

---

### `statusBarTranslucent`

The `statusBarTranslucent` prop determines whether your modal should go under the system statusbar.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `supportedOrientations`

The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations. On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field. When using `presentationStyle` of `pageSheet` or `formSheet`, this property will be ignored by iOS.

| Type                                                                                                | Required | Platform |
| --------------------------------------------------------------------------------------------------- | -------- | -------- |
| array of enum('portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right') | No       | iOS      |

---

### `transparent`

The `transparent` prop determines whether your modal will fill the entire view. Setting this to `true` will render the modal over a transparent background.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `visible`

The `visible` prop determines whether your modal is visible.

| Type | Required |
| ---- | -------- |
| bool | No       |
