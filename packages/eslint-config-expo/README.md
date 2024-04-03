# eslint-config-expo

Base ESLint config for Expo projects. This is a minimal config that supports JSX and TypeScript, platform-specific global variables, and file extensions like `.android.js`, `.ios.js` and `.web.js`. You are intended to compose this base config with the linter rules of your choice in your own ESLint configuration.

## Installation

```sh
yarn add --dev eslint-config-expo
```

You will also need to install `eslint`:

```sh
yarn add --dev eslint
```

## Usage

Import this config into your own ESLint [configuration](https://eslint.org/docs/latest/use/configure/configuration-files) using the `extends` option. ESLint checks both `package.json` and `.eslintrc.*` files for its configuration:

### package.json
```js
{
  "eslintConfig": {
    "extends": ["expo", "eslint:recommended"]
  }
}
```

### .eslintrc.js
```js
module.exports = {
  extends: ["expo", "eslint:recommended"],
};
```
