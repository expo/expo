# expo-constants

Provides system information that remains constant throughout the lifetime of your app.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/constants.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/constants/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/constants/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-constants
```

#### Monorepo Support

In a monorepo, the `expo-constants` package might be in a different folder than the native scripts are expecting. You can easily symlink the node module to your app's local `node_modules` folder by doing the following:
 
- Follow the setup instructions for [`expo-yarn-workspaces`](https://github.com/expo/expo/tree/master/packages/expo-yarn-workspaces). 
- Add the following configuration to your app's `package.json`:

```json
{
  "expo-yarn-workspaces": {
    "symlinks": ["expo-constants"]
  }
}
```

- Finally, run `yarn` in the app folder to create symlinks to `expo-constants` in your app's local `node_modules` folder.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
