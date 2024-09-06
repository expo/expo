## E2E test setup

To run the modules-core e2e tests locally, do the following:

- Create a script to set up the environment and remove any previous build, as in the example below.

```bash
# The location of your local copy of this repo
export EXPO_REPO_ROOT=/Users/me/myCode/expo
# The name of a directory that the test project can live under
export WORKING_DIR_ROOT=/Users/me/myCode/e2eworking
# Other environment variables needed for the test setup
export TEST_PROJECT_ROOT=$WORKING_DIR_ROOT/modules-core-e2e

# Remove and recreate the working directory before executing the setup
rm -rf $WORKING_DIR_ROOT
mkdir $WORKING_DIR_ROOT
```

- Run `source <scriptname>` to run it and set up the environment variables

- From the Expo repo root directory, execute one of the `create-*` scripts to set up the test project. For example:

```bash
./packages/expo-modules-core/e2e/setup/create-eas-project-macos.ts
```
