# Disallow desctructuring of environment variables (`expo/no-env-var-destructuring`)

Expo's Metro config injects build settings that can be used in the client bundle via environment variables. The environment variables (`process.env.*`) are replaced with the appropriate values at build time. This means that `process.env` is not a standard JavaScript object, and destructuring will break inlining on environment variables.

## Rule Details

This rule aims to prevent users from encountering errors due to destructuring environment variables.

Examples of **incorrect** code for this rule:

```js

const { MY_VAR } = process.env;

```

Examples of **correct** code for this rule:

```js

const myVar = process.env.MY_VAR;

```

## When Not To Use It

If you're not using Expo.

## Further Reading

- [Metro environment settings](https://docs.expo.dev/versions/latest/config/metro/#environment-settings)
