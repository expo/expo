# expo-dev-launcher

`expo-dev-launcher` is an npm package installable in any Expo or React Native project. Once installed, any Debug builds of your application will gain the ability to load projects from Expo CLI. Release builds of your application will not change other than the addition of a few header files. This package is intended to be included in your project through [`expo-dev-client`](https://docs.expo.dev/clients/introduction/).

## Documentation

You can find more information in the [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction).

## Contributing

The `expo-dev-launcher` repository consists of two different parts, the exported package, which includes the native functions, located in the `android`, `ios` and `src` folders and the Dev Launcher interface, located under the `bundle` folder.

Local development is usually done through `bare-expo`.

To use `dev-client` when running `bare-expo` on Android, open [MainApplication.kt](/apps/bare-expo/android/app/src/main/java/dev/expo/payments/MainApplication.kt) and set the `USE_DEV_CLIENT` value to `true`.

```diff
- private const val USE_DEV_CLIENT = false;
+ private const val USE_DEV_CLIENT = true;
```

To use `dev-client` when running `bare-expo` on iOS, open [AppDelegate.mm](/apps/bare-expo/ios/BareExpo/AppDelegate.mm) and set the `USE_DEV_CLIENT` value to `YES`.

```diff
- BOOL useDevClient = NO;
+ BOOL useDevClient = YES;
```

### Making JavaScript changes inside the `bundle` folder

To update the JavaScript code inside the `bundle` folder, you need to run the `dev-launcher` bundler locally.

1. Navigate to the `dev-launcher` package: `cd packages/expo-dev-launcher`
2. Start the Metro bundler: `yarn start`
3. Adjust the dev-launcher URL to point to your local bundler

<details>

#### On Android

Open [DevLauncherController.kt](/packages/expo-dev-launcher/android/src/debug/java/expo/modules/devlauncher/DevLauncherController.kt) and update the `DEV_LAUNCHER_HOST` value to your bundler URL.

E.g.

```diff
- private val DEV_LAUNCHER_HOST: String? = null
+ private val DEV_LAUNCHER_HOST: String? = "10.0.2.2:8090";
```

#### On iOS

3.1. Open another terminal window and navigate to the `ios` folder inside `bare-expo`

3.2. Export the `EX_DEV_LAUNCHER_URL` variable in your shell before running `pod install`.

E.g.

```
export EX_DEV_LAUNCHER_URL=http://localhost:8090
```

This will cause the controller to see if the `expo-launcher` packager is running, and if so, use that instead of the prebuilt bundle.

3.3. Run `pod install`

</details>

4. Recompile `bare-expo`
5. Play with your changes on a simulator or device
6. Once you've made all the necessary changes run `yarn bundle` to update the embedded bundle
