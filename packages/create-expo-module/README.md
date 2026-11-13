# create-expo-module

Initializes a new [Expo module](https://docs.expo.dev/modules/overview/) project with scaffolding for iOS, Android, and TypeScript, along with an example project to interact with the module from within an app.

### Usage

```
yarn create expo-module
```

To test beta releases, run `EXPO_BETA=1 yarn create expo-module`.

### Local modules

Run the command from your Expo app's directory:

```sh
npx create-expo-module@latest my-module --local
```

This version supports local modules in SDK 56 and later. For SDK 55 and earlier, use the SDK 55
CLI release:

```sh
npx create-expo-module@sdk-55 --local
```

To use this version's template in an older SDK anyway, pass `--ignore-compatibility-check`. The
generated native code may not build in that SDK.
