# Using Expo for web in a `react-native init` project

> This is a **preview** and subject to breaking changes. Do not use this in production yet.

Here is how to use [_Unimodules_][uni] in a project bootstrapped with [`react-native-cli`][rncli]

- Install [React Native for Web][rnw] and React DOM: `yarn add react-native-web react-dom`
- Create [**`index.web.js`**](./index.web.js)

  ```ts
  import { AppRegistry } from 'react-native';
  import App from './App';
  import { name as appName } from './app.json';

  AppRegistry.registerComponent(appName, () => App);
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root'),
  });
  ```

- Add the following to your [`app.json`](./app.json):
  ```diff
  {
      "name": "reactnativeinitdemo",
      "displayName": "React Native init web demo",
  +    "expo": {
  +        "platforms": ["web"]
  +    }
  }
  ```
- Install the **`expo-cli`** with `npm i -g expo-cli`
- Start the project with `expo start --web`
  - You may want to add `.expo` to your **`.gitignore`**.
  - (**`--web`**) will automatically open the web page in your browser.
  - Expo will only start the webpack dev server (and not metro) because `"web"` is the only platform defined in `"platforms"`.
  - You can prevent the debug screen from opening with: **`--non-interactive`**
  - Toggle the production environment variable with **`--no-dev`**. This will persist commands so remember to turn it off with **`--dev`**.

## 💙 Using Unimodules in Web

Now you can install cross-platform Unimodules like **Camera**, **Sensors**, **Permissions**, ect...

- First add the core dependencies: `yarn add @unimodules/core @unimodules/react-native-adapter`
  - The treeshaking in `babel-preset-expo` can remove most of this based on usage 🤓
- Now install any of the Unimodules: `yarn add expo-camera`

## More Expo Functionality

Expo web support was designed to use as much or as little of the Expo SDK as you want. Here are some optional Expo features you can add (All of which are in `expo init` by default).

### Babel Preset

`babel-preset-expo` extends `@babel/preset-env` on web and is what we use to test and build web Unimodules. It won't compile your modules to **`core.js`**, meaning that you get optimal treeshaking and dead code elimination.

- Install: `yarn add -D babel-preset-expo`
- Change the babel preset in [**`babel.config.js`**](./babel.config.js)
  ```diff
  module.exports = {
  -   presets: ['module:metro-react-native-babel-preset']
  +   presets: ['babel-preset-expo']
  };
  ```

### App Entry

Expo `AppEntry` has built in support for error boundary in dev mode. In the future Notifications and Splash Screen features may be added as well. At the moment `AppEntry` is a part of `expo`, but when used with `babel-preset-expo` you can shake almost everything you aren't using (There is a _very_ small logging `sideEffect` that isn't shaken in this beta release 😅). This means if you only import `AppEntry`, then things like `Constants`, and `Camera` will be completely removed during the production build!

- Install: `yarn add expo`
  - You may also want to install the expo fork of `react-native`, it's something like: `"react-native": "https://github.com/expo/react-native/archive/sdk-32.0.0.tar.gz",` notice that the Expo version is defined in the URL.
- Change the `main` field in [**`package.json`**](./package.json)
  ```diff
  {
  -   "main": "index",
  +   "main": "node_modules/expo/AppEntry.js",
  }
  ```
- Delete the `index.js` and `index.web.js` because `AppEntry` uses the `App.js` file in your root directory as the main component.
  - You don't need to invoke `ReactDOM.render` or `AppRegistry.registerComponent` because `AppEntry` will do this for you.

**Consider** that this means your native app will _also_ use the Expo `AppEntry`. You can avoid this by re-exporting `node_modules/expo/AppEntry.js` from your `index.web.js`, and leaving the `main` assigned to `index`.

### PWA Config

> Very undocumented in beta

**[Configuring the app.json][appjson]**

The PWA manifest can share almost all of the data from your native app when you configure it through the `expo` field of the `app.json`. For instance assigning up the `expo.icon` will auto generate the correct icons for usage on all platforms that accept PWAs. Splash screens can be generated for the correct `expo.orientation` and tablets with `expo.supportsTablet`.
Even the ["Native App Install Banners"][appbanner] can be generated when the `expo.ios` or `expo.android` fields are populated.

[appjson]: https://docs.expo.io/versions/latest/workflow/configuration/#__next
[appbanner]: https://developers.google.com/web/fundamentals/app-install-banners/native
[rnw]: https://github.com/necolas/react-native-web
[uni]: https://github.com/unimodules
[rncli]: https://www.npmjs.com/package/react-native-cli
[exwebpack]: https://www.npmjs.com/package/@expo/webpack-config
