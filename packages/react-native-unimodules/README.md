# react-native-unimodules

Learn more about this library and learn how to install it on the [Installing react-native-unimodules documentation page](https://docs.expo.io/bare/installing-unimodules/).

## Config with package.json

You can configure the iOS and Android linking using the `unimodules` object in the `package.json`:

```json
{
  "unimodules": {
    "android": {
      "exclude": [
        // Prevent a module from being included on Android
        "expo-camera"
      ]
    },
    "ios": {
      // ...
    }
  }
}
```
