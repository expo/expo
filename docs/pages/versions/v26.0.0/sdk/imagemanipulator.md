---
title: ImageManipulator
---

An API to modify images stored in app scope.

### `Expo.ImageManipulator.manipulate(uri, actions, saveOptions)`

Manipulate the image provided via `uri`. Available modifications are rotating, flipping (mirroring), resizing and cropping. Each invocation results in a new file. With one invocation you can provide a set of actions to perform over the image. Overwriting the source file would not have an effect in displaying the result as images are cached. 

#### Arguments

-   **uri (_string_)** -- URI of the file to manipulate. Should be in the app's scope.
-   **actions (_array_)** --

      An array of objects representing manipulation options. Each object should have one of the following keys:

    -   **resize (_object_)** -- An object of shape `{ width, height }`. Values correspond to the result image dimensions. If you specify only one value, the other will be set automatically to preserve image ratio.
    -   **rotate (_number_)** -- Degrees to rotate the image. Rotation is clockwise when the value is positive and counter-clockwise when negative.
    -   **flip (_object_)** -- An object of shape `{ vertical, horizontal }`. Having a field set to true, flips the image in specified axis.
    -   **crop (_object_)** -- An object of shape `{ originX, originY, width, height }`. Fields specify top-left corner and dimensions of a crop rectangle.

-  **saveOptions (_object_)** -- A map defining how modified image should be saved:
    -   **compress (_number_)** -- A value in range 0 - 1 specifying compression level of the result image. 1 means no compression and 0 the highest compression.
    -   **format (_string_)** -- Either `'jpeg'` or `'png'`. Specifies what type of compression should be used and what is the result file extension. PNG compression is lossless but slower, JPEG is faster but the image has visible artifacts. Defaults to `'jpeg'`.
    -   **base64 (_boolean_)** -- Whether to also include the image data in Base64 format.

#### Returns

Returns `{ uri, width, height }` where `uri` is a URI to the modified image (useable as the source for an `Image`/`Video` element), `width, height` specify the dimensions of the image. It can contain also `base64` - it is included if the `base64` saveOption was truthy, and is a string containing the JPEG/PNG (depending on `format`) data of the image in Base64--prepend that with `'data:image/xxx;base64,'` to get a data URI, which you can use as the source for an `Image` element for example (where `xxx` is 'jpeg' or 'png').

### Basic Example

This will first rotate the image 90 degrees clockwise, then flip the rotated image vertically and save it as a PNG.

```javascript
import React from 'react';
import { Button, TouchableOpacity, Text, View, Image } from 'react-native';
import { Asset, ImageManipulator } from 'expo';

import Colors from '../constants/Colors';

export default class ImageManipulatorSample extends React.Component {
  state = {
    ready: false,
    image: null,
  };

  componentWillMount() {
    (async () => {
      const image = Asset.fromModule(require('../path/to/image.jpg'));
      await image.downloadAsync();
      this.setState({
        ready: true,
        image,
      });
    })();
  }

  render() {
    return (
      <View style={{ flex: 1 }>
        <View style={{ padding: 10 }}>
          <Button onPress={this._rotate90andFlip} />
          {this.state.ready && this._renderImage()}
        </View>
      </View>
    );
  }

  _rotate90andFlip = async () => {
    const manipResult = await ImageManipulator.manipulate(
      this.state.image.localUri || this.state.image.uri,
      [{ rotate: 90}, { flip: { vertical: true }}],
      { format: 'png' }
    );
    this.setState({ image: manipResult });
  }

  _renderImage = () => {
    return (
      <View style={{marginVertical: 10, alignItems: 'center', justifyContent: 'center'}}>
        <Image
          source={{ uri: this.state.image.localUri || this.state.image.uri }}
          style={{ width: 300, height: 300, resizeMode: 'contain' }}
        />
      </View>
    );
  };
}
```
