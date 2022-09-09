---
title: captureRef
sourceCodeUrl: 'https://github.com/gre/react-native-view-shot'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

Given a view, `captureRef` will essentially screenshot that view and return an image for you. This is very useful for things like signature pads, where the user draws something and then you want to save an image from it.

If you're interested in taking snapshots from the GLView, we recommend you use [GLView's takeSnapshotAsync](gl-view.md#takesnapshotasyncoptions) instead.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="react-native-view-shot" href="https://github.com/gre/react-native-view-shot" />

## API

```js
import { captureRef } from 'react-native-view-shot';
```

### `captureRef(view, options)`

Snapshots the given view.

#### Arguments

- **view (_number|ReactElement_)** -- The `ref` or `reactTag` (also known as node handle) for the view to snapshot.
- **options (_object_)** --

  An optional map of optional options

  - **format (_string_)** -- `"png" | "jpg" | "webm"`, defaults to `"png"`, `"webm"` supported only on Android.
  - **quality (_number_)** -- Number between 0 and 1 where 0 is worst quality and 1 is best, defaults to `1`
  - **result (_string_)** -- The type for the resulting image.
    \- `'tmpfile'` -- (default) Return a temporary file uri.
    \- `'base64'` -- base64 encoded image.
    \- `'data-uri'` -- base64 encoded image with data-uri prefix.
  - **height (_number_)** -- Height of result in pixels
  - **width (_number_)** -- Width of result in pixels
  - **snapshotContentContainer (_bool_)** -- if true and when view is a ScrollView, the "content container" height will be evaluated instead of the container height

#### Returns

An image of the format specified in the options parameter.

## Note on pixel values

Remember to take the device `PixelRatio` into account. When you work with pixel values in a UI, most of the time those units are "logical pixels" or "device-independent pixels". With images like PNG files, you often work with "physical pixels". You can get the `PixelRatio` of the device using the React Native API: `PixelRatio.get()`

For example, to save a 'FullHD' picture of `1080x1080`, you would do something like this:

```js
const targetPixelCount = 1080; // If you want full HD pictures
const pixelRatio = PixelRatio.get(); // The pixel ratio of the device
// pixels * pixelratio = targetPixelCount, so pixels = targetPixelCount / pixelRatio
const pixels = targetPixelCount / pixelRatio;

const result = await captureRef(this.imageContainer, {
  result: 'tmpfile',
  height: pixels,
  width: pixels,
  quality: 1,
  format: 'png',
});
```
