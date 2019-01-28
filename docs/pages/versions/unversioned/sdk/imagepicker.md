---
title: ImagePicker
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';
import SnackEmbed from '~/components/plugins/SnackEmbed';

export default withDocumentationElements(meta);

Provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

### `Expo.ImagePicker.launchImageLibraryAsync(options)`

Display the system UI for choosing an image or a video from the phone's library. Requires `Permissions.CAMERA_ROLL` on iOS only.

#### Arguments

-   **options : `object`** --

      A map of options for both:

    -   **mediaTypes : `String`** -- Choose what type of media to pick. Usage: `ImagePicker.MediaTypeOptions.<Type>`, where `<Type>` is one of: `Images`, `Videos`, `All`.
    -   **allowsEditing : `boolean`** -- Whether to show a UI to edit the image/video after it is picked. Images: On Android the user can crop and rotate the image and on iOS simply crop it. Videos: On iOS user can trim the video. Defaults to `false`.

      A map of options for images:

    -   **aspect : `array`** -- An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on Android, since on iOS the crop rectangle is always a square.
    -   **quality : `number`** -- Specify the quality of compression, from 0 to 1. 0 means compress for small size, 1 means compress for maximum quality.
    -   **base64 : `boolean`** -- Whether to also include the image data in Base64 format.
    -   **exif : `boolean`** -- Whether to also include the EXIF data for the image.

#### Returns

If the user cancelled the picking, returns `{ cancelled: true }`.

Otherwise, returns `{ cancelled: false, uri, width, height, type }` where `uri` is a URI to the local media file (useable as the source for an `Image`/`Video` element), `width, height` specify the dimensions of the media and `type` is one of `image` or `video` telling what kind of media has been chosen. Images can contain also `base64` and `exif` keys. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data of the image in Base64--prepend that with `'data:image/jpeg;base64,'` to get a data URI, which you can use as the source for an `Image` element for example. `exif` is included if the `exif` option was truthy, and is an object containing EXIF data for the image--the names of its properties are EXIF tags and their values are the values for those tags. If a video has been picked the return object contains an additional key `duration` specifying the video's duration in miliseconds.

### `Expo.ImagePicker.launchCameraAsync(options)`

Display the system UI for taking a photo with the camera. Requires `Permissions.CAMERA` along with `Permissions.CAMERA_ROLL`.

#### Arguments

-   **options : `object`** --

      A map of options:

    -   **allowsEditing : `boolean`** -- Whether to show a UI to edit the image after it is picked. On Android the user can crop and rotate the image and on iOS simply crop it. Defaults to `false`.
    -   **aspect : `array`** -- An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on Android, since on iOS the crop rectangle is always a square.
    -   **quality : `number`** -- Specify the quality of compression, from 0 to 1. 0 means compress for small size, 1 means compress for maximum quality.
    -   **base64 : `boolean`** -- Whether to also include the image data in Base64 format.
    -   **exif : `boolean`** -- Whether to also include the EXIF data for the image. On iOS the EXIF data does not include GPS tags in the camera case.

#### Returns

If the user cancelled taking a photo, returns `{ cancelled: true }`.

Otherwise, returns `{ cancelled: false, uri, width, height, exif, base64 }` where `uri` is a URI to the local image file (useable as the source for an `Image` element) and `width, height` specify the dimensions of the image. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data of the image in Base64--prepend that with `'data:image/jpeg;base64,'` to get a data URI, which you can use as the source for an `Image` element for example. `exif` is included if the `exif` option was truthy, and is an object containing EXIF data for the image--the names of its properties are EXIF tags and their values are the values for those tags. 

<SnackEmbed snackId="S19Ge5k2g" />

When you run this example and pick an image, you will see the image that you picked show up in your app, and something similar to the following logged to your console:

```javascript
{
  "cancelled":false,
  "height":1611,
  "width":2148,
  "uri":"file:///data/user/0/host.exp.exponent/cache/cropped1814158652.jpg"
}
```
