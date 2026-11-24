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
pnpm generate-test-update-bundles
```

- Build the app, for iOS or Android, in Debug or Release:

```bash
npx pod-install # iOS only
pnpm maestro:ios:debug:build # or maestro:ios:release:build, maestro:android:debug:build, maestro:android:release:build
```

- Run the suite on a device in Expo Simulators:

```bash
./simulator/simulator-test-executor.sh ./simulator/tests/updates-e2e-enabled.txt ios debug
# Or use android instead of ios, and release instead of debug.
```

### Tests in Expo Simulators

The enabled and bricking measures disabled tests run on a device in Expo Simulators, not in a local simulator or emulator. You must be logged in to an Expo account with Expo Simulators access, and the account must have access to the `updates-e2e` EAS project.

The executor starts the updates server, starts a session, and stops both when the suite ends. The device reaches the updates server on this machine through the local egress tunnel of the session. Logs, and a screenshot on failure, are in `simulator/output`.

To run one flow, make a suite file that lists only that flow, for example `basic_updateRetention.sh`, and pass it to the executor.

For the bricking measures disabled tests, create the project with `./packages/expo-updates/e2e/setup/create-bricking-measures-disabled-eas-project.ts`, generate the bundles as above, build the release app, and run `./simulator/tests/updates-e2e-bricking-measures-disabled.txt`.

### Update retention

The enabled test app sets `updates.maxUpdatesToKeep` to `3`. The `basic_updateRetention.sh` flow launches four successive updates and checks the cached update IDs after each launch. It verifies that the three newest downloaded updates survive and the oldest downloaded update is removed. The current embedded ID is excluded from the comparison so only downloaded updates count toward the expected retained IDs. Database reads are exposed only by the E2E fixture modules. The reader waits up to one second for SQLite locks on iOS. Failed reads are displayed in the result row, and the flow retries failed or missing results.

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
