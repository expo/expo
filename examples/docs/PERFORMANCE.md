# Performance

You may think using react-native in the browser is not performant, but actually [Nicolas Gallagher][nic] is a genius. **react-native-web** is a highly optimized framework that removes any unused modules with a set of complex babel presets and webpack (this is partly what Expo helps to simplify).

There are a number of performance tools at your disposal that will not only optimize your web app, but also improve the performance of your native app!

## 📦 What Makes My App Large?

To see what libraries make up your app, you can use the reporting functionality of `@expo/webpack-config`.

- run `expo customize:web`
- select `webpack.config.js` then generate it by pressing enter
- customize the `webpack.config.js` file to look like this:

```js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(
    // Pass `true` or an object matching these options: https://github.com/expo/expo-cli/blob/433d78a1d07fa549e0110cf8d58efded96027ba2/packages/webpack-config/src/withReporting.ts#L13-L25
    { ...env, report: true },
    argv,
  );
  // Customize the config before returning it.
  return config;
};
```
- View the available options here: [report options](https://github.com/expo/expo-cli/blob/433d78a1d07fa549e0110cf8d58efded96027ba2/packages/webpack-config/src/withReporting.ts#L13-L25)

re-running `expo build:web` will now create a `web-report/` with Webpack Bundle Analyzer. A plugin that will help you visualize the size of your static bundles. You can use this to identify abnormally large things that you may not need (like this description).

## ⚡️ Lighthouse

You can test your project with the _Audit_ tab in Chrome, or with the [**Lighthouse CLI**][lighthouse].

```sh
lighthouse <url> --view
```

[lighthouse]: https://github.com/GoogleChrome/lighthouse#using-the-node-cli
[nic]: http://nicolasgallagher.com/
