# Quality Assurance

## 1. Checking packages

- Run `et check-packages` to make sure every package build successfully, `build` folder is up to date and all unit tests pass. 

## 2. RN dev tools

- Open an empty project in development for the new SDK version
- Fast Refresh:
  - Make sure Fast Refresh is enabled
  - Make and save a change, ensure it shows up
  - Write a syntax error, ensure the error screen pops up
  - Fix the syntax error, error screen should go away without having to press anything
  - Disable Fast Refresh, make and save a change, it shouldn't show up
  - Reload manually, your change should appear
  - Make and save another change, reenable Fast Refresh, your change should show up automatically
- Debug Remote JS:
  - Start Remote JS debugging
  - Add a breakpoint (maybe add a button to your app), ensure the breakpoint works
  - Click Reload on the webpage, make sure it reloads the app
  - Turn off Remote JS debugging, make sure the breakpoint isn't hit
- Other dev tools:
  - Turn on the Performance Monitor, tap a few things, make sure it seems responsive and doesn't crash
  - Same with the Element Inspector
- Reloading:
  - (Config reloading) Change the splash screen color in the app config file; reload manually and you should immediately see the new color
  - (Production mode) Toggle production mode in expo-cli (press `p`); reload manually. Open the dev menu to ensure that the production mode bundle has been loaded (various options will be greyed out)
  - Make and save a change; reload manually and ensure it shows up
  - Make and save a change to the splash screen color in the app config; reload manually and ensure it shows up right away
  - Toggle back to development mode in expo-cli (press `p` again); reload manually and ensure you're back in development mode

## 3. Running test-suite tests

- Go to `apps/test-suite`.
- Update its `sdkVersion` in `app.json`.
- Run `expo start` and test each module.

## 4. Inspecting native-component-list examples

- Go to `apps/native-component-list`.
- Update its `sdkVersion` in `app.json`.
- Update versions of the dependencies in `package.json`.
- Run `expo start` and check every example, including React Native components.

## 5. Smoke test Expo Go against all supported SDK versions

- Run `expo init -t blank@sdk-x` for each supported SDK version and ensure the project loads without crashing.