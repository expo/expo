# Quality Assurance

## Expo Go

### 1. Checking packages

- Run `et check-packages` to make sure every package build successfully, `build` folder is up to date and all unit tests pass.

### 2. React Native dev tools

Versioned QA: Open an empty project in development for the new SDK version
Unversioned QA: Test in native-component-list.

- Fast Refresh
  - Make sure Fast Refresh is enabled
  - Make and save a change, ensure it shows up
  - Write a syntax error, ensure the error screen pops up
  - Fix the syntax error, error screen should go away without having to press anything
  - Disable Fast Refresh, make and save a change, it shouldn't show up
  - Reload manually, your change should appear
  - Make and save another change, reenable Fast Refresh, your change should show up automatically
- Debug JS in-place
  - Open JS debugger either pressing `j` or from the dev menu in Expo Go
  - Add a breakpoint (maybe add a button to your app), ensure the breakpoint works
  - Click Reload on the webpage, make sure it reloads the app
- Other dev tools
  - Turn on the Performance Monitor, tap a few things
  - Same with the Element Inspector
- Reloading
  - Make and save a change; reload manually and ensure it shows up
  - Make and save a change to the splash screen color in the app config; reload manually and ensure it shows up right away
  - Enable production mode, reload the app. Disable production mode, reload the app again.
- Use the Expo CLI terminal UI hotkeys to reload, open inspector, etc.

### 3. Running test-suite tests

- Go to `apps/test-suite`.
- Update its `sdkVersion` in `app.json`. Use `UNVERSIONED` for unversioned QA and the new SDK version for versioned QA.
- Run `npx expo start` and test each module.

### 4. Inspecting native-component-list examples

- Go to `apps/native-component-list`.
- Update its `sdkVersion` in `app.json`. Use `UNVERSIONED` for unversioned QA and the new SDK version for versioned QA.
- Run `npx expo start` and check every example, including React Native components.

### 5. Smoke test Expo Home

- Run against the local version of home.
- Tap everything in Home in both logged in and logged out states.
- Try switching between a few apps, both local ones and published ones.
- Open random links and do weird stuff and make sure the error messages make sense. Be creative.
- Check the logged in "settings" screen.

### 6. Test in a standalone release build

- Compile native-component-list in release mode, visit each screen to do a smoke test.

## Development builds

You should set up two applications described in the [Test applications](#test-applications) section and go through all test scenarios. It's better to use a physical device than a simulator/emulator.

If testing for a new SDK release, ensure to test against the latest version of the template (`npx create-expo-app` will not give you the exact desired app to test against).

### Test applications

1. A test app without **expo-updates** (checks the core functionality).
   1. Run `yarn expo-test-runner create-project -a dev-client-e2e --path <path where the project will be created>` to create a test app. Next, you can go to the project directory and run `npx uri-scheme add dev-client-release`.
   2. You can run `npx expo start` in the main directory of the test project to run bundler.
2. Prebuild
   1. Run `npx create-expo-app` to create a fresh project with the latest SDK.
   2. Link `expo-dev-client` dependencies manually - open `package.json` and in dependencies section provide local paths to all packages used by the development client and `expo-updates` if the latest version is different than that included in `expo-dev-client` `package.json`.
      1. `expo-dev-client`
      2. `expo-dev-launcher`
      3. `expo-dev-menu`
      4. `expo-dev-menu-interface`
      5. `expo-updates` - only if needed
      6. `expo-updates-interface` - only if needed
      7. `expo-structured-headers` - only if needed
      8. `expo-manifest` - only if needed
   3. Run `npx expo prebuild` - after that, you may face a problem with duplicated sources on iOS. To solve this issue, you need to manually link packages in the Podfile too.

### Test scenarios

1. App with dev-client compiles
   1. via Xcode
   2. via Android Studio
   3. `npx expo run:ios` - you should be launched into the app after build
   4. `npx expo run:android` - you should be launched into the app after build
2. UI works
   1. You should see a `dev-menu` welcome screen at the first start of your application.
   2. You should see a local bundler detected by the `dev-launcher` if not logged in.
   3. You should be able to sign in.
   4. You should see bundlers detected by the `development session` if logged in (remember to sign in via terminal too).
   5. You should be able to bring up the development menu.
      1. via shake gesture.
      2. via three-finger long-press (can't be tested using the simulator).
   6. (Android only) Scan a QR code should open the camera screen in `expo go`.
   7. You should be able to bring up the original react-native menu from ours.
   8. You should be able to change the dev menu's options.
      1. shake gesture
      2. three-finger long-press
      3. show menu at launch (need to load some application to test it)
3. You can load apps
   1. load app started using `npx expo start`
   2. load app started using `npx react-native start`
   3. load published app - run `eas update` and copy manifest URL into dev-launcher UI
4. The recently loaded project should be visible on the launcher screen.
5. Dev menu functionality should work when the app is loaded.
   1. reload
   2. performance monitor
   3. element inspector
   4. fast refresh
   5. back to launcher
   6. remote debugging
6. WebSocket controls should work when the app is loaded (only if using `npx expo start`)
   1. reload
   2. open dev menu
   3. performance monitor
   4. element inspector
7. The last deep link received while the dev-launcher main screen is visible should be stored and passed to the next open application.
   1. the UI indicator should also be visible
8. When trying to load an app with a syntax error, you should see an error screen.
   1. you should be able to back to launcher
   2. you should be able to reload the app
