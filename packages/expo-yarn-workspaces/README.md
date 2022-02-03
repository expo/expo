# Expo Yarn Workspaces

This is a package that provides support for Yarn workspaces within monorepos like the Expo repository. It finesses Yarn workspaces, Metro, and the Expo repository to work together.

**Note:** This package runs only on macOS and Linux.

## How apps work with workspaces

Each Expo app in the repository that is intended to work with Yarn workspaces (as opposed to being tested in a non-workspace environment) does the steps described below. All of the steps are important and need to be followed carefully.

### Add `expo-yarn-workspaces` as a devDependency of each app workspace

**Run `yarn add --dev expo-yarn-workspaces` in each app.** This adds scripts provided by `expo-yarn-workspaces` to the project under its `node_modules/.bin` directory and also defines modules the app will use.

### Add a `postinstall` script to each app's package.json

**Add `"postinstall": "expo-yarn-workspaces postinstall"` under the `"scripts"` object in each app's package.json file.** The postinstall script does two things:

1. It creates symlinks for packages that some programs expect to exist under `node_modules`, namely `expo` and `react-native`. These symlinks point to the respective packages installed in the workspace root.

2. It generates an entry module for the app that assumes your app's root component is exported from `App.js` (`App.${platform}.js` also works). This is similar to conventional Expo apps, but we need to generate a different entry module because Metro does not use the logical path to the entry module within the symlinked `expo` package.

### Define the entry module in the `"main"` field of each app's package.json

The postinstall script determines the location of the generated entry module by looking at the `"main"` field in package.json. In a conventional Expo app, the value of the `"main"` field is `node_modules/expo/AppEntry.js`. In a workspace in the Expo repo, **specify `"__generated__/AppEntry.js"` as the value of the `"main"` field in package.json.** If using EAS Build, see the additional instructions below.

You can specify other paths too. The `.expo` directory is convenient since it already contains auto-generated files and is .gitignore'd.

### Create a file named `metro.config.js`

**Create a file named `metro.config.js` in each app's base directory with these contents:**

```js
const { createMetroConfiguration } = require('expo-yarn-workspaces');

module.exports = createMetroConfiguration(__dirname);
```

The `expo-yarn-workspaces` package defines a Metro configuration object that makes Metro work with Yarn workspaces in the Expo repo. It configures Metro to include packages from the workspace root, resolves symlinked packages, excludes modules from Haste's module system, and exclude modules in the native Android and Xcode projects. You can further customize this configuration object before exporting it, if needed.

**Aside:** when starting the project, run `expo start --clear` so Metro uses the latest configuration instead of working with cached values.

### Usage with Expo Web

**Create a file named `webpack.config.js` in the app's base directory with these contents:**

```js
const { createWebpackConfigAsync } = require('expo-yarn-workspaces/webpack');

module.exports = async function(env, argv) {
  const config = await createWebpackConfigAsync(env, argv);
  return config;
};
```

This returns a webpack config object that can be customized further - for all available options see: https://github.com/expo/expo-cli/tree/main/packages/webpack-config

### Configuration

You can configure workspaces using the `expo-yarn-workspaces` field in each workspace package's `package.json` file.

#### `symlinks`

Sometimes an npm package must be located in the project's `node_modules` folder for things to work properly. Using the `expo-yarn-workspaces.symlinks` string array you can define a list of packages to symlink under the project's `node_modules` folder after installing the workspaces' dependencies.

```json
{
  "expo-yarn-workspaces": {
    "symlinks": ["react-native-unimodules"]
  }
}
```

## EAS Build integration

You must configure EAS Build to use the generated entrypoint. Add the `ENTRY_FILE` environment variable to your `eas.json` like the following:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "ENTRY_FILE": "./__generated__/AppEntry.js"
      }
    },
  }
}
```
