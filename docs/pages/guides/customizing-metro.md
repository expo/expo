---
title: Customizing Metro
---

When you run `expo start`, the CLI uses [Metro](https://facebook.github.io/metro/) to bundle JavaScript for Android and iOS platforms. By default Expo CLI will use the Metro configuration defined in the [`@expo/metro-config`](https://github.com/expo/expo-cli/tree/master/packages/metro-config) package. You can add custom options for Metro by creating a file named `metro.config.js` in the project root directory.

The `metro.config.js` file looks like this:

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

You can find a complete list of supported options in the Metro docs: [Configuring Metro](https://facebook.github.io/metro/docs/configuration). Please note that you only need to specify the options that you want to customize: the custom config will be merged with the defaults from `@expo/metro-config` when using Expo CLI.

To add to an value, such as an array of file extensions, defined in the default configuration, you can access the defaults using the `getDefaultConfig(projectRoot)` function defined in `@expo/metro-config`. Add `@expo/metro-config` to the dependencies of your project to do this.

## Examples

### Adding more file extensions to `assetExts`

One use case for custom `metro.config.js` is adding more file extensions that are considered to be an [asset](assets.md). Many image, video, audio and font formats (e.g. `jpg`, `png`, `mp4`, `mp3` and `ttf`) are included by default. To add more asset file extensions, create a `metro.config.js` file in the project root. In the file add the file extension (without a leading `.`) to `assetExts`:

```js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'db'],
  },
};
```

(This example adds `.db`, the extension of SQLite database files to `assetExts`).
