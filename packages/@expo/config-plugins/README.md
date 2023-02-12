<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/config-plugins</code>
</h1>

<p align="center">A powerful tool for generating native app code from a unified JavaScript interface.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/config-plugins">

  <a href="https://www.npmjs.com/package/@expo/config-plugins">
    <img src="https://flat.badgen.net/npm/dw/@expo/config-plugins" target="_blank" />
  </a>
</p>

<!-- Body -->

Most basic functionality can be controlled by using the the [static Expo config](https://docs.expo.dev/versions/latest/config/app/), but some features require manipulation of the native project files. To support complex behavior we've created config plugins, and mods (short for modifiers).

For more info, please refer to the official docs: [Config Plugins](https://docs.expo.dev/guides/config-plugins/).

## Environment Variables

### `EXPO_DEBUG`

Print debug information related to static plugin resolution.

### `EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS`

Show all error info related to static plugin resolution. Requires `EXPO_DEBUG` to be enabled.

### `EXPO_USE_UNVERSIONED_PLUGINS`

Force using the fallback unversioned plugins instead of a local versioned copy from installed packages, this should only be used for testing the CLI.
