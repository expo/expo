# Enabling the Expo Web Target

Using Unimodules and other tools provided by Expo, you can configure your app to run as a website or progressive web application (PWA).

Ideally all of the Expo modules will either support web or fail gracefully. Regardless the modules you run in your Expo web app should function to some degree on the web platform.

## Adding support to existing projects

A standard Expo app (Running `expo init` with the `expo-cli`) will have the following files:

```
- App.js
- package.json
- babel.config.js
- app.json
```

You'll need to add and configure a couple of things manually while we finalize the official project creation for Expo for web.

- Add [`web/`](https://github.com/expo/expo/tree/master/apps/native-component-list/web)
- Add [`webpack.config.js`](https://github.com/expo/expo/blob/master/apps/native-component-list/webpack.config.js) You will also need to change `modules: absolutePath('../../node_modules'),` to `modules: absolutePath('./node_modules'),`. Currently we are targeting all the `node_modules/` to account for the increasing number of libraries written in modern JavaScript syntax.
- If you have a `.babelrc` file, upgrade to the Babel 7 [`babel.config.js`](https://github.com/expo/expo/blob/master/apps/native-component-list/babel.config.js). Notice that there is platform specific code in here.
- Ensure your main entry point is `App.js` (Default for Expo)
- Make the following changes to your `package.json`

```js
"scripts": {
    ...
    // To test secure features like camera or microphone, you will need to add: --https --host <YOUR_IP>
    "web": "webpack-dev-server -d --config ./webpack.config.js --inline --colors --content-base web/",
    "build": "NODE_ENV=production webpack -p --config ./webpack.config.js",
}
```

Run the following command in the root directory:

```sh
yarn add case-sensitive-paths-webpack-plugin html-loader html-webpack-plugin pnp-webpack-plugin react-art react-dev-utils react-dom react-native-web webpack-manifest-plugin; yarn add -D babel-loader babel-plugin-react-native-web babel-preset-expo css-loader file-loader react-native-scripts style-loader webpack webpack-cli webpack-dev-server
```

Which should result in the following:

```js
// package.json

"dependencies": {
    ...
    "case-sensitive-paths-webpack-plugin": "^2.1.2",
    "html-loader": "^0.5.5",
    "html-webpack-plugin": "4.0.0-alpha.2",
    "pnp-webpack-plugin": "^1.2.1",
    "react-art": "^16.6.1",
    "react-dev-utils": "6.0.5",
    "react-dom": "16.6.1",
    "react-native-web": "^0.9.6",
    "webpack-manifest-plugin": "^2.0.4"
},
"devDependencies": {
    ...
    "babel-loader": "^8.0.4",
    "babel-plugin-react-native-web": "^0.9.6",
    "babel-preset-expo": "^5.0.0",
    "css-loader": "^1.0.1",
    "expo-yarn-workspaces": "^1.0.0",
    "file-loader": "^2.0.0",
    "react-native-scripts": "^2.0.1",
    "style-loader": "^0.23.1",
    "webpack": "^4.24.0",
    "webpack-cli": "^3.1.2",
    "webpack-dev-server": "3.1.10"
}
```

You can also add the following:

```js
"browserslist": [
    ">0.2%",
    "not dead",
    "not ie <= 11",
    "not op_mini all"
]
```

You should now be able to run `yarn web` to start webpack. Features are currently being added and changed rapidly, use with caution.

## Usage

After adding web support your main entry point should be the `App.js` file.

```js
// ✅

/* Doing nothing! */

// ❌ - This is managed by Expo, no need to register your application.

AppRegistry.registerComponent('App', () => App);
AppRegistry.runApplication('App', { rootTag: document.getElementById('react-root') });
```

Generally most of the interactions you will do with `react-native` will come from `react-native-web`, so you should refer to the [compatibility guide][react-native-web-compatibility] to see what's available.

[react-native-web-compatibility]: https://github.com/necolas/react-native-web#compatibility-with-react-native
