# eslint-config-expo

Base ESLint config for Expo projects.

## Installation

```sh
yarn add --dev eslint-config-expo
```

You will also need to install `eslint`:

```sh
yarn add --dev eslint
```

## Usage

Import this config into your own ESLint configuration using the `extends` option. ESLint checks both `package.json` and `.eslintrc.*` files for its configuration:

### package.json
```js
{
  "eslintConfig": {
    "extends": "expo"
  }
}
```

### .eslintrc.js
```js
module.exports = {
  extends: 'expo',
};
```
