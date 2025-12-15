## E2E test setup

These instructions are for the E2E (enabled) tests.

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
export EXPO_PUBLIC_UPDATES_SERVER_PORT=4747

# Remove and recreate the working directory before executing the setup
rm -rf $WORKING_DIR_ROOT
mkdir $WORKING_DIR_ROOT
```

- Run `source <scriptname>` to run it and set up the environment variables

- From the Expo repo root directory, execute:

```bash
./packages/expo-updates/e2e/setup/create-eas-project.ts
```

- Change directory to the `TEST_PROJECT_ROOT` location with `cd $TEST_PROJECT_ROOT`.

- Execute this command to generate the bundles used by the test server:

```bash
# it will generate android and iOS bundles.
yarn generate-test-update-bundles
```

- To run iOS tests:

  - Have an iOS simulator already running, and ensure no Android emulators are running
  - Execute these commands:

```bash
npx pod-install
yarn maestro:ios:debug:build
./maestro/maestro-test-executor.sh ./maestro/tests/updates-e2e-enabled.yml ios debug
```

- To run Android tests:

  - Have an Android emulator already running, and ensure no iOS simulators are running
  - Execute these commands:

```bash
yarn maestro:android:debug:build
./maestro/maestro-test-executor.sh ./maestro/tests/updates-e2e-enabled.yml android debug
```

- For either the iOS or Android tests, you can optionally run the test updates server separately for debugging purposes.

  - Before running the Maestro tests above, run this command in a separate terminal window:

```bash
./maestro/updates-server/start.ts
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
