---
title: Customizing Metro
---

import { Terminal } from '~/ui/components/Snippet';
import { YesIcon, NoIcon } from '~/ui/components/DocIcons';

When you run `expo start`, the CLI uses [Metro](https://facebook.github.io/metro/) to bundle JavaScript for Android and iOS platforms. By default Expo CLI will use the Metro configuration defined in the [`@expo/metro-config`](https://github.com/expo/expo-cli/tree/main/packages/metro-config) package (re-exported from `expo` as `expo/metro-config` in SDK 41 and greater). You can add custom options for Metro by creating a file named **metro.config.js** in the project root directory.

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

## Web Support

> Metro web support is an experimental feature in Expo SDK 46 and only works with the [local Expo CLI](https://blog.expo.dev/new-versioned-expo-cli-cf6e10632656).

By default, Expo CLI uses Webpack as the bundler on web platforms, this is because Metro historically did not support web. Using different bundlers across platforms leads to some critical divergence in how your app works across platforms. Features like Fast Refresh which work on native don't work on web, and important production functionality like assets are treated differently across bundlers.

By utilizing Metro across all platforms you can have a more universal development experience. You also get to utilize shared cached chunks across platforms meaning faster iteration speed when working across platforms. Project upgrades can also be easier since there are less dependencies (`webpack`, `webpack-dev-server`) you need to update between versions.

All Metro web features should be universal (bundling, static files, assets) making the DX easier to understand and faster across the app development process.

Learn once, bundle everywhere!

### Expo Webpack vs. Expo Metro

Universal Expo Metro is designed to be fully universal, meaning any web bundling features should also work on native too. Because of this we make some breaking changes between the two bundler implementations, carefully check the difference if you're moving from Webpack to Metro.

| Feature          | Metro                | Webpack                |
| ---------------- | -------------------- | ---------------------- |
| Start command    | `npx expo start`     | `npx expo start`       |
| Bundle command   | `npx expo export`    | `npx expo export:web`  |
| Output folder    | `dist/`              | `web-build/`           |
| Static folder    | `public/`            | `web/`                 |
| Config file      | `metro.config.js`    | `webpack.config.js`    |
| Default config   | `@expo/metro-config` | `@expo/webpack-config` |
| Fast Refresh     | WIP (coming soon)    | <NoIcon />             |
| Tree Shaking     | <NoIcon />           | <YesIcon />            |
| CSS Handling     | <NoIcon />           | <YesIcon />            |
| Asset Manifests  | <NoIcon />           | <YesIcon />            |
| Bundle Splitting | WIP (pending native) | <YesIcon />            |

Note that aliases, resolution, and other bundler features are now universal across platforms as well!

### Web Support: How?

To enable Metro web support, be sure to use Expo SDK 46, then modify your Expo config (`app.json`, or `app.config.js`) to enable the feature using the `expo.web.bundler` field:

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

#### Web Support: Development

To start the development server:

<Terminal cmd={["$ npx expo start --web"]} />

Or start normally and press `w` in the Terminal UI.

#### Web Support: Production

> TL;DR: Use `npx expo export` instead of `npx expo export:web` or `expo build:web`.

You can bundle the project for hosting just like you would for native:

<Terminal cmd={["$ npx expo export"]} />

You should see something like this:

```
app $ npx expo export
Starting Metro Bundler
iOS ./index.tsx ░░░░░░░░░░░░░░░░  4.0% (  8/132)
Android ./index.tsx ░░░░░░░░░░░░░░░░  0.5% (  3/129)
Web ./index.tsx ░░░░░░░░░░░░░░░░  4.0% ( 5/5
```

You can skip bundling for all platforms by using the `--platform` flag:

<Terminal cmd={["$ npx expo export --platform web"]} />

Your output will be found in the `dist` folder.

The output can be tested locally by using the [Serve CLI](https://www.npmjs.com/package/serve).

<Terminal cmd={["$ npx serve dist"]} />

You can deploy the website using any popular web host, follow any of the guides in [publishing websites](/distribution/publishing-websites/), just substitute the `web-build/` folder for the `dist/` folder.

#### Static Files

Expo's Metro implementation supports hosting static files from the dev server by putting them in the root `public/` folder, this is akin to many other web frameworks. In Expo Webpack we default to using the `web/` folder.

When exporting with `npx expo export` we copy the contents of the `public/` folder into the `dist/` folder, meaning your app can expect to fetch these assets relative to the host URL.

The most common example of this is the `public/favicon.ico` which is used by websites to render the tab icon.

You can overwrite the default `index.html` in Metro web by creating a `public/index.html` file in your project.

In the future, this will work universally across platforms with EAS Update hosting. Currently the feature is web-only based on the static host used for the native app, for example, the legacy Expo service updates does not support this feature.

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
