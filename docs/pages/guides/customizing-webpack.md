---
title: Webpack bundler
sidebar_title: Bundling with Webpack
---

When you run `npx expo start --web` or `expo export:web` the CLI will check to see if your project has a **webpack.config.js** in the root directory. If the project doesn't then Expo will use the default `@expo/webpack-config` (preferred).

> This is akin to `react-scripts` & `create-react-app`.

If you need to edit the config the best way to do this is by running `npx expo customize webpack.config.js`.
This will install `@expo/webpack-config` as a dev dependency and create a template `./webpack.config.js` in your project.
You can now make changes to a config object based on the default config and return it for Expo CLI to use.
Deleting the config will cause Expo to fall back to the default again.

If you create a new Webpack config or make any changes to it you'll need to restart your Webpack dev server with `npx expo start`.

## Example

**webpack.config.js**

```ts
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

// Expo CLI will await this method so you can optionally return a promise.
module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  // If you want to add a new alias to the config.
  config.resolve.alias['moduleA'] = 'moduleB';

  // Maybe you want to turn off compression in dev mode.
  if (config.mode === 'development') {
    config.devServer.compress = false;
  }

  // Or prevent minimizing the bundle when you build.
  if (config.mode === 'production') {
    config.optimization.minimize = false;
  }

  // Finally return the new config for the CLI to use.
  return config;
};
```

## Polyfills

React Native for web uses [some advanced browser features](https://github.com/necolas/react-native-web/blob/e4ed0fd3c863e6c61aa3ea8afeff79b7fa74b461/packages/docs/src/introduction.stories.mdx#install) that might not be available in every browser. Expo web tries to make including these features as simple and efficient as possible with `@expo/webpack-config`.

### ResizeObserver

- [Browser support](https://caniuse.com/#feat=resizeobserver)

**TL;DR:** To fully support `onLayout` install `resize-observer-polyfill`.

The `onLayout` prop that's used in all of the core primitives like View, Image, Text, ScrollView, etc. requires an API called [`ResizeObserver`](https://drafts.csswg.org/resize-observer-1/). This API isn't fully supported across all browsers, iOS Safari (in iOS 13) is a good example. If the device doesn't support `ResizeObserver` then `react-native-web` will fallback on `window.onresize` and you'll see a warning in the logs:

```
onLayout relies on ResizeObserver which is not supported by your browser.
Please include a polyfill, e.g., https://github.com/que-etc/resize-observer-polyfill.
Falling back to window.onresize.
```

To get everything working properly, you'll want to install and include a global polyfill for `ResizeObserver`.

### Adding ResizeObserver

- Install the polyfill: `yarn add resize-observer-polyfill`
- Restart the project and `@expo/webpack-config` will automatically include the polyfill.

The reason it automatically includes the polyfill is because `react-native-web` needs it included immediately. Webpack is able to inject the polyfill before any of the application code has been executed. Alternatively you can customize the webpack config and include the polyfill in the `entry` field yourself.

### Testing the ResizeObserver polyfill

- Open the running Expo project in iOS Safari
- Connect the device to an Apple computer
- Open Safari on the computer in go to `Develop > [YOUR DEVICE] > [YOUR HOST]`
- Ensure the logs don't have the `onLayout relies on ResizeObserver...` warning.

## Editing static files

You can also use `npx expo customize` to generate the static project files: **index.html**, **serve.json**, etc.
These can be used to customize your project in a more familiar way.

All of the files you select from the terminal prompt will be copied to a `web/` folder in your project's root directory. Think of this folder like `public/` in Create React App. We use "web" instead of "public" because Expo Webpack is web-only, the static folder does not work for iOS or Android apps. For mobile platforms, we similarly put platform-specific project files in `/ios` and `/android` folders.

Deleting any of these files will cause Expo Webpack to fallback to their respective default copies.

### Why

- Customizing the favicon icon
- Adding third-party API code to the `<head/>` in your **index.html**
- Changing the caching policy in the **serve.json** file
