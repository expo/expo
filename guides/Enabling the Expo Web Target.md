# Enabling the Expo Web Target

> This is a beta release and subject to changes.

Using Unimodules, **`react-native-web`** and **`expo-cli`**, you can configure your app to run as a website or progressive web application (PWA).

Ideally all of the Expo modules will either have partial support for web or fail gracefully.

## Getting Started

By default Expo web will be enabled in any new project you create with the `expo-cli`!

## Adding support to existing projects

A standard Expo app (Running `expo init` with the `expo-cli`) will have the following files:

```diff
+ App.js
+ package.json
// Notice that Babel 7 is required.
+ babel.config.js
+ app.json
```

If you have a `.babelrc` file, upgrade to the **Babel 7** [`babel.config.js`][ncl-babel-config].

Ensure you have the platform enabled in the `app.json`.

**`app.json`**

```diff
{
    platforms: [
        'ios',
        'android',
+        'web'
    ]
}
```

Now make the following changes in your `package.json`.

**`package.json`**

```diff
// Ensure your main entry point is `App.js` (Default for Expo)
+ "main": "node_modules/expo/AppEntry.js",
"scripts": {
    ...
    // Optionally you can test your prod bundle locally
+    "web:serve": "serve ./web-build"
    // Optionally you can add a publish script as well.
+    "web:publish": "netlify deploy --dir web-build",
},
"devDependencies": {
+    "babel-preset-expo": "^5.0.0",
},
// Optionally you can define the browser support. This may become required in the future.
+ "browserslist": [
+    ">0.2%",
+    "not dead",
+    "not ie <= 11",
+    "not op_mini all"
+ ]
```

Now you can start using web by running `expo start`. To generate a production build run `expo build:web` which will generate a `web-build/` folder.

## Usage

After adding web support your main entry point should be the `App.js` file.

If you are upgrading your existing `react-native-web` project, you'll need to remove the `AppRegistry` as this is managed by `expo`.

```diff
❌ - This is managed by Expo, no need to register your application.
- AppRegistry.registerComponent('App', () => App);
- AppRegistry.runApplication('App', { rootTag: document.getElementById('react-root') });
```

### Customization

Most of the customization can be done via the `app.json`.

- The `title` value will be used for the web `<title />` element.

```diff
{
+    web: {
+        favicon: "./favicon.ico",
+        productionPath: "web-build",
+    }
}
```

### Coverage

For coverage of Expo and various community libraries, check out [native.directory][native-directory]. For modules imported from `react-native`, you can look at the `react-native-web` [compatibility guide][react-native-web-compatibility].

[native-directory]: http://native.directory
[react-native-web-compatibility]: https://github.com/necolas/react-native-web#compatibility-with-react-native
[ncl-web-folder]: https://github.com/expo/expo/tree/master/apps/native-component-list/web
[ncl-webpack-folder]: https://github.com/expo/expo/tree/master/apps/native-component-list/webpack
[ncl-babel-config]: https://github.com/expo/expo/blob/master/apps/native-component-list/babel.config.js

### Customizing Webpack

By default `expo-cli` will run your project with `@expo/webpack-config`.

In the future this can be extended to match your needs.
