---
title: Asset
old_permalink: /versions/v7.0.0/sdk/asset.html
previous___FILE: ./index.md
next___FILE: ./constants.md
---

This module provides an interface to Exponent's asset system. An asset is any file that lives alongside the source code of your app that the app needs at runtime. Examples include images, fonts and sounds. Exponent's asset system integrates with React Native's, so that you can refer to files with `require('path/to/file')`. This is how you refer to static image files in React Native for use in an `Image` component, for example. Check out React Native's [documentation on static image resources](https://facebook.github.io/react-native/docs/images.html#static-image-resources) for more information. This method of referring to static image resources works out of the box with Exponent.

### `Exponent.Asset.fromModule(module)`

Get metadata about an asset.

#### Arguments

-   **module (_number_)** -- The value of `require('path/to/file')` for the asset.

#### Returns

Returns an object with the following fields:

-   **uri (_string_)** -- A URI that points to the asset's data. When running the published version of your app, this refers to the the location on Exponent's asset server where Exponent has stored your asset. When running the app from XDE during development, this URI point's to XDE's server running on your computer and the asset is served directly from your computer.
-   **name (_string_)** -- The name of the asset file without the extension
-   **type (_string_)** -- The extension of the asset filename
-   **width (_number_)** -- If the asset is an image, the width of the image in pixels
-   **height (_number_)** -- If the asset is an image, the height of the image in pixels

#### Example

    const soundURI = Exponent.Asset.fromModule(require('./sounds/beep.wav')).uri;

On running this piece of code, `soundURI` is a URI that can be used to read the contents of `sounds/beep.wav`. The path is resolved relative to the source file that this code is evaluated in.
