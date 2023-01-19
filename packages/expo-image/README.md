# expo-image

A cross-platform, performant image component for React Native and Expo.

**Main features:**

- Designed for speed
- Support for many image formats (including animated ones)
- Disk and memory caching
- Supports [blurhash](https://blurha.sh), a compact representation of a placeholder for an image
- Transitioning between images when the source changes (no more flickering!)
- Implements the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) and [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) properties (see [`contentFit`](#contentfit) and [`contentPosition`](#contentposition) props)
- Uses performant [`SDWebImage`](https://github.com/SDWebImage/SDWebImage) and [`Glide`](https://github.com/bumptech/glide) under the hood

# API documentation

- [Documentation for the latest release](https://docs.expo.dev/versions/unversioned/sdk/image/)

# Installation

> Currently `expo-image` can be used only with Expo SDK47 in [development builds](/development/create-development-builds/) and bare React Native apps with [configured Expo modules](/bare/installing-expo-modules/).
> It is not available in Expo Go and Snack yet.

Add the package to your dependencies with the following commands:

```
npx expo install expo-image
npx pod-install
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
