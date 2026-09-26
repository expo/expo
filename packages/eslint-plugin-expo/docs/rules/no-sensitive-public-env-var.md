# Prevents credentials from being stored in EXPO_PUBLIC_ environment variables (`expo/no-sensitive-public-env-var`)

Environment variables prefixed with `EXPO_PUBLIC_` are inlined into the JavaScript bundle at build time. Anyone with the app can read them, as the [environment variables guide](https://docs.expo.dev/guides/environment-variables/#security-considerations) says:

> Never store sensitive secrets in environment variables that are prefixed with `EXPO_PUBLIC_`. When an end-user runs your app, they have access to all of the code and embedded environment variables in your app.

Nothing enforces this today. The failure is quiet: the value inlines, the app works, and the credential ships inside the bundle.

## Rule Details

This rule reports `process.env.EXPO_PUBLIC_*` where the variable name suggests a credential rather than configuration.

Examples of **incorrect** code for this rule:

```js
const key = process.env.EXPO_PUBLIC_API_KEY;
const secret = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY;
const password = process.env.EXPO_PUBLIC_DB_PASSWORD;

fetch(url, {
  headers: { Authorization: process.env.EXPO_PUBLIC_AUTH_TOKEN },
});
```

Examples of **correct** code for this rule:

```js
const url = process.env.EXPO_PUBLIC_API_URL;
const enabled = process.env.EXPO_PUBLIC_ENABLE_BETA;

// Not prefixed with EXPO_PUBLIC_, so it is not inlined into the bundle
const secret = process.env.STRIPE_SECRET_KEY;
```

The name is split on `_` and each segment is checked, so `EXPO_PUBLIC_MONKEY` and `EXPO_PUBLIC_AUTHORITY` are not reported.

## Options

```json
{
  "expo/no-sensitive-public-env-var": [
    "error",
    {
      "allow": ["EXPO_PUBLIC_MAPS_KEY"],
      "additionalPatterns": ["TENANT_ID$"]
    }
  ]
}
```

- `allow` — variable names to exempt. Some keys really are meant to be public, for example a browser-restricted Google Maps key.
- `additionalPatterns` — extra regular expressions to treat as sensitive, for project specific naming.

## When Not To Use It

If you're not using Expo, or if you have decided every `EXPO_PUBLIC_` value in your project is safe to ship and would rather not annotate exceptions.

## Further Reading

- [Environment variables in Expo, security considerations](https://docs.expo.dev/guides/environment-variables/#security-considerations)
- [Storing sensitive info, React Native](https://reactnative.dev/docs/security#storing-sensitive-info)
