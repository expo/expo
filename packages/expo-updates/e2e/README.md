To run the updates e2e tests locally, do the following:

- Create a script to set up the environment and remove any previous build, as in the example below.

```bash
export EXPO_REPO_ROOT=/Users/me/myCode/expo
export WORKING_DIR_ROOT=/Users/me/myCode/e2eworking
export TEST_PROJECT_ROOT=$WORKING_DIR_ROOT/updates-e2e
export UPDATES_HOST=localhost
export UPDATES_PORT=4747

rm -rf $WORKING_DIR_ROOT
mkdir $WORKING_DIR_ROOT
```

- From the Expo repo root directory, execute

```bash
node packages/expo-updates/e2e/__tests__/setup/create-eas-project-basic
```

or

```bash
node packages/expo-updates/e2e/__tests__/setup/create-eas-project-assets
```

- Change to the `TEST_PROJECT_ROOT` location above.

- To run iOS tests:

```bash
npx pod install
yarn detox:ios:release:build
yarn detox:ios:release:test

- To run Android tests:

  - Ensure you have an emulator running named `pixel_4` (or change `.detoxrc.json` to use the name of your own running emulator)
  - Execute `adb reverse tcp:4747 tcp:4747` to ensure that the test server is accessible
  - Then run

```bash
yarn detox:android:release:build
yarn detox:android:release:test
```

- Running in your own EAS space:

Edit `app.json` and remove the `extra` section with the EAS project ID, then execute

```bash
eas init
eas build --profile=updates_testing --platform=<android|ios>
```
