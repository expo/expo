# React Native Async Storage

An asynchronous, unencrypted, persistent, key-value storage system for React
Native.

## Supported platforms

- Android
- iOS
- [macOS](https://github.com/react-native-async-storage/async-storage/releases/tag/v1.8.1)
- [Web](https://github.com/react-native-async-storage/async-storage/releases/tag/v1.9.0)
- [Windows](https://github.com/react-native-async-storage/async-storage/releases/tag/v1.10.0)

## Getting Started

Head over to the
[documentation](https://react-native-async-storage.github.io/async-storage/docs/install)
to learn more.

## Running E2E locally

### Android

1. Create and start Android Emulator with Play services, API level 29
2. Build app and run tests
   ```shell
   yarn bundle:android
   yarn build:e2e:android
   yarn test:e2e:android
   ```

### iOS

1. Create and start iPhone 14 simulator with iOS version 16.4
2. Build app and run tests
   ```shell
   yarn bundle:ios
   pod install --project-directory=example/ios
   yarn build:e2e:ios
   yarn test:e2e:ios
   ```

## Contribution

Pull requests are welcome. Please open an issue first to discuss what you would
like to change.

See the [CONTRIBUTING](.github/CONTRIBUTING.md) file for more information.

## License

MIT
