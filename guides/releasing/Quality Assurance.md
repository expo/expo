# Quality Assurance

## 1. Checking packages

- Run `et check-packages` to make sure every package build successfully, `build` folder is up to date and all unit tests pass.

## 2. React Native dev tools

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
- Debug JS in-place (Hermes)
  - Add `jsEngine` as `hermes` in _apps/native-component-list/app.json_
  - Open JS debugger either pressing `j` by `expo-cli` terminal UI hotkey or from the dev-menu in Expo Go
  - Add a breakpoint (maybe add a button to your app), ensure the breakpoint works
  - Click Reload on the webpage, make sure it reloads the app
- Debug Remote JS (JSC)
  - Add `jsEngine` as `jsc` in _apps/native-component-list/app.json_
  - Start Remote JS debugging
  - Add a breakpoint (maybe add a button to your app), ensure the breakpoint works
  - Click Reload on the webpage, make sure it reloads the app
  - Turn off Remote JS debugging, app should load as expected
- Other dev tools
  - Turn on the Performance Monitor, tap a few things
  - Same with the Element Inspector
- Reloading
  - Make and save a change; reload manually and ensure it shows up
  - Make and save a change to the splash screen color in the app config; reload manually and ensure it shows up right away
  - Enable production mode, reload the app. Disable production mode, reload the app again.
- Use the `expo-cli` terminal UI hotkeys to reload, open inspector, etc.

## 3. Running test-suite tests

- Go to `apps/test-suite`.
- Update its `sdkVersion` in `app.json`. Use `UNVERSIONED` for unversioned QA and the new SDK version for versioned QA.
- Run `expo start` and test each module.
- Run `expo start --force-manifest-type=expo-updates` and sanity check one or two modules (mainly just checking that project opens).

## 4. Inspecting native-component-list examples

- Go to `apps/native-component-list`.
- Update its `sdkVersion` in `app.json`. Use `UNVERSIONED` for unversioned QA and the new SDK version for versioned QA.
- Run `expo start` and check every example, including React Native components.
- Run `expo start --force-manifest-type=expo-updates` and sanity check one or two examples (mainly just checking that project opens).

### 5. Smoke test Expo Home

- Run against the local version of home.
- Tap everything in Home in both logged in and logged out states.
- Try switching between a few apps, both local ones and published ones.
- Open random links and do weird stuff and make sure the error messages make sense. Be creative.
- Check the logged in "settings" screen.

## 6. Smoke test Expo Go against all supported SDK versions

> Make sure to use the "Expo Go (versioned)" target on iOS.

- Run `expo init -t blank@sdk-x` for each supported SDK version.
- Run `expo start` and ensure the project loads without crashing.
- Run `expo start --force-manifest-type=expo-updates` and ensure the project loads without crashing.
