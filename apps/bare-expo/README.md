# Bare Workflow

Learn more about this project in [CONTRIBUTING.md](https://github.com/expo/expo/blob/main/CONTRIBUTING.md).

## Usage

- Run on Android Emulator: `yarn android` (runs npm install if needed, builds the React Android binaries, generate an emulator, start Metro, and open the app in the emulator)
- Run on iOS Simulator: `yarn ios` (this will automatically pod install, npm install, open a simulator, clear and start Metro, then open the app in the simulator)
- E2E test on iOS Simulator: `yarn test:ios` (same as `yarn ios` but it installs Detox simulators, builds a Detox binary, and starts the jest Detox runner)
- Open a test `yarn open <ios | android> <...Modules>` this requires the platform to be running already (deep links you into the test-suite app and runs the provided tests)
  - ex: `yarn open ios Constants Crypto`
  - ex: `yarn open android Random`
- Nuke `yarn nuke` (deletes all generated files for testing the setup scripts)
- `yarn ci:detox` This should very closely emulate what happens when you run in CI. Use this to ensure native code is linking, pods are installed, and your tests are passing.

## Edits

- [iOS] Needed to do this to get Release builds working
  - ~~Disable dead code stripping~~: https://github.com/facebook/react-native/issues/4210#issuecomment-171944483
  - Disable running tests in release mode: https://github.com/facebook/react-native/issues/4210#issuecomment-403179411

## TODO

- [iOS] Detox builds fail but they exit with 0, meaning you can get false positives in CI
