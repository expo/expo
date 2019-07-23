---
id: modal
title: Modal
---

The Modal component is a simple way to present content above an enclosing view.

> Note: If you need more control over how to present modals over the rest of your app, then consider using a top-level Navigator.

```javascript
import React, { Component } from 'react';
import { Modal, Text, TouchableHighlight, View, Alert } from 'react-native';

class ModalExample extends Component {
  state = {
    modalVisible: false,
  };

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
          }}>
          <View style={{ marginTop: 22 }}>
            <View>
              <Text>Hello World!</Text>

              <TouchableHighlight
                onPress={() => {
                  this.setModalVisible(!this.state.modalVisible);
                }}>
                <Text>Hide Modal</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>

        <TouchableHighlight
          onPress={() => {
            this.setModalVisible(true);
          }}>
          <Text>Show Modal</Text>
        </TouchableHighlight>
      </View>
    );
  }
}
```

### Props

- [`visible`](../modal/#visible)
- [`supportedOrientations`](../modal/#supportedorientations)
- [`onRequestClose`](../modal/#onrequestclose)
- [`onShow`](../modal/#onshow)
- [`transparent`](../modal/#transparent)
- [`animationType`](../modal/#animationtype)
- [`hardwareAccelerated`](../modal/#hardwareaccelerated)
- [`onDismiss`](../modal/#ondismiss)
- [`onOrientationChange`](../modal/#onorientationchange)
- [`presentationStyle`](../modal/#presentationstyle)
- [`animated`](../modal/#animated)

---

# Reference

## Props

### `visible`

The `visible` prop determines whether your modal is visible.

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

### `transparent`

The `transparent` prop determines whether your modal will fill the entire view. Setting this to `true` will render the modal over a transparent background.

| Type | Required |
| ---- | -------- |
| bool | No       |

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

### `animated`

> **Deprecated.** Use the [`animationType`](../modal/#animationtype) prop instead.
