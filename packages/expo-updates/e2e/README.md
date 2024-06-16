## E2E test setup

To run the updates e2e tests locally, do the following:

- Create a script to set up the environment and remove any previous build, as in the example below.

```bash
# The location of your local copy of this repo
export EXPO_REPO_ROOT=/Users/me/myCode/expo
# The name of a directory that the test project can live under
export WORKING_DIR_ROOT=/Users/me/myCode/e2eworking
# Other environment variables needed for the test setup
export TEST_PROJECT_ROOT=$WORKING_DIR_ROOT/updates-e2e
export UPDATES_HOST=localhost
export UPDATES_PORT=4747
export EX_UPDATES_NATIVE_DEBUG=1

# Remove and recreate the working directory before executing the setup
rm -rf $WORKING_DIR_ROOT
mkdir $WORKING_DIR_ROOT
```

- From the Expo repo root directory, execute

```bash
./packages/expo-updates/e2e/setup/create-eas-project.ts
```

- Change to the `TEST_PROJECT_ROOT` location above.

- Execute

```
yarn generate-test-update-bundles
```

- To run iOS tests:

  - Start an iPhone 14 simulator
  - Execute these commands:

```bash
npx pod install
yarn detox:ios:debug:build
yarn detox:ios:debug:test
```

- To run Android tests:

  - Ensure you have an emulator running named `pixel_4` (or change `.detoxrc.json` to use the name of your own running emulator)
  - Execute `adb reverse tcp:4747 tcp:4747` to ensure that the test server is accessible
  - Then run

```bash
yarn detox:android:debug:build
yarn detox:android:debug:test
```

- Running in your own EAS space:

Edit `app.json` and remove the `extra` section with the EAS project ID, then execute

```bash
eas init
eas build --profile=updates_testing_debug --platform=<android|ios>
```

- Testing the EAS build locally:

  - Ensure you have an emulator running named `pixel_4`
  - Make the change below in `eas.json`:

```diff
--- a/packages/expo-updates/e2e/fixtures/project_files/eas.json
+++ b/packages/expo-updates/e2e/fixtures/project_files/eas.json
@@ -15,7 +15,8 @@
     "updates_testing_debug": {
       "env": {
-        "EX_UPDATES_NATIVE_DEBUG": "1"
+        "EX_UPDATES_NATIVE_DEBUG": "1",
+        "LOCAL_TESTING": "1"
       },
       "android": {
         "gradleCommand": ":app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release",
```

  - Clone the `eas-build` repo, and build it (`yarn`, `yarn build`)
  - Set up the local EAS build environment as in this example:

```
#!/usr/bin/env bash

export EAS_LOCAL_BUILD_HOME=<the eas-build directory that you just cloned above>

export EAS_LOCAL_BUILD_PLUGIN_PATH=$EAS_LOCAL_BUILD_HOME/bin/eas-cli-local-build-plugin
export EAS_LOCAL_BUILD_WORKINGDIR=$TMPDIR/eas-build-workingdir
export EAS_LOCAL_BUILD_SKIP_CLEANUP=1
export EAS_LOCAL_BUILD_ARTIFACTS_DIR=$TMPDIR/eas-build-workingdir/results

rm -rf $EAS_LOCAL_BUILD_WORKINGDIR
```

  - Execute

```bash
eas init
eas build --profile=updates_testing_debug --platform=<android|ios> --local
```

## Updates API test project:

This creates a test project that allows you to exercise the Updates API features manually against EAS. The project is set up to use `expo-channel-name=main` as the EAS update request header.

- Execute this to set up the environment:

```bash
# The location of your local copy of this repo
export EXPO_REPO_ROOT=/Users/me/myCode/expo
# The name of a directory that the test project can live under
export WORKING_DIR_ROOT=/Users/me/myCode/e2eworking
# The user name of the Expo account you are logged into
export EXPO_ACCOUNT_NAME=myexpoaccount
# Other environment variables needed for the test setup
export TEST_PROJECT_ROOT=$WORKING_DIR_ROOT/MyUpdatesApp
export EX_UPDATES_NATIVE_DEBUG=1

# Remove and recreate the working directory before executing the setup
rm -rf $WORKING_DIR_ROOT
mkdir $WORKING_DIR_ROOT
```

- Then execute

```bash
./packages/expo-updates/e2e/setup/create-updates-test.ts
```

- Change to the test project directory

- Execute these commands to set up EAS:

```bash
eas init
eas update:configure
```

- Build and run the project locally

```bash
npx pod-install # if testing iOS
npx expo run:<ios|android>
```

- To create an update, just execute `eas update` and select the default branch (`main`) and default commit message.
- To detect the update on the client, just restart the client, or press the "Check for update manually" button
- If there is an update, the "Download and run update" button will appear, and pressing it will load and launch the update.
