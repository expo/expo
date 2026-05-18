# 📦 expo-dev-menu

Expo/React Native module to add developer menu to Debug builds of your application. This package is intended to be included in your project through [`expo-dev-client`](https://docs.expo.dev/develop/development-builds/introduction/#what-is-an-expo-dev-client).

## Documentation

You can find more information in the [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction).

## Contributing

The Dev Menu UI is built with native platform UI toolkits:

- **iOS**: SwiftUI (see `ios/SwiftUI/`)
- **Android**: Jetpack Compose (see `android/src/debug/java/expo/modules/devmenu/compose/`)

Local development is usually done through [`bare-expo`](/apps/bare-expo). Recompile `bare-expo` after making changes to the native code.
