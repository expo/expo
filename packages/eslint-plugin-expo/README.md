# eslint-plugin-expo

ESLint rules for Expo apps

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npx expo install eslint --save-dev
```

Next, install `eslint-plugin-expo`:

```sh
npx expo install eslint-plugin-expo --save-dev
```

## Usage

Add `expo` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": [
    "expo"
  ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "expo/no-env-var-destructuring": "error",
    "expo/no-dynamic-env-var": "error",
    "expo/use-dom-exports": "error",
    "expo/prefer-box-shadow": "warn",
  }
}
```


## Rules

| Name                                                               | Description                                          |
| :----------------------------------------------------------------- | :--------------------------------------------------- |
| [no-dynamic-env-var](docs/rules/no-dynamic-env-var.md)             | Prevents process.env from being accessed dynamically |
| [no-env-var-destructuring](docs/rules/no-env-var-destructuring.md) | Disallow destructuring of environment variables     |
| [use-dom-exports](docs/rules/use-dom-exports.md)                   | Enforce using DOM exports from react-native-web |
| [prefer-box-shadow](docs/rules/prefer-box-shadow.md)               | Suggest using box-shadow instead of shadowColor/shadowOffset/shadowOpacity/shadowRadius |
