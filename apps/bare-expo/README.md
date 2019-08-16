# Bare Workflow

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
