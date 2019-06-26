---
title: VideoThumbnails
---

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-video-thumbnails`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-image-manipulator).

## API

```js
import * as VideoThumbnails from 'expo-video-thumbnails';
```

### `VideoThumbnails.getThumbnailAsync(uri, options)`

Create an image thumbnail from video provided via `uri`.

#### Arguments

- **uri (_string_)** -- URI of the video.

- **options (_object_)** -- A map defining how modified thumbnail should be created:

  - **compress (_number_)** -- A value in range `0.0` - `1.0` specifying compression level of the result image. `1` means no compression (highest quality) and `0` the highest compression (lowest quality).
  - **time (_number_)** -- The time position where the image will be retrieved in ms.
  - **headers (_object_)** -- In case `uri` is a remote `uri`, headers object passed in a network request.

#### Returns

Returns `{ uri, width, height }` where `uri` is a URI to the created image (useable as the source for an `Image`/`Video` element), `width, height` specify the dimensions of the image.

### Basic Example

```javascript
import React from 'react';
import { StyleSheet, Button, View, Image, Text } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default class App extends React.Component {
  state = {
    image: null,
  };

  generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        {
          time: 15000,
        }
      );
      this.setState({ image: uri });
    } catch (e) {
      console.warn(e);
    }
  };

  render() {
    const { image } = this.state;
    return (
      <View style={styles.container}>
        <Button onPress={this.generateThumbnail} title="Generate thumbnail" />
        {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
        <Text>{image}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
```
