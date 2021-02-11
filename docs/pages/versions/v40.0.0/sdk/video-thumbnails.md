---
title: VideoThumbnails
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-40/packages/expo-video-thumbnails'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-video-thumbnails`** allows you to generate an image to serve as a thumbnail from a video file.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-video-thumbnails" />

## Usage

<SnackInline label='Video Thumbnails' dependencies={['expo-video-thumbnails']}>

```jsx
import React, { useState } from 'react';
import { StyleSheet, Button, View, Image, Text } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function App() {
  const [image, setImage] = useState(null);

  const generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        {
          time: 15000,
        }
      );
      setImage(uri);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.container}>
      <Button onPress={generateThumbnail} title="Generate thumbnail" />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Text>{image}</Text>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  image: {
    width: 200,
    height: 200,
  },
});
/* @end */
```

</SnackInline>

## API

```js
import * as VideoThumbnails from 'expo-video-thumbnails';
```

### `VideoThumbnails.getThumbnailAsync(uri, options)`

Create an image thumbnail from video provided via `uri`.

#### Arguments

- **uri (_string_)** -- URI of the video.

- **options (_object_)** -- A map defining how modified thumbnail should be created:

  - **quality (_number_)** -- A value in range `0.0` - `1.0` specifying quality level of the result image. `1` means no compression (highest quality) and `0` the highest compression (lowest quality).
  - **time (_number_)** -- The time position where the image will be retrieved in ms.
  - **headers (_object_)** -- In case `uri` is a remote `uri`, headers object passed in a network request.

#### Returns

Returns `{ uri, width, height }` where `uri` is a URI to the created image (useable as the source for an `Image`/`Video` element), `width, height` specify the dimensions of the image.
