# expo-dev-launcher

`expo-dev-launcher` is an npm package installable in any Expo or React Native project. Once installed, any Debug builds of your application will gain the ability to load projects from Expo CLI. Release builds of your application will not change other than the addition of a few header files. This package is intended to be included in your project through [`expo-dev-client`](https://docs.expo.dev/versions/latest/sdk/dev-client/).

## Documentation

You can find more information in the [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction).

## Discover servers from related app variants

To keep identifier matching enabled when app variants share a Metro server, set `EXDevLauncherDevServerApplicationIds` in each native build. On iOS, use an array of bundle identifiers in `Info.plist`. On Android, use a JSON array of package names in an application `<meta-data>` entry:

```xml
<meta-data
  android:name="EXDevLauncherDevServerApplicationIds"
  android:value='["com.example.app", "com.example.app.dev"]' />
```

The filter accepts the installed app's identifier and any listed identifiers. Omit the setting to keep exact matching. This setting only changes server discovery. It does not select variant-specific manifest values or check native-code compatibility.

## Contributing

The Dev Launcher UI is built with native platform UI toolkits:

- **iOS**: SwiftUI (see `ios/SwiftUI/`)
- **Android**: Jetpack Compose (see `android/src/debug/java/expo/modules/devlauncher/compose/`)

Local development is usually done through [`bare-expo`](/apps/bare-expo). Recompile `bare-expo` after making changes to the native code.
