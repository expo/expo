---
title: ImageManipulator
---

An API to modify images stored on the local file system.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-image-manipulator`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-image-manipulator).

> **Note**: Not compatible with web.

## API

```js
import * as ImageManipulator from 'expo-image-manipulator';
```

### `ImageManipulator.manipulateAsync(uri, actions, saveOptions)`

Manipulate the image provided via `uri`. Available modifications are rotating, flipping (mirroring), resizing and cropping. Each invocation results in a new file. With one invocation you can provide a set of actions to perform over the image. Overwriting the source file would not have an effect in displaying the result as images are cached.

#### Arguments

- **uri (_string_)** -- URI of the file to manipulate. Should be on the local file system.
- **actions (_array_)** --

  An array of objects representing manipulation options. Each object should have _only one_ of the following keys that corresponds to specific transformation:

  - **resize (_object_)** -- An object of shape `{ width, height }`. Values correspond to the result image dimensions. If you specify only one value, the other will be calculated automatically to preserve image ratio.
  - **rotate (_number_)** -- Degrees to rotate the image. Rotation is clockwise when the value is positive and counter-clockwise when negative.
  - **flip (_string_)** -- `ImageManipulator.FlipType.{Vertical, Horizontal}`. Only one flip per transformation is available. If you want to flip according to both axes then provide two separate transformations.
  - **crop (_object_)** -- An object of shape `{ originX, originY, width, height }`. Fields specify top-left corner and dimensions of a crop rectangle.

- **saveOptions (_object_)** -- A map defining how modified image should be saved:
  - **compress (_number_)** -- A value in range `0.0` - `1.0` specifying compression level of the result image. `1` means no compression (highest quality) and `0` the highest compression (lowest quality).
  - **format (_string_)** -- `ImageManipulator.SaveFormat.{JPEG, PNG}`. Specifies what type of compression should be used and what is the result file extension. `SaveFormat.PNG` compression is lossless but slower, `SaveFormat.JPEG` is faster but the image has visible artifacts. Defaults to `SaveFormat.JPEG`.
  - **base64 (_boolean_)** -- Whether to also include the image data in Base64 format.

#### Returns

Returns `{ uri, width, height }` where `uri` is a URI to the modified image (useable as the source for an `Image`/`Video` element), `width, height` specify the dimensions of the image. It can contain also `base64` - it is included if the `base64` saveOption was truthy, and is a string containing the JPEG/PNG (depending on `format`) data of the image in Base64--prepend that with `'data:image/xxx;base64,'` to get a data URI, which you can use as the source for an `Image` element for example (where `xxx` is 'jpeg' or 'png').

### Basic Example

This will first rotate the image 90 degrees clockwise, then flip the rotated image vertically and save it as a PNG.

```javascript
import React from 'react';
import { Button, TouchableOpacity, Text, View, Image } from 'react-native';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';

export default class ImageManipulatorSample extends React.Component {
  state = {
    ready: false,
    image: null,
  };

  componentDidMount() {
    (async () => {
      const image = Asset.fromModule(require('./assets/snack-icon.png'));
      await image.downloadAsync();
      this.setState({
        ready: true,
        image,
      });
    })();
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {this.state.ready && this._renderImage()}
        <Button title="Rotate and Flip" onPress={this._rotate90andFlip} />
      </View>
    );
  }

  _rotate90andFlip = async () => {
    const manipResult = await ImageManipulator.manipulateAsync(
      this.state.image.localUri || this.state.image.uri,
      [{ rotate: 90 }, { flip: ImageManipulator.FlipType.Vertical }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    this.setState({ image: manipResult });
  };

  _renderImage = () => {
    return (
      <View style={{ marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={{ uri: this.state.image.localUri || this.state.image.uri }}
          style={{ width: 300, height: 300, resizeMode: 'contain' }}
        />
      </View>
    );
  };
}
```
