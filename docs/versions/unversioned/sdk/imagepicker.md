---
title: ImagePicker
---

Provides access to the system's UI for selecting images from the phone's photo library or taking a photo with the camera.

### `Expo.ImagePicker.launchImageLibraryAsync(options)`

Display the system UI for choosing an image from the phone's photo library.

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **allowsEditing (_boolean_)** -- Whether to show a UI to edit the image after it is picked. On Android the user can crop and rotate the image and on iOS simply crop it. Defaults to `false`.
    -   **aspect (_array_)** -- An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on Android, since on iOS the crop rectangle is always a square.
    -   **quality (_number_)** -- Specify the quality of the image saved.
    -   **base64 (_boolean_)** -- Whether to return the image data in Base64 format.

#### Returns

If the user cancelled the image picking, returns `{ cancelled: true }`.

Otherwise, returns `{ cancelled: false, uri, width, height, base64 }` where `uri` is a URI to the local image file (useable in a react-native `Image` tag) and `width, height` specify the dimensions of the image. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data of the image in Base64--prepend that with `'data:image/jpg;base64,'` to get a data URI, which you can use as the source for an `Image` component for example.

### `Expo.ImagePicker.launchCameraAsync(options)`

Display the system UI for taking a photo with the camera.

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **allowsEditing (_boolean_)** -- Whether to show a UI to edit the image after it is picked. On Android the user can crop and rotate the image and on iOS simply crop it. Defaults to `false`.
    -   **aspect (_array_)** -- An array with two entries `[x, y]` specifying the aspect ratio to maintain if the user is allowed to edit the image (by passing `allowsEditing: true`). This is only applicable on Android, since on iOS the crop rectangle is always a square.
    -   **quality (_number_)** -- Specify the quality of the image saved.
    -   **base64 (_boolean_)** -- Whether to return the image data in Base64 format.

#### Returns

If the user cancelled taking a photo, returns `{ cancelled: true }`.

Otherwise, returns `{ cancelled: false, uri, width, height, base64 }` where `uri` is a URI to the local image file (useable in a react-native `Image` tag) and `width, height` specify the dimensions of the image. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data of the image in Base64--prepend that with `'data:image/jpg;base64,'` to get a data URI, which you can use as the source for an `Image` component for example.

![sketch](S19Ge5k2g)

When you run this example and pick an image, you will see the image that you picked show up in your app, and something similar to the following logged to your console:

```javascript
{
  "cancelled":false,
  "height":1611,
  "width":2148,
  "uri":"file:///data/user/0/host.exp.exponent/cache/cropped1814158652.jpg"
}
```
