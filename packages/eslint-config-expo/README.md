# eslint-config-expo

Base ESLint config for Expo projects. This is a minimal config that supports JSX and TypeScript, platform-specific global variables, and file extensions like `.android.js`, `.ios.js` and `.web.js`. You are intended to compose this base config with the linter rules of your choice in your own ESLint configuration.

## Installation

```sh
yarn add --dev eslint-config-expo
```

You will also need to install `eslint@9` or higher (from v9 onwards, this library uses [flat config](https://eslint.org/blog/2022/08/new-config-system-part-2/); see the [migration guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)):

```sh
yarn add --dev eslint
```

## Usage

Import this config into your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), e.g. `eslint.config.js` and spread it into the config array:

```js
// eslint.config.js
const expoConfig = require("eslint-config-expo");

module.exports = [
  ...expoConfig,
  // your other config
];
```
