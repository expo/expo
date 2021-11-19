---
title: Configuration with app.json / app.config.js
---

import PossibleRedirectNotification from '~/components/plugins/PossibleRedirectNotification';

<PossibleRedirectNotification newUrl="/versions/latest/config/app/" />

**app.json** is your go-to place for configuring parts of your app that don't belong in code. It is located at the root of your project next to your **package.json**. It looks something like this:

```javascript
{
  "expo": {
    "name": "My app",
    "slug": "my-app"
  }
}
```

Most configuration from **app.json** is accessible at runtime from your JavaScript code via [`Constants.manifest`](/versions/latest/sdk/constants/#expoconstantsmanifest). Sensitive information such as secret keys are removed. See the `"extra"` key below for information about how to pass arbitrary configuration data to your app.

## Properties

**app.json** configures many things, from your app name to icon to splash screen and even deep linking scheme and API keys to use for some services. To see a full list of available properties, please refer to the [app.json / app.config.js reference](/versions/latest/config/app/).

> 💡 Do you use Visual Studio Code? If so, we recommend that you install the [vscode-expo](https://marketplace.visualstudio.com/items?itemName=byCedric.vscode-expo) extension to get auto-completion of properties in **app.json** files.

## Dynamic configuration with app.config.js

For more customization you can use the JavaScript and TypeScript **app.config.js**, or **app.config.ts**. These configs have the following properties:

- Comments, variables, and single quotes!
- Importing/requiring other JavaScript files. Using import/export syntax in external files is not supported. All imported files must be transpiled to support your current version of Node.js. 
- TypeScript support with nullish coalescing and optional chaining.
- Updated whenever Metro bundler reloads.
- Provide environment information to your app.
- Does not support Promises.

For example, you can export an object as default to define your config in **app.config.js**:

```js
const myValue = 'My App';

export default {
  name: myValue,
  version: process.env.MY_CUSTOM_PROJECT_VERSION || '1.0.0',
  // All values in extra will be passed to your app.
  extra: {
    fact: 'kittens are cool',
  },
};
```

Extras can be accessed via `expo-constants`:

```ts
// App.js
import Constants from 'expo-constants';

Constants.manifest.extra.fact === 'kittens are cool';
```

You can access and modify incoming config values by exporting a function that returns an object. This is useful if your project also has an **app.json**. By default, Expo CLI will read the **app.json** first and send the normalized results to the **app.config.js**. This functionality is disabled when the `--config` is used to specify a custom config (also note that the [`--config` flag is deprecated](https://expo.fyi/config-flag-migration)).

For example, your **app.json** could look like this:

```json
{
  "expo": {
    "name": "My App"
  }
}
```

And in your **app.config.js**, you are provided with that configuration in the arguments to the exported function:

```js
export default ({ config }) => {
  console.log(config.name); // prints 'My App'
  return {
    ...config,
  };
};
```

### Switching configuration based on the environment

It's common to have some different configuration in development, staging, and production environments, or to swap out configuration entirely in order to white label an app. To accomplish this, you can use **app.config.js** along with environment variables.

```js
module.exports = () => {
  if (process.env.MY_ENVIRONMENT === 'production') {
    return {
      /* your production config */
    };
  } else {
    return {
      /* your development config */
    };
  }
};
```

To use this configuration with Expo CLI commands, set the environment variable either for specific commands or in your shell profile. To set environment variables for specific commands, prefix the command with the variables and values, for example: `MY_ENVIRONMENT=production expo publish` (this is not anything unique to Expo CLI). On Windows you can approximate this with `npx cross-env MY_ENVIRONMENT=production expo publish`, or use whichever other mechanism that you are comfortable with for environment variables.

### Using TypeScript for configuration: app.config.ts instead of app.config.js

> ⚠️ This is experimental and subject to breaking changes.

You can use autocomplete and doc-blocks with a TypeScript config **app.config.ts**. Install the unversioned typings for Expo config with `yarn add -D @expo/config` and create an **app.config.ts** with the following contents:

```ts
// WARNING THIS ISN'T VERSIONED
import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'My App',
});
```

### Configuration Resolution Rules

There are two different types of configs: static (**app.config.json**, **app.json**), and dynamic (**app.config.js**, **app.config.ts**). Static configs can be automatically updated with CLI tools, whereas dynamic configs must be manually updated by the developer.

1. The static config is read if **app.config.json** exists (falls back to **app.json**). If no static config exists, then default values are inferred from the **package.json** and your dependencies.
2. The dynamic config is read if either **app.config.ts** or **app.config.js** exist. If both exist, then the TypeScript config is used.
3. If the dynamic config returns a function, then the static config is passed to the function with `({ config }) => ({})`. This function can then mutate the static config values.
4. The return value from the dynamic config is used as the final config. It cannot have any promises.
5. All functions in the config are evaluated and serialized before any tool in the Expo ecosystem uses it. The config must be a JSON manifest when it is hosted.
