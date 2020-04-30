# expo-splash-screen-command

This package provides CLI command that helps you configure [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) module.
You can use it to configure your native iOS and Android project according to your needs without opening Xcode or Android Studio.

## Content

- [📜	CHANGELOG](./CHANGELOG.md)
- [🚀 Features](#-features)
- [🗒 Usage](#-usage)
- [🖥 Installation](#-installation)
- [👏 Contributing](#-contributing)

## 🚀 Features

### 📱 iOS

- Configures background color for native splash screen.
- Configures [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) to show given `.png` image.
- supports [`CONTAIN`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen#contain-resize-mode) and [`COVER`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen#cover-resize-mode) modes from [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen)

### 🤖 Android

- Configures background color for native splash screen.
- Configures `expo-splash-screen` to show given `.png` image.
- supports [`CONTAIN`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen#contain-resize-mode), [`COVER`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen#cover-resize-mode) and [`NATIVE`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen#native-resize-mode) modes from [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen)

## 🗒 Usage

Command syntax:
```
yarn run expo-splash-screen --mode <mode> --platform "all" <backgroundColor> [imagePath]
```
- `mode` - see [resize modes](https://github.com/expo/expo/tree/master/packages/expo-splash-screen#built-in-splash-screen-image-resize-modes). Available values: `contain` (default), `cover`, `native` (only on Android)
- `platform` - select which platform to configure. Available values: `all` (default), `ios`, `android`
- `backgroundColor` (required) - Color that will be used a background in splash screen view. Accepts formats from [`color-string` library](https://github.com/Qix-/color-string) (`rgb`, `rgba`, `hex`, `css named colors`, `hsl`, `hsla`).
- `imagePath` (optional) - Path to `.png` image that will be used in splash screen view. Not providing an image will make splash screen view display only a background color.

To see all the available options:
```
yarn run expo-splash-screen --help
```

## 🖥 Installation

This package is installed as a dependency of the [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) package. Follow the installation instructions provided by [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) package.

## 👏 Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
