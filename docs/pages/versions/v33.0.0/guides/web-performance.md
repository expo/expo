---
title: Web Performance
---

Expo uses **react-native-web** which is a highly optimized framework that removes any unused modules during the production build. Tools like Expo CLI, babel-preset-expo, and `@expo/webpack-config` are used to optimize your app even further.

There are a number of performance tools at your disposal that will not only optimize your web app, but also improve the performance of your native app!

## Optimize Your Assets

You can reduce the size of your assets with the Expo CLI command `optimize`. Learn more about it here: [Image Compression with Expo CLI](https://blog.expo.io/image-compression-with-expo-cli-d32d15cc8b73).

## 📦 What Makes My App Large?

To inspect bundle sizes, we use a Webpack plugin called [_Webpack Bundle Analyzer_](https://github.com/webpack-contrib/webpack-bundle-analyzer) A plugin that will help you visualize the size of your static bundles. You can use this to identify abnormally large things that you may not need (like this description).

By default this is disabled because it will add noticeably more time to your builds and reloads.

**`app.json`**

```js
{
    "expo": {
        "web": {
            "build": {
                // To use the defaults set:
                "report": true,

                // For more complex functionality:
                "report": {
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
            }
        }
    }
}
```

## ⚡️ Lighthouse

Lighthouse is a great way to see how fast, accessible, and performant your website is.
You can test your project with the _Audit_ tab in Chrome, or with the [**Lighthouse CLI**][lighthouse].

After creating a production build with `expo build:web` and serving it somewhere, run Lighthouse with the URL your site is hosted at.

```sh
lighthouse <url> --view
```

[lighthouse]: https://github.com/GoogleChrome/lighthouse#using-the-node-cli
[nic]: http://nicolasgallagher.com/
