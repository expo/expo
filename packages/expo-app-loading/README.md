# expo-app-loading

`expo-app-loading` allows you to interact with your app's splash screen using a React component, and load optional resources.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/app-loading.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/app-loading)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/app-loading).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo-splash-screen` package](https://github.com/expo/expo/tree/master/packages/expo-splash-screen) before continuing.

### Add the package to your npm dependencies

```
expo install expo-app-loading
```

### Usage

After installing both the splash screen and the app loading module, you can use app loading.

```js
import AppLoading from 'expo-app-loading';

function App() {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return <AppLoading />;
  }

  return (
    <View>
      <Text>App is loaded!</Text>
    </View>
  );
}
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
