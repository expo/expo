# @expo/fingerprint

A library to generate a fingerprint from a React Native project

## Table of Contents

- [API Usage](#api-usage)
- [CLI Usage](#cli-usage)
- [Customizations](#customizations)
  - [**.fingerprintignore** file](#include-or-exclude-extra-files-to-ignored-paths-in-the-fingerprintignore-file)
  - [**fingerprint.config.js** file](#fingerprintconfigjs)
- [Limitations](#limitations)

## API Usage

```ts
import * as Fingerprint from '@expo/fingerprint';

await Fingerprint.createFingerprintAsync('/projectRoot');
```

### createFingerprintAsync

Create a fingerprint from project

```ts
function createFingerprintAsync(projectRoot: string, options?: Options): Promise<Fingerprint>;
```

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

### createProjectHashAsync

Create a native hash value from project

```ts
function createProjectHashAsync(projectRoot: string, options?: Options): Promise<string>;
```

Example:

```ts
const hash = await createProjectHashAsync('/app');
console.log(hash);
```

```json
bf8a3b08935f056270b1688333b02f1ef5fa25bf
```

### diffFingerprintChangesAsync

Diff the given `fingerprint` with the current project fingerprint state

```ts
function diffFingerprintChangesAsync(
  fingerprint: Fingerprint,
  projectRoot: string,
  options?: Options
): Promise<FingerprintSource[]>;
```

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
    "op": "removed",
    "source": {
      "type": "file",
      "filePath": "./assets/icon.png",
      "reasons": ["expoConfigExternalFile"],
      "hash": "3f71f5a8458c06b83424cc33e1f2481f601199ea"
    }
  },
  {
    "op": "added",
    "source": {
      "type": "dir",
      "filePath": "ios",
      "reasons": ["bareNativeDir"],
      "hash": "2420400e6140a4ccfc350fc483b26efdfc26ddac"
    }
  },
  {
    "op": "changed",
    "source": {
      "type": "contents",
      "id": "expoConfig",
      "contents": "{\"ios\":{\"bundleIdentifier\":\"com.test\",\"supportsTablet\":true},\"name\":\"test\",\"platforms\":[\"ios\"],\"slug\":\"test\"}",
      "reasons": ["expoConfig"],
      "hash": "dd2a3ebb872b097f9c1e33780fb8db8688848fa0"
    }
  }
]
```

### diffFingerprints

Find the diff between two fingerprints

```ts
function diffFingerprints(
  fingerprint1: Fingerprint,
  fingerprint2: Fingerprint
): FingerprintSource[];
```

## CLI Usage

### Generate a fingerprint for a given project

`npx @expo/fingerprint /path/to/projectRoot`

### Generate a fingerprint for a given project and write it to a file

`npx @expo/fingerprint /path/to/projectRoot > fingerprint.json`

### Compare a fingerprint with the current project state

`npx @expo/fingerprint /path/to/projectRoot fingerprint.json`

## Customizations

### Include or exclude extra files to ignored paths in the **.fingerprintignore** file

Our default ignore paths, found here [`DEFAULT_IGNORE_PATHS`](https://github.com/expo/expo/blob/main/packages/%40expo/fingerprint/src/Options.ts#L11), make hashing fast and keep hashing results stable. If the default setup does not fit your workflow, you can add a **.fingerprintignore** file in your project root. It works like [**.gitignore**](https://git-scm.com/docs/gitignore#_pattern_format) but with some slight differences: We use `minimatch` for pattern matching with the [limitations](https://github.com/expo/expo/blob/9b9133c96f209b0616d1796aadae28913f8d012f/packages/%40expo/fingerprint/src/Fingerprint.types.ts#L46-L55).

Here's how to use **.fingerprintignore**: To skip a whole folder but keep some files, you can do this:

```
# Ignore the entire /app/ios folder
/app/ios/**/*

# But still keep /app/ios/Podfile and /app/ios/Podfile.lock
!/app/ios/Podfile
!/app/ios/Podfile.lock
```

### **fingerprint.config.js**

You can customize the fingerprinting behavior by creating a **fingerprint.config.js** file in your project root. This file allows you to specify custom configurations, such as skipping certain fingerprint sources, adding extra fingerprint sources, or enabling debug mode.

Below is an example **fingerprint.config.js** configuration, assuming you have `@expo/fingerprint` installed as a direct dependency:

```js
/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'ExpoConfigRuntimeVersionIfString',
    'ExpoConfigVersions',
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
  ],
};
module.exports = config;
```

If you are using `@expo/fingerprint` through `expo` (where `@expo/fingerprint` is installed as a transitive dependency), you can import fingerprint from `expo/fingerprint`:

```js
/** @type {import('expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'ExpoConfigRuntimeVersionIfString',
    'ExpoConfigVersions',
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
  ],
};
module.exports = config;
```

For supported configurations, you can refer to the [source code](https://github.com/expo/expo/blob/main/packages/%40expo/fingerprint/src/Config.ts#L38-L45) and [`SourceSkips.ts`](https://github.com/expo/expo/blob/main/packages/%40expo/fingerprint/src/sourcer/SourceSkips.ts) for supported `SourceSkips`.

## Limitations

### Limited support for [config-plugins raw functions](https://docs.expo.dev/config-plugins/plugins-and-mods/#raw-functions)

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
