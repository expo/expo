---
title: ImagePicker
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-image-picker'
---

import APISection from '~/components/plugins/APISection'; 
import InstallSection from '~/components/plugins/InstallSection'; 
import PlatformsSection from '~/components/plugins/PlatformsSection';
import Video from '~/components/plugins/Video';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-image-picker`** provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

<Video file={"sdk/imagepicker.mp4"} loop={false} />

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-image-picker" />

## Configuration

In managed apps, the permissions to pick images, from camera ([`Permissions.CAMERA`](permissions.md#permissionscamera)) or camera roll ([`Permissions.MEDIA_LIBRARY`](permissions.md#permissionsmedia_library)), are added automatically.

## Usage

<SnackInline label='Image Picker' dependencies={['expo-image-picker']}>

```js
import React, { useState, useEffect } from 'react';
import { Button, Image, View, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ImagePickerExample() {
  const [image, setImage] = useState(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
  );
}
```

</SnackInline>

When you run this example and pick an image, you will see the image that you picked show up in your app, and something similar to the following logged to your console:

```javascript
{
  "cancelled":false,
  "height":1611,
  "width":2148,
  "uri":"file:///data/user/0/host.exp.exponent/cache/cropped1814158652.jpg"
}
```

## Using ImagePicker with AWS S3

Please refer to the [with-aws-storage-upload example](https://github.com/expo/examples/tree/master/with-aws-storage-upload). Follow [Amplify docs](https://docs.amplify.aws/) to set your project up correctly.


## Using ImagePicker with Firebase

Please refer to the [with-firebase-storage-upload example](https://github.com/expo/examples/tree/master/with-firebase-storage-upload). Make sure you follow the ["Using Firebase"](/guides/using-firebase/) docs to set your project up correctly.

## API

```js
import * as ImagePicker from 'expo-image-picker';
```

<APISection packageName="expo-image-picker" apiName="ImagePicker" />
