<p>
  <a href="https://docs.expo.dev/versions/unversioned/sdk/image/">
    <img
      src="../../.github/resources/expo-image.svg"
      alt="expo-image"
      height="64" />
  </a>
</p>

A cross-platform, performant image component for React Native and Expo.

## Main features

- Designed for speed
- Support for many image formats (including animated ones)
- Disk and memory caching
- Supports [BlurHash](https://blurha.sh) and [ThumbHash](https://evanw.github.io/thumbhash/) - compact representations of a placeholder for an image
- Transitioning between images when the source changes (no more flickering!)
- Implements the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) and [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) properties (see [`contentFit`](#contentfit) and [`contentPosition`](#contentposition) props)
- Uses performant [`SDWebImage`](https://github.com/SDWebImage/SDWebImage) and [`Glide`](https://github.com/bumptech/glide) under the hood

## Supported image formats

|   Format   | Android | iOS |                      Web                       |
| :--------: | :-----: | :-: | :--------------------------------------------: |
|    WebP    |   ✅    | ✅  |                       ✅                       |
| PNG / APNG |   ✅    | ✅  |                       ✅                       |
|    AVIF    |   ✅    | ✅  |                       ✅                       |
|    HEIC    |   ✅    | ✅  | ❌ [not adopted yet](https://caniuse.com/heif) |
|    JPEG    |   ✅    | ✅  |                       ✅                       |
|    GIF     |   ✅    | ✅  |                       ✅                       |
|    SVG     |   ✅    | ✅  |                       ✅                       |
|    ICO     |   ✅    | ✅  |                       ✅                       |
|    ICNS    |   ❌    | ✅  |                       ❌                       |

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/image/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/image/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-image
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional setup necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
