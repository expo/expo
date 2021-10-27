---
title: Customizing Metro
---

When you run `expo start`, the CLI uses [Metro](https://facebook.github.io/metro/) to bundle JavaScript for Android and iOS platforms. By default Expo CLI will use the Metro configuration defined in the [`@expo/metro-config`](https://github.com/expo/expo-cli/tree/master/packages/metro-config) package (re-exported from `expo` as `expo/metro-config` in SDK 41 and greater). You can add custom options for Metro by creating a file named **metro.config.js** in the project root directory.

The **metro.config.js** file looks like this:

```js
module.exports = {
  /* add options here */
};
```

It can also export a function or an async function, if necessary:

```js
module.exports = async () => {
  return {
    /* dynamically created options can be added here */
  };
};
```

You can find a complete list of supported options in the Metro docs: [Configuring Metro](https://facebook.github.io/metro/docs/configuration). Please note that you only need to specify the options that you want to customize: the custom config will be merged with the defaults from `expo/metro-config` when using Expo CLI.

To add to a value, such as an array of file extensions, defined in the default configuration, you can access the defaults using the `getDefaultConfig(projectRoot)` function defined in `@expo/metro-config`. Add `@expo/metro-config` to the dependencies of your project to do this. In SDK +41 you can import from `expo/metro-config`.

## Examples

### Adding more file extensions to `assetExts`

One use case for custom **metro.config.js** is adding more file extensions that are considered to be an [asset](assets.md). Many image, video, audio and font formats (e.g. `jpg`, `png`, `mp4`, `mp3` and `ttf`) are included by default. To add more asset file extensions, create a **metro.config.js** file in the project root. In the file add the file extension (without a leading `.`) to `assetExts`:

```js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push('db');

module.exports = defaultConfig;
```

(This example adds `.db`, the extension of SQLite database files to `assetExts`).

## Optimizations

By default, Metro uses [`uglify-es`](https://github.com/mishoo/UglifyJS) to minify and compress your code. You can customize uglify by passing [options](https://github.com/mishoo/UglifyJS#compress-options) to `transformer.minifierConfig`. For example, if you wanted to remove all console logs from your app in production, you can do the following:

**metro.config.js**

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove all console logs in production...
config.transformer.minifierConfig.compress.drop_console = true;

module.exports = config;
```

Here are all of the [default Uglify options](https://github.com/facebook/metro/blob/b629f44239bbb3414491755185cf19b5834b4b7a/packages/metro-config/src/defaults/index.js#L94-L111) applied in Metro bundler.

### Using Terser

You can use [`terser`](https://github.com/terser/terser) instead of `uglify-es` to mangle and compress your project.

First, install terser in your project with `yarn add --dev metro-minify-terser`.

Now set terser with `transformer.minifierPath`, and pass in [`terser` options](https://github.com/terser/terser#compress-options) via `transformer.minifierConfig`.

**metro.config.js**

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  // Terser options...
};

module.exports = config;
```

### Source map exploration

A useful way to debug your source code is by exploring the source maps. You can do this easily in any Expo project using [`react-native-bundle-visualizer`](https://github.com/IjzerenHein/react-native-bundle-visualizer). Just install it with `yarn add -D react-native-bundle-visualizer`, then run `npx react-native-bundle-visualizer`.

This will show you an interactive breakdown of what makes up your React bundle. Using this you can find large packages that you may not have wanted bundled in your project. The smaller the bundle, the faster your app will start.
