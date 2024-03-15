# eslint-plugin-expo

Eslint rules for Expo apps

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
    "expo/no-env-var-destructuring": 2,
    "expo/no-dynamic-env-var": 2,
  }
}
```


## Rules

| Name                                                               | Description                                          |
| :----------------------------------------------------------------- | :--------------------------------------------------- |
| [no-dynamic-env-var](docs/rules/noDynamicEnvVar.md)             | Prevents process.env from being accessed dynamically |
| [no-env-var-destructuring](docs/rules/noEnvVarDestructuring.md) | Disallow desctructuring of environment variables     |
