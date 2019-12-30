---
title: ImagePicker
sourceCodeUrl: "https://github.com/expo/expo/tree/sdk-34/packages/expo-image-picker"
---

import SnackInline from '~/components/plugins/SnackInline';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

Provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator |  Web  |
| ------ | ---------- | ------ | ------ | ------ |
| ✅     |  ✅     | ✅     | ✅     | ✅    |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-image-picker`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-image-picker).

## Usage

<SnackInline label='Basic ImagePicker usage' templateId='image-picker' dependencies={['expo-constants', 'expo-permissions', 'expo-image-picker']}>

```javascript
import * as React from 'react';
import { Button, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';

export default class ImagePickerExample extends React.Component {
  state = {
    image: null,
  };

  render() {
    let { image } = this.state;

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button
          title="Pick an image from camera roll"
          onPress={this._pickImage}
        />
        {image &&
          <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
      </View>
    );
  }

  componentDidMount() {
    this.getPermissionAsync();
    console.log('hi');
  }

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  }

  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    console.log(result);

    if (!result.cancelled) {
      this.setState({ image: result.uri });
    }
  };
}
```

</SnackInline>

## API

```js
import * as ImagePicker from 'expo-image-picker';
```

<TableOfContentSection title='Methods' contents={['ImagePicker.launchImageLibraryAsync(options)', 'ImagePicker.launchCameraAsync(options)']} />

## Methods

### `ImagePicker.launchImageLibraryAsync(options)`

Display the system UI for choosing an image or a video from the phone's library. Requires `Permissions.CAMERA_ROLL` on iOS only.

#### Arguments

- **options (_object_)** --

  A map of options for both:

  - **mediaTypes (_String_)** -- Choose what type of media to pick. Usage: `ImagePicker.MediaTypeOptions.<Type>`, where `<Type>` is one of: `Images`, `Videos`, `All`.
  - **allowsEditing (_boolean_)** -- Whether to show a UI to edit the image/video after it is picked. Images: On Android the user can crop and rotate the image and on iOS simply crop it. Videos: On iOS user can trim the video. Defaults to `false`.
  - **allowsMultipleSelection (_boolean_)** -- (Web only) Whether or not to allow selecting multiple media files at once.


  A map of options for images:

  - **aspect (_array_)** -- An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on Android, since on iOS the crop rectangle is always a square.
  - **quality (_number_)** -- Specify the quality of compression, from 0 to 1. 0 means compress for small size, 1 means compress for maximum quality.
  - **base64 (_boolean_)** -- Whether to also include the image data in Base64 format.
  - **exif (_boolean_)** -- Whether to also include the EXIF data for the image.

**Animated GIFs support** If the selected image is an animated GIF, the result image will be an animated GIF too if and only if `quality` is set to `undefined` and `allowsEditing` is set to `false`. Otherwise compression and/or cropper will pick the first frame of the GIF and return it as the result (on Android the result will be a PNG, on iOS — GIF).

#### Returns

If the user cancelled the picking, returns `{ cancelled: true }`.

Otherwise, returns `{ cancelled: false, uri, width, height, type }` where `uri` is a URI to the local media file (useable as the source for an `Image`/`Video` element), `width, height` specify the dimensions of the media and `type` is one of `image` or `video` telling what kind of media has been chosen. Images can contain also `base64` and `exif` keys. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data of the image in Base64--prepend that with `'data:image/jpeg;base64,'` to get a data URI, which you can use as the source for an `Image` element for example. `exif` is included if the `exif` option was truthy, and is an object containing EXIF data for the image--the names of its properties are EXIF tags and their values are the values for those tags. If a video has been picked the return object contains an additional key `duration` specifying the video's duration in miliseconds.

### `ImagePicker.launchCameraAsync(options)`

Display the system UI for taking a photo with the camera. Requires `Permissions.CAMERA` along with `Permissions.CAMERA_ROLL`.

#### Arguments

- **options (_object_)** --

  A map of options:

  - **mediaTypes (_String_)** -- Choose what type of media to pick. Usage: `ImagePicker.MediaTypeOptions.<Type>`, where `<Type>` is one of: `Images`, `Videos`, `All` (only on iOS). Defaults to `Images`
  - **allowsEditing (_boolean_)** -- Whether to show a UI to edit the image after it is picked. On Android the user can crop and rotate the image and on iOS simply crop it. Defaults to `false`.
  - **aspect (_array_)** -- An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on Android, since on iOS the crop rectangle is always a square.
  - **quality (_number_)** -- Specify the quality of compression, from 0 to 1. 0 means compress for small size, 1 means compress for maximum quality.
  - **base64 (_boolean_)** -- Whether to also include the image data in Base64 format.
  - **exif (_boolean_)** -- Whether to also include the EXIF data for the image. On iOS the EXIF data does not include GPS tags in the camera case.

#### Returns

If the user cancelled the action, the method returns `{ cancelled: true }`.

Otherwise, this method returns information about the selected media item. When the chosen item is an image, this method returns `{ cancelled: false, type: 'image', uri, width, height, exif, base64 }`; when the item is a video, this method returns  `{ cancelled: false, type: 'video', uri, width, height, duration }`.
The `uri` property is a URI to the local image or video file (usable as the source of an `Image` element, in the case of an image) and `width` and `height` specify the dimensions of the media.
The `base64` property is included if the `base64` option is truthy, and is a Base64-encoded string of the selected image's JPEG data; prepared it with `data:image/jpeg;base64,` to create a data URI, which you can use as the source of an `Image` element, for example.
The `exif` field is included if the `exif` option is truthy, and is an object containing the image's EXIF data. The names of this object's properties are EXIF tags and the values are the respective EXIF values for those tags.