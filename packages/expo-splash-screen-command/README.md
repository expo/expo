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
yarn run expo-splash-screen --mode "contain" (default) | "cover" | "native" (only on Android) --platform "all" (default) | "ios" | "android" <backgroundColor> (required) [imagePath] (optional)
```

To see all the available options:
```
yarn run expo-splash-screen --help
```
### Alternatives to `yarn`

Instead of 
```
yarn run expo-splash-screen
```
you can go with:
```
npm run expo-splash-screen
```
or
```
npx expo-splash-screen
```

## 🖥 Installation

This package is installed as a dependency of the [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) package. Follow the installation instructions provided by [`expo-splash-screen`](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) package.

## 👏 Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
