---
title: takeSnapshotAsync
---

Given a view, `takeSnapshotAsync` will essentially screenshot that view and return an image for you. This is very useful for things like signature pads, where the user draws something and then you want to save an image from it.

If you're interested in taking snapshots from the GLView, we recommend you use [GLView's takeSnapshotAsync](../gl-view/#takesnapshotasync) instead.

### `Expo.takeSnapshotAsync(view, options)`

Snapshots the given view.

#### Arguments

-   **view (_number|ReactElement_)** -- The `ref` or `reactTag` (also known as node handle) for the view to snapshot.
-   **options (_object_)** --

      A map of options:

    -   **format (_string_)** -- `"png" | "jpg" | "jpeg" | "webm"`
    -   **quality (_number_)** -- Number between 0 and 1 where 0 is worst quality and 1 is best.
    -   **result (_string_)** -- The type for the resulting image.
            \-   `'file'` -- Return a file uri.
            \-   `'base64'` -- base64 encoded image.
            \-   `'data-uri'` -- base64 encoded image with data-uri prefix.
    -   **height (_number_)** -- Height of result in pixels.
    -   **width (_number_)** -- Width of result in pixels.

#### Returns

An image of the format specified in the options parameter.

##### Note on pixel values
Remember to take the device `PixelRatio` into account. When you work with pixel values in a UI, most of the time those units are "logical pixels" or "device-independent pixels". With images like PNG files, you often work with "physical pixels". You can get the `PixelRatio` of the device using the React Native API: `PixelRatio.get()`

For example, to save a 'FullHD' picture of `1080x1080`, you would do something like this:

```
const targetPixelCount = 1080; // If you want full HD pictures
const pixelRatio = PixelRatio.get(); // The pixel ratio of the device
// pixels * pixelratio = targetPixelCount, so pixels = targetPixelCount / pixelRatio
const pixels = targetPixelCount / pixelRatio;

const result = await takeSnapshotAsync(this.imageContainer, {
  result: 'file',
  height: pixels,
  width: pixels,
  quality: 1,
  format: 'png',
});
```

