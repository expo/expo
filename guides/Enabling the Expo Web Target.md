# Enabling the Expo Web Target

Using Unimodules and other tools provided by Expo, you can configure your app to run as a website or progressive web application (PWA).

Ideally all of the Expo modules will either support web or fail gracefully. Regardless the modules you run in your Expo web app should function to some degree on the web platform.

## Adding support to existing projects

A standard Expo app (Running `expo init` with the `expo-cli`) will have the following files:

```diff
+ App.js
+ package.json
+ babel.config.js
+ app.json
```

You'll need to add and configure a couple of things manually while we finalize the official project creation of Expo for web.

- Add [`web/`][ncl-web-folder]
- Add [`webpack/`][ncl-webpack-folder]
- If you have a `.babelrc` file, upgrade to the **Babel 7** [`babel.config.js`][ncl-babel-config].
-
- Make the following changes to your `package.json`

```diff
// Ensure your main entry point is `App.js` (Default for Expo)
+ "main": "node_modules/expo/AppEntry.js",
"scripts": {
    ...
    // To test secure features like camera or microphone, you will need to add: --https --host <YOUR_IP>
+    "web:dev": "webpack-dev-server -d --config webpack/webpack.dev.js",
+    "web:build": "webpack -p --config webpack/webpack.prod.js",
+    "web:serve": "serve ./web-build"
    // Optionally you can add a publish script as well.
+    "web:publish": "netlify deploy --dir web-build",
},
"dependencies": {
+    "@babel/polyfill": "^7.2.5",
    ...
},
"devDependencies": {
+    "babel-loader": "^8.0.5",
+    "babel-preset-expo": "^5.0.0",
+    "brotli-webpack-plugin": "^1.1.0",
+    "case-sensitive-paths-webpack-plugin": "^2.2.0",
+    "clean-webpack-plugin": "^1.0.1",
+    "compression-webpack-plugin": "^2.0.0",
+    "copy-webpack-plugin": "^5.0.0",
+    "css-loader": "^2.1.0",
+    "expo-yarn-workspaces": "^1.0.0",
+    "file-loader": "^3.0.1",
+    "find-yarn-workspace-root": "^1.2.1",
+    "html-loader": "^0.5.5",
+    "html-webpack-plugin": "4.0.0-alpha.2",
+    "http-server": "^0.11.1",
+    "mini-css-extract-plugin": "^0.5.0",
+    "pnp-webpack-plugin": "^1.2.1",
+    "react-dev-utils": "^7.0.3",
+    "react-error-overlay": "^5.1.3",
+    "serve": "^10.1.2",
+    "style-loader": "^0.23.1",
+    "terser-webpack-plugin": "^1.2.2",
+    "url-loader": "^1.1.2",
+    "webpack": "4.24.0",
+    "webpack-bundle-analyzer": "^3.0.4",
+    "webpack-cli": "^3.2.3",
+    "webpack-dashboard": "^3.0.0",
+    "webpack-dev-server": "^3.2.0",
+    "webpack-hot-middleware": "^2.24.3",
+    "webpack-manifest-plugin": "^2.0.4",
+    "webpack-merge": "^4.2.1",
+    "workbox-webpack-plugin": "^3.6.3"
    ...
},
+ "browserslist": [
+    ">0.2%",
+    "not dead",
+    "not ie <= 11",
+    "not op_mini all"
+ ]

```

You should now be able to run `yarn web:dev` to start webpack.
Remember features are currently being added and changed rapidly, use with caution!

## Usage

After adding web support your main entry point should be the `App.js` file.

**App.js**

```diff
❌ - This is managed by Expo, no need to register your application.
- AppRegistry.registerComponent('App', () => App);
- AppRegistry.runApplication('App', { rootTag: document.getElementById('react-root') });
```

Generally most of the interactions you will do with `react-native` will come from `react-native-web`, so you should refer to the [compatibility guide][react-native-web-compatibility] to see what's available.

[react-native-web-compatibility]: https://github.com/necolas/react-native-web#compatibility-with-react-native
[ncl-web-folder]: https://github.com/expo/expo/tree/master/apps/native-component-list/web
[ncl-webpack-folder]: https://github.com/expo/expo/tree/master/apps/native-component-list/webpack
[ncl-babel-config]: https://github.com/expo/expo/blob/master/apps/native-component-list/babel.config.js
