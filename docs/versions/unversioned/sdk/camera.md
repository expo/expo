---
title: Camera
---

A React component that renders a preview for the device's either front or back camera. Camera's parameters like zoom, auto focus, white balance and flash mode are adjustable. With use of `Camera` one can also take photos that are saved to the app's cache. Only one Camera preview is supported by Expo right now.

Requires `Permissions.CAMERA`.

### Example

```javascript
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Camera, Permissions } from 'expo';

export default class CameraExample extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
  };

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera style={{ flex: 1 }} type={this.state.type}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                style={{
                  flex: 0.1,
                  alignSelf: 'flex-end',
                  alignItems: 'center',
                }}
                onPress={() => {
                  this.setState({
                    type: this.state.type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back,
                  });
                }}>
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                  {' '}Flip{' '}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      );
    }
  }
}
```

### props

- **type**

Camera facing. Use one of `Camera.Constants.Type`. When `Type.front`, use the front-facing camera. When `Type.back`, use the back-facing camera. Default: `Type.back`.

- **flashMode**

Camera flash mode. Use one of `Camera.Constants.FlashMode`. When `on`, the flash on your device will turn on when taking a picture, when `off`, it wont't. Setting to `Type.auto` will fire flash if required, `Type.torch` turns on flash during the preview. Default: `off`.

- **autoFocus**

State of camera auto focus. Use one of `Camera.Constants.AutoFocus`. When `on`, auto focus will be enabled, when `off`, it wont't and focus will lock as it was in the moment of change but it can be adjusted on some devices via `focusDepth` prop.

- **zoom** (_float_)

A value between 0 and 1 being a percentage of device's max zoom. 0 - not zoomed, 1 - maximum zoom. Default: 0.

- **whiteBalance**

Camera white balance. Use one of `Camera.Constants.WhiteBalance`: `auto`, `sunny`, `cloudy`, `shadow`, `fluorescent`, `incandescent`. If a device does not support any of these values previous one is used.

- **focusDepth** (_float_)

Distance to plane of sharpest focus. A value between 0 and 1: 0 - infinity focus, 1 - focus as close as possible. Default: 0.

- **ratio** (_string_)

Android only. A string representing aspect ratio of the preview, eg. `4:3`, `16:9`, `1:1`. To check if a ratio is supported by the device use `getSupportedRatios`. Default: `4:3`.

- **onCameraReady** (_function_)

Callback invoked when camera preview has been set.

## Methods

To use methods that Camera exposes one has to create a components `ref` and invoke them using it.

```javascript
// ...
<Camera ref={ref => { this.camera = ref; }} />
// ...
snap() {
  if (this.camera) {
    this.camera.takePictureAsync().then( /* ... */ )
  }
}
```

### `takePictureAsync`

Takes a picture and saves it to app's cache directory. Photos are rotated to match device's orientation and scaled to match the preview. Anyway on Android it is essential to set `ratio` prop to get a picture with correct dimensions.

#### Returns

Returns a Promise that resolves to a string containing an uri to image file.

### `getSupportedRatiosAsync`

Android only. Get aspect ratios that are supported by the device and can be passed via `ratio` prop.

#### Returns

Returns a Promise that resolves to an array of strings representing ratios, eg. `['4:3', '1:1']`.
