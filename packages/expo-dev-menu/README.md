# 📦 expo-dev-menu

Expo/React Native module to add developer menu to Debug builds of your application. This package is intended to be included in your project through [`expo-dev-client`](https://docs.expo.dev/develop/development-builds/introduction/#what-is-an-expo-dev-client).

## Documentation

You can find more information in the [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction).

## Contributing

The `expo-dev-menu` repository consists of two different parts, the exported package, which includes the native functions, located in the `android`, `ios` and `src` folders and the Dev Menu interface, located under the `app` folder.

Local development is usually done through [`bare-expo`](/apps/bare-expo).

First, make sure to `yarn` and `yarn start` in `expo-dev-menu` which will add the port for the dev menu packager to [`dev-menu-packager-host`](./assets/dev-menu-packager-host`). This is bundled into the native code in `bare-expo` so need to be done first.

To use `dev-client` when running `bare-expo` on Android, open [MainApplication.java](/apps/bare-expo/android/app/src/main/java/dev/expo/payments/MainApplication.java) and set the `USE_DEV_CLIENT` value to `true`.

```diff
- static final boolean USE_DEV_CLIENT = false;
+ static final boolean USE_DEV_CLIENT = true;
```

To use `dev-client` when running `bare-expo` on iOS, open [AppDelegate.mm](/apps/bare-expo/ios/BareExpo/AppDelegate.mm) and set the `USE_DEV_CLIENT` value to `YES`.

```diff
- BOOL useDevClient = NO;
+ BOOL useDevClient = YES;
```

Then build the native apps with `npx pod-install && yarn ios` or `yarn android`.

### Making JavaScript changes inside the `app` folder

To update the JavaScript code inside the `app` folder, you need to run the `dev-menu` bundler locally.

1. Navigate to the `dev-menu` package: `cd packages/expo-dev-menu`
2. Start the Metro bundler: `yarn start`
3. To use your local bundler on Android, open [DevMenuManager.kt](/packages/expo-dev-menu/android/src/debug/java/expo/modules/devmenu/DevMenuManager.kt) and set `useDeveloperSupport` to `true`.

```diff
- val useDeveloperSupport = false
+ val useDeveloperSupport = true
```

4. Play with your changes on a simulator or device through `bare-expo`
5. Once you've made all the necessary changes run `yarn bundle:prod:ios && yarn bundle:prod:android` to update the embedded bundle
