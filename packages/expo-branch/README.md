# expo-branch

`expo-branch` is a unimodule wrapper around [`react-native-branch` library](https://github.com/BranchMetrics/react-native-branch-deep-linking-attribution). With custom builds enabled it allows you to optionally include the dependency on Android.

See [Branch docs](https://docs.expo.io/versions/latest/sdk/branch) for more information on this module.

## Config Plugin

> This is a [built-in plugin](https://docs.expo.io/guides/config-plugins/#legacy-plugins).

To customize this package's configuration, add the plugin to the [`plugins`](https://docs.expo.io/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["expo-branch"]
  }
}
```

Next, rebuild your app as described in the ["Adding custom native code"](https://docs.expo.io/workflow/customizing/) guide.

#### Props

The plugin provides props for extra customization. Every time you change the props or plugins, you'll need to rebuild (and `prebuild`) the native app. If no extra properties are added, defaults will be used.

- `iosApiKey` (_string_): iOS Branch API key to be embedded in the `Info.plist`. Defaults to `ios.config.branch.apiKey`
- `androidApiKey` (_string_): Android Branch API key to be embedded in the `AndroidManifest.xml`. Defaults to `android.config.branch.apiKey`

#### Example

```json
{
  "expo": {
    "plugins": [
      [
        "expo-branch",
        {
          "iosApiKey": "XXX",
          "androidApiKey": "XXX"
        }
      ]
    ]
  }
}
```
