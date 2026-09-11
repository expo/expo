# `@expo/metro-config`

This package contains the default Metro config that is required for bundling apps with Expo CLI. Refer to the [Expo `metro.config.js` docs](https://docs.expo.dev/versions/latest/config/metro/) to learn more.

`metro.config.js`

```js
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
```

## EAS cache directories

EAS workers can set both `EAS_METRO_CACHE_OUTPUT_DIR` and `EAS_METRO_CACHE_RESTORE_DIR`
before loading the Metro config. The default config then creates two Expo binary
file stores, with the output store first and the restored store second. If either
variable is empty or unset, the default remains a single store in
`path.join(os.tmpdir(), 'metro-cache')`.

The worker must supply distinct absolute paths, start each job with an empty output
directory, and extract the previous cache into the restored directory. Metro copies
reused results into the output store and also writes newly computed results there.
After bundling processes and cache writes finish, the worker can archive only the
output directory. Unused restored entries are excluded from that archive.

These variables only configure the stores. The worker owns archive transfer,
size limits, and directory cleanup. Both stores are writable, and Metro's cache
reset clears both. Projects that replace `cacheStores` must configure their own
integration.

## Exotic

> As of SDK 51, the exotic transformer has been fully removed in favor of the default `@expo/metro-config` transformer. The export `@expo/metro-config/transformer` no longer exists.

Most of the [Exotic mode](https://blog.expo.dev/drastically-faster-bundling-in-react-native-a54f268e0ed1) performance benefits have been integrated in the default Expo CLI bundling pipeline (e.g. [less AST cloning](https://github.com/facebook/metro/pull/854), [faster worker creation](https://github.com/facebook/metro/pull/856)), and as such, the feature no longer needs to be enabled/disabled. Setting `mode: "exotic"` will no longer have any additional effects over the default.

Ensure you extend the `@expo/metro-config/babel-transformer` when customizing babel. Learn more: [Extending the Babel transformer](https://docs.expo.dev/versions/latest/config/metro/#extending-the-babel-transformer).
