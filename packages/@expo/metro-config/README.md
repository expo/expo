<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/metro-config</code>
</h1>

<p align="center">A Metro config for running React Native projects with the Metro bundler.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/metro-config">

  <a href="https://www.npmjs.com/package/@expo/metro-config">
    <img src="https://flat.badgen.net/npm/dw/@expo/metro-config" target="_blank" />
  </a>
</p>

<!-- Body -->

## Exotic

When enabled, exotic mode adds the following assumptions:

- Resolver Fields: `browser, main`
  - The `react-native` field in module `package.json` is **NOT** supported.
  - Packages using `react-native-builder-bob` will default to using the CommonJS setting in exotic. If you need to modify your Node modules manually, be sure to change the files in your `lib/commonjs/` folder.
- Extensions: `ts, tsx, js, jsx, json, cjs`
  - `cjs` is added.
- `.babelrc` support is removed in favor of `babel.config.js`.
- `x_facebook_sources` is toggled off by default.

### Default Rules

1. Modules with `.*/lib/commonjs/` are skipped.
2. React Native is transformed with Sucrase to remove flow types and other unsupported language features.
   - If the React Native team transpiles react-native before shipping, we can remove this step.
3. Expo modules are transformed with Sucrase to remove import/export syntax. This is temporary while we figure out how to add ESModule support to the native runtime.
   - This is for improved tree shaking.
4. Known community modules (especially ones included in Expo Go) are transformed using a more expensive Sucrase preset
   - We may add support for extending this list in the future.
5. All other node modules are skipped.
6. All remaining code is assumed to be application code and transpiled with your local Babel preset.
   - "Victory Native" packages use too many language features so they are transpiled with Babel.

### Extra Customization

> Experimental

You can use `@expo/metro-config/transformer` to extend the experimental transformer API.
This can be used for:

- Adding extra modules that need to be transpiled locally (`transpileModules`).
- Adding extra `nodeModulesPaths` for monorepo support.
- Adding support for the `react-native` main resolver field back.

`metro-exotic-transformer.js`

```js
const { createExoticTransformer } = require('@expo/metro-config/transformer');

module.exports = createExoticTransformer({
  transpileModules: ['@stripe/stripe-react-native'],
  // You can uncomment the following lines to add any extra node_modules paths in a monorepo:
  //   nodeModulesPaths: [
  //     'node_modules',
  //     // Generally you'll add this when your config is in `apps/my-app/metro.config.js`
  //     '../../node_modules',
  //     // If you have custom packages in a `packages/` folder
  //     '../../packages',
  //   ],
});
```

Then use it in your project:

`metro.config.js`

```js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname, {
  // Initialize in exotic mode.
  // If you want to preserve `react-native` resolver main field, and omit cjs support, then leave this undefined
  // and skip setting the `EXPO_USE_EXOTIC` environment variable.
  mode: 'exotic',
});

// Use the new transformer
config.transformer.babelTransformerPath = require.resolve('./metro-exotic-transformer');

// Optionally, you can add support for the `react-native` resolver field back
// doing this will increase bundling time and size as many community packages ship untransformed code using this feature.
// Other packages like `nanoid` use the field to support `react-native` so you may need to enable it regardless.
// defaultConfig.resolver.resolverMainFields.unshift('react-native');

module.exports = config;
```

### Source Maps

Metro bundler adds an undocumented extension to source maps which provides slightly different names for anonymous functions. The source map sizes increase a lot by adding the `x_facebook_sources` object, and the net transformation time also increases by a noticeable amount. By default, exotic disables this feature. The feature can be re-enabled with `EXPO_USE_FB_SOURCES`. Here are the results:

<table>
<tr>
    <th>Enabled</th>
    <th>Disabled</th>
  </tr>
 <tr>
    <td>iOS Bundling: <b>7664ms</b></td>
    <td>iOS Bundling: <b>6875ms</b></td>
  </tr>
 <tr>
    <td><img src="https://user-images.githubusercontent.com/9664363/134078785-c9b0d93d-3dfb-4552-b786-b45059e10c3b.png" width="200" /></td>
    <td><img src="https://user-images.githubusercontent.com/9664363/134078781-9f79e9d8-56c7-4e20-952f-8214deb3f0ca.png" width="200" /></td>
  </tr>
</table>

- Most error reporting services don't support `x_facebook_sources` so the larger size mostly just increases hosting costs (when uploaded).
- Documentation for `x_facebook_sources` is not provided.

Cite: [#3861](https://github.com/expo/expo-cli/pull/3861)

### Troubleshooting

You should see the following log when Exotic is enabled:

> Unstable feature **EXPO_USE_EXOTIC** is enabled. Bundling may not work as expected, and is subject to breaking changes.

Or if `EXPO_DEBUG=1` is enabled, you'll see exotic mode in the settings breakdown.

If you don't see this message, check to ensure your `metro.config.js` is using `@expo/metro-config` and the version is at least `0.2.2`.

The transformer can be debugged using the environment variable: `DEBUG=expo:metro:exotic-babel-transformer` or `DEBUG=expo:metro:*`

### Adding Resolver Fields

You can add the `react-native` field back manually when exotic mode is enabled, we will investigate adding it back after more community packages have had time to adjust to transforming their code ahead of time.

`metro.config.js`

```js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields.unshift('react-native');

module.exports = config;
```
