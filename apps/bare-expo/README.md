# Bare-Expo

Learn more about this project in [CONTRIBUTING.md](https://github.com/expo/expo/blob/main/CONTRIBUTING.md).

## Usage

- Run on Android Emulator: `yarn android` (runs npm install if needed, builds the React Android binaries, generate an emulator, start Metro, and open the app in the emulator)
- Run on iOS Simulator: `yarn ios` (this will automatically pod install, npm install, open a simulator, clear and start Metro, then open the app in the simulator)
- E2E test on iOS Simulator: `yarn test:ios` (same as `yarn ios` but it prepares for E2E testings.)
- Open a test `yarn open <ios | android> <...Modules>` this requires the platform to be running already (deep links you into the test-suite app and runs the provided tests)
  - ex: `yarn open ios Constants Crypto`
  - ex: `yarn open android Random`
- Nuke `yarn nuke` (deletes all generated files for testing the setup scripts)
