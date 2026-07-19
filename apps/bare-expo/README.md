# Bare-Expo

Learn more about this project in [CONTRIBUTING.md](https://github.com/expo/expo/blob/main/CONTRIBUTING.md).

## Usage

- Run on Android Emulator: `pnpm android` (runs npm install if needed, builds the React Android binaries, generate an emulator, start Metro, and open the app in the emulator)
- Run on iOS Simulator: `pnpm ios` (this will automatically pod install, npm install, open a simulator, clear and start Metro, then open the app in the simulator)
- E2E test on iOS Simulator: `pnpm test:ios` (same as `pnpm ios` but it prepares for E2E testings.)
- Open a test `pnpm open <ios | android> <...Modules>` this requires the platform to be running already (deep links you into the test-suite app and runs the provided tests)
  - ex: `pnpm open ios Constants Crypto`
  - ex: `pnpm open android Random`
- Nuke `pnpm nuke` (deletes all generated files for testing the setup scripts)
