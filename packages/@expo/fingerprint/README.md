# @expo/fingerprint

A library to generate a fingerprint from a React Native project

## Usage

```ts
import * as Fingerprint from '@expo/fingerprint';

await Fingerprint.createFingerprintAsync('/projectRoot');
```

### `async function createFingerprintAsync(projectRoot: string, options?: Options): Promise<Fingerprint>`

Create a fingerprint from project

Example:

```ts
const fingerprint = await createFingerprintAsync('/app');
console.log(fingerprint);
```

```json
{
  "sources": [
    {
      "type": "file",
      "filePath": "app.json",
      "reasons": ["expoConfig"],
      "hash": "378083de0c6e6bb6caf8fb72df658b0b26fb29ef"
    },
    {
      "type": "file",
      "filePath": "eas.json",
      "reasons": ["easBuild"],
      "hash": "f723802b6ea916d1a6c4767b2299cc81ddb22eb4"
    },
    {
      "type": "dir",
      "filePath": "node_modules/expo",
      "reasons": ["expoAutolinkingIos", "expoAutolinkingAndroid", "bareRncliAutolinking"],
      "hash": "1faee4057fa943300905750b51c3b0cbf05f4b0d"
    }
  ],
  "hash": "bf8a3b08935f056270b1688333b02f1ef5fa25bf"
}
```

### `async function createProjectHashAsync(projectRoot: string, options?: Options): Promise<string>`

Create a native hash value from project

Example:

```ts
const hash = await createProjectHashAsync('/app');
console.log(hash);
```

```json
bf8a3b08935f056270b1688333b02f1ef5fa25bf
```

### `diffFingerprintChangesAsync(fingerprint: Fingerprint, projectRoot: string, options?: Options): Promise<FingerprintSource[]>`

Differentiate given `fingerprint` with the current project fingerprint state

Example:

```ts
const fingerprint = {
  sources: [
    {
      type: 'file',
      filePath: 'app.json',
      reasons: ['expoConfig'],
      hash: '378083de0c6e6bb6caf8fb72df658b0b26fb29ef',
    },
    {
      type: 'file',
      filePath: 'eas.json',
      reasons: ['easBuild'],
      hash: 'f723802b6ea916d1a6c4767b2299cc81ddb22eb4',
    },
    {
      type: 'dir',
      filePath: 'node_modules/expo',
      reasons: ['expoAutolinkingIos', 'expoAutolinkingAndroid', 'bareRncliAutolinking'],
      hash: '1faee4057fa943300905750b51c3b0cbf05f4b0d',
    },
  ],
  hash: 'bf8a3b08935f056270b1688333b02f1ef5fa25bf',
};
const result = await diffFingerprintChangesAsync(fingerprint, '/app');
console.log(result);
```

```json
[
  {
    "filePath": "ios",
    "hash": "e4190c0af9142fe4add4842777d9aec713213cd4",
    "reasons": ["bareNativeDir"],
    "type": "dir"
  },
  {
    "filePath": "app.json",
    "hash": "9ff1b51ca9b9435e8b849bcc82e3900d70f0feee",
    "reasons": ["expoConfig"],
    "type": "file"
  }
]
```

## CLI Usage

### Generate a fingerprint for a given project

`npx @expo/fingerprint /path/to/projectRoot`

### Generate a fingerprint for a given project and write it to a file

`npx @expo/fingerprint /path/to/projectRoot > fingerprint.json`

### Compare a fingerprint with the current project state

`npx @expo/fingerprint /path/to/projectRoot fingerprint.json`

## Limitations

## Limited support for [config-plugins raw functions](https://docs.expo.dev/config-plugins/plugins-and-mods/#raw-functions)

When using config-plugins with raw functions, it's essential to be aware of certain limitations, particularly in the context of fingerprinting. Expo makes its best effort to generate fingerprints for changes made through config-plugins; however, raw functions pose specific challenges. Raw functions are not serializable as fingerprints, which means they cannot be directly used for generating unique hashes.

To work around this limitation, Expo employs one of the following strategies to create serializable fingerprints for raw functions:

1. **Using `Function.name`**: Expo utilizes the `Function.name` property if available for named raw functions. This property provides a recognizable name for the function, which can be used as a fingerprint property.

2. **Using `withAnonymous`**: For anonymous raw functions without a `Function.name`, Expo resorts to using 'withAnonymous' as the fingerprint property. This is a generic identifier for anonymous functions.

Here's an example to illustrate these concepts:

```javascript
// In app.config.js
const { withInfoPlist } = require('expo/config-plugins');

const withMyPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSLocationWhenInUseUsageDescription = 'Allow $(PRODUCT_NAME) to use your location';
    return config;
  });
};

export default ({ config }) => {
  config.plugins ||= [];
  config.plugins.push(withMyPlugin);
  config.plugins.push((config) => config);
  return config;
};`
```

In this example, Expo will use ['withMyPlugin', 'withAnonymous'] as plugin properties for fingerprint hashing.

It's important to note that due to this design, if you make changes to the implementation of raw config-plugins functions, such as altering the Info.plist value within 'withMyPlugin', the fingerprint will still generate the same hash value. To ensure unique fingerprints when modifying config-plugins implementations, consider the following options:

- **Avoid Anonymous Functions**: Avoid using anonymous raw config-plugins functions. Instead, use named functions whenever possible, and ensure that their names remain consistent as long as the implementation changes.

- **Use Local config-plugins**: Alternatively, you can create local config-plugins as separate modules, each with its own export. This approach allows you to specify a different function name when making changes to the config-plugins implementations.

  Here's an example of using a local config-plugin:

  ```javascript
  // In ./plugins/withMyPlugin.js
  const { withInfoPlist } = require('expo/config-plugins');

  const withMyPlugin = (config) => {
    return withInfoPlist(config, (config) => {
      config.modResults.NSLocationWhenInUseUsageDescription =
        'Allow $(PRODUCT_NAME) to use your location';
      return config;
    });
  };

  module.exports = withMyPlugin;
  ```

  ```json
  // in app.json
  {
    "expo": {
      // ...
      "plugins": "./plugins/withMyPlugin"
    }
  }
  ```

By following these guidelines, you can effectively manage changes to config-plugins and ensure that fingerprinting remains consistent and reliable.
