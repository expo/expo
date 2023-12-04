<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/image-utils</code>
</h1>

<p align="center">A library for image processing functionality in Expo CLI.</p>

<!-- Body -->

It uses `sharp` for image processing if it's available through a global `sharp-cli` installation. Otherwise it uses `jimp`, a Node library with no native dependencies, and warns the user that they may want to install `sharp-cli` for faster image processing.

## Advanced Configuration

This package can be configured using the following environment variables.

### EXPO_IMAGE_UTILS_NO_SHARP

When truthy, this will force global `sharp-cli` resolution methods like `isAvailableAsync()` and `findSharpInstanceAsync()` to fail. Other processes can use this to fallback on Jimp for image modifications. By default this is falsy (undefined).

`findSharpInstanceAsync()` will throw an error if disabled because it shouldn't be invoked if `isAvailableAsync()` returns `false`.
