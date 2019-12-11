---
title: Running in the Browser
---

> Expo for web is in **beta** and subject to breaking changes. Do not use this in production yet.

As of SDK 33 you can use Expo to create web apps that run in the browser using the same code-base as your existing native app.

## Adding web support to Expo projects

Starting in _SDK 33_ projects bootstrapped with the Expo CLI will have web support from the start. To add web support to an existing Expo app you can do the following:

- Install the latest version of the Expo CLI: `npm i -g expo-cli`
- Add web dependencies: `yarn add react-native-web react-dom`
  - Ensure your project has at least `expo@^33.0.0` installed.
- Start your project with `expo start` then press `w` to start Webpack and open the project in the browser.

**Tips**

- You can also run `expo start --web` which will start Webpack immediately.
- If your `app.json` only contains the `"web"` platform then Webpack will startup instead of Metro, this is the same as running `expo start --web-only`
- Toggle the production environment variable with **`--no-dev`**. This will persist commands so remember to turn it off with **`--dev`**.

## Create React App & React Native CLI

Expo Unimodules aren't bound to the Expo SDK, you can use them in _any_ react.js project. Here is how to use the web portion of the modules in a project bootstrapped with either the React Native CLI (`react-native init`) or Create React App ([`create-react-app`](https://github.com/facebook/create-react-app)).

- Install the latest version of the Expo CLI: `npm i -g expo-cli`
- Add web dependencies: `yarn add react-native-web react-dom expo`
  - On web all of the unused Expo, and React Native modules will be tree-shaken during the production build.
- Modify (or create) your project's [`app.json`](https://docs.expo.io/versions/latest/workflow/configuration/):

  ```diff
  {
      "name": "YourApp",
      "displayName": "React Native Project",
  +    "expo": {
  +        "platforms": ["web"]
  +    }
  }
  ```

- **React Native-Only**: Update your root `index.js`:

  ```diff
    import {
        AppRegistry,
  +      Platform
    } from 'react-native';
    import App from './App';
    import {name as appName} from './app.json';

    AppRegistry.registerComponent(appName, () => App);

  +  if (Platform.OS === 'web') {
  +      AppRegistry.runApplication(appName, {
  +          rootTag: document.getElementById('root'),
  +      });
  +  }
  ```

- Start your project with `expo start` then press `w` to start Webpack and open the project in the browser.
  - You can also run `expo start --web` which will start Webpack immediately.
  - If your `app.json` only contains the `"web"` platform then Webpack will startup instead of Metro, this is the same as running `expo start --web-only`
  - You may want to add `/.expo`, and `/web-build` to your `.gitignore`.

## Tree-Shaking

The package `babel-preset-expo` extends `@babel/preset-env` on web and is used to configure your project for Unimodules. The core feature is that it won't compile your modules to **`core.js`** when targeting web, this means that you get optimal tree-shaking and dead-code-elimination.
This step is optional with the React Native CLI but you'll get a much smaller bundle size and faster website if you do choose to use it. This is because `module:metro-react-native-babel-preset` is made for usage with the Metro bundler and not Webpack.

> `babel-preset-expo` is required for usage with Create React App, optional but recommended for all React Native projects using Unimodules.

- Install: `yarn add -D babel-preset-expo`
- Change the babel preset in `babel.config.js`. If your project has a `.babelrc` then you should upgrade to **Babel 7+** first.
  ```diff
  module.exports = {
  -   presets: ['module:metro-react-native-babel-preset']
  +   presets: ['babel-preset-expo']
  };
  ```

## App Entry

Expo `AppEntry` has built in support for error boundaries in development mode. In the future Notifications and Splash Screen features may be added as well. When used with `babel-preset-expo` you can eliminate all of the unused modules from the `expo` package, this means if you only import `AppEntry` then things like `Constants`, and `Camera` would be completely removed during the production build (`expo build:web`).

### Web-only method

If you don't want to change how your native app works do the following:

- Install Expo: `yarn add expo`
- Create a `index.web.js` and add the line `import 'expo/AppEntry'`

### Universal method

To use Expo for both web and native:

- Install Expo: `yarn add expo`
- Change the `main` field in `package.json`
  ```diff
  {
  -   "main": "index",
  +   "main": "node_modules/expo/AppEntry.js",
  }
  ```
- Delete the `index.js` because `AppEntry` uses the `App.js` file in your root directory as the main component.
  - You don't need to invoke `ReactDOM.render` or `AppRegistry.registerComponent` because `AppEntry` will do this for you for each platform.

Are we missing something here? Let us know on our [forums][forums] or on our [feature requests board][canny].

[rnw]: https://github.com/necolas/react-native-web/
[forums]: http://forums.expo.io/
[canny]: https://expo.canny.io/feature-requests
