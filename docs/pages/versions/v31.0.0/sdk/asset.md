---
title: Asset
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

This module provides an interface to Expo's asset system. An asset is any file that lives alongside the source code of your app that the app needs at runtime. Examples include images, fonts and sounds. Expo's asset system integrates with React Native's, so that you can refer to files with `require('path/to/file')`. This is how you refer to static image files in React Native for use in an `Image` component, for example. Check out React Native's [documentation on static image resources](https://facebook.github.io/react-native/docs/images.html#static-image-resources) for more information. This method of referring to static image resources works out of the box with Expo.

### `Expo.Asset()`

This class represents an asset in your app. It gives metadata about the asset (such as its name and type) and provides facilities to load the asset data.

- `name`

The name of the asset file without the extension. Also without the part from `@` onward in the filename (used to specify scale factor for images).

- `type`

The extension of the asset filename

- `hash`

The MD5 hash of the asset's data

- `uri`

A URI that points to the asset's data on the remote server. When running the published version of your app, this refers to the the location on Expo's asset server where Expo has stored your asset. When running the app from Expo CLI during development, this URI points to Expo CLI's server running on your computer and the asset is served directly from your computer.

- `localUri`

If the asset has been downloaded (by calling [`downloadAsync()`](#expoassetdownloadasync "Expo.Asset.downloadAsync")), the `file://` URI pointing to the local file on the device that contains the asset data.

- `width`

If the asset is an image, the width of the image data divided by the scale factor. The scale factor is the number after `@` in the filename, or `1` if not present.

- `height`

If the asset is an image, the height of the image data divided by the scale factor. The scale factor is the number after `@` in the filename, or `1` if not present.

- `downloadAsync()`

Downloads the asset data to a local file in the device's cache directory. Once the returned promise is fulfilled without error, the [`localUri`](#expoassetlocaluri "Expo.Asset.localUri") field of this asset points to a local file containing the asset data. The asset is only downloaded if an up-to-date local file for the asset isn't already present due to an earlier download.

### `Expo.Asset.loadAsync(modules)`

A helper that wraps `Expo.Asset.fromModule(module).downloadAsync` for convenience.

#### Arguments

-   **modules : `Array<number>|number`** -- An array of `require('path/to/file')`. Can also be just one module without an Array.

#### Returns

Returns a Promise that resolves when the asset has been saved to disk.

### `Expo.Asset.fromModule(module)`

Returns the [`Expo.Asset`](#expoasset "Expo.Asset") instance representing an asset given its module

#### Arguments

-   **module : `number`** -- The value of `require('path/to/file')` for the asset

#### Returns

The [`Expo.Asset`](#expoasset "Expo.Asset") instance for the asset

#### Example

```javascript
const imageURI = Expo.Asset.fromModule(require('./images/hello.jpg')).uri;
```

On running this piece of code, `imageURI` gives the remote URI that the contents of `images/hello.jpg` can be read from. The path is resolved relative to the source file that this code is evaluated in.
