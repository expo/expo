# Bare Workflow

## Edits

- [iOS] Needed to do this to get Release builds working
  - ~~Disable dead code stripping~~: https://github.com/facebook/react-native/issues/4210#issuecomment-171944483
  - Disable running tests in release mode: https://github.com/facebook/react-native/issues/4210#issuecomment-403179411

## TODO

- [iOS] Detox builds fail but they exit with 0, meaning you can get false positives in CI

## Setup

```sh
# Installs cocoapods
yarn ios:setup

# Compiles react-native-lab/react-native and syncs
yarn android:setup
```

## Detox

To run Detox, ensure you have their custom simulators installed with:

```sh
brew tap wix/brew
brew install wix/brew/applesimutils
```

If `wix/brew` throws git errors, run `brew untap wix/brew` and reinstall.

Start the Metro bundler with `yarn start` then run Detox with `yarn test:e2e:ios`

### Testing locally

- `yarn e2e:ios:setup` Build the detox project (required when native code changes)
- `yarn start-clean` Start Metro without caches
- `yarn e2e:ios` Run the project on the iOS Detox simulator (optionally you can pass the `--watch` flag)

**Testing CI**

- `yarn ci:detox` This should very closely emulate what happens when you run in CI. Use this to ensure native code is linking, pods are installed, and your tests are passing.
