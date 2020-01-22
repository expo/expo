---
title: Web Performance
---

Expo uses **react-native-web** which is the highly optimized framework used to power major websites and PWAs like [Twitter](https://mobile.twitter.com), [Major League Soccer](https://matchcenter.mlssoccer.com), [Flipkart](https://twitter.com/naqvitalha/status/969577892991549440), [Uber](https://www.youtube.com/watch?v=RV9rxrNIxnY), [The Times](https://github.com/newsuk/times-components), [DataCamp](https://www.datacamp.com/community/tech/porting-practice-to-web-part1).

### Presets

There are a number of performance tools at your disposal that will not only optimize your web app, but also improve the performance of your native app! Here are the officially recommended and most optimal set of tools to use when creating universal projects:

- **Babel:** [`babel-preset-expo`](https://www.npmjs.com/package/babel-preset-expo) extends the default react-native preset and adds support for all other Expo platforms. In the browser this has massive performance benefits by enabling tree-shaking of the unused `react-native-web` modules.
- **Webpack Config:** [`@expo/webpack-config`](https://www.npmjs.com/package/@expo/webpack-config) A default Webpack config that's optimized for running `react-native-web` apps and creating [progressive web apps](https://developers.google.com/web/progressive-web-apps/).
- **Jest:** [`jest-expo`](https://www.npmjs.com/package/jest-expo) A universal solution for testing your code against all of the platforms it runs on. Learn more about [Universal Testing.](https://blog.expo.io/testing-universal-react-native-apps-with-jest-and-expo-113b4bf9cc44)

## Optimize Your Assets

The easiest and most **highly** recommended way to improve you project is to optimize your assets. You can reduce the size of your assets with the [Expo Optimize CLI](https://www.npmjs.com/package/expo-optimize). 

```sh
# Make sure you can successfully install the native image editing library Sharp
npm install -g sharp-cli

# Then in your project run:
npx expo-optimize
```

## 📦 What Makes My App Large?

To inspect bundle sizes, we use a Webpack plugin called [_Webpack Bundle Analyzer_](https://github.com/webpack-contrib/webpack-bundle-analyzer) A plugin that will help you visualize the size of your static bundles. You can use this to identify unwanted large packages that you may not have bundled intentionally.

### Using Bundle Analyzer

1. Reveal the Webpack Config: `expo customize:web` and select `webpack.config.js`.
2. Customize the config to generate a web report: 

```js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const isProd = env.mode === 'production';
  // A web report will be generated everytime you run `expo build:web`
  // By default this is disabled because it will add noticeably more time to your builds and reloads.
  const config = await createExpoWebpackConfigAsync({ ...env, report: isProd }, argv);
  return config;
};
```

- **Alternatively** you can pass a lot more options to the web report like this:
```js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const isProd = env.mode === 'production';

  const report = isProd && {
    // Any of the following: https://github.com/webpack-contrib/webpack-bundle-analyzer#options-for-plugin
    "statsFilename": "stats.json",
    "reportFilename": "report.html"
    // "server", "static", "disabled"
    "analyzerMode": 'static',
    // Host that will be used in server mode to start HTTP server.
    "analyzerHost": '127.0.0.1',
    // Port that will be used in server mode to start HTTP server.
    "analyzerPort": 8888,
    // stat, parsed, gzip
    "defaultSizes": 'gzip',
    // Automatically open report in default browser.
    "openAnalyzer": false,
    // If true, webpack stats JSON file will be generated in bundle output directory.
    "generateStatsFile": true,
    // null or {Object}
    "statsOptions": null,
    // {null|pattern|pattern[]} where pattern equals to {String|RegExp|function}
    "excludeAssets": null,
    // Overrides logLevel
    "verbose": false,
    // The output path for the report.
    "path": "web-report",
  }
  
  const config = await createExpoWebpackConfigAsync({ ...env, report }, argv);
  return config;
};
```

### Finding Tree-Shaking Errors

If you want to track down why a package was included, you can build your project in [debug mode](https://github.com/expo/expo-cli/blob/af9e390b74dcb7a0132e73b34ea0cdb9437a771c/packages/xdl/src/Web.ts#L69-L92).

```sh
EXPO_WEB_DEBUG=true expo build:web
```

> This will make your bundle much larger, and you shouldn't publish your project in this state.

You can now search for unwanted packages by name and see which files or methods are preventing them from being tree-shaken.

## ⚡️ Lighthouse

Lighthouse is a great way to see how fast, accessible, and performant your website is.
You can test your project with the _Audit_ tab in Chrome, or with the [**Lighthouse CLI**][lighthouse].

After creating a production build with `expo build:web` and serving it somewhere, run Lighthouse with the URL your site is hosted at.

```sh
lighthouse <url> --view
```

[lighthouse]: https://github.com/GoogleChrome/lighthouse#using-the-node-cli
[nic]: http://nicolasgallagher.com/
