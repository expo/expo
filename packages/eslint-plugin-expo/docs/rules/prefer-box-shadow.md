# Prefer box-shadow over old shadow props (`expo/prefer-box-shadow`)

React Native now supports a new web-like `boxShadow` API that provides a more consistent and powerful way to add shadows to components. This rule encourages the use of the new `boxShadow` property instead of the legacy shadow properties.

## Rule Details

This rule aims to promote the use of the modern `boxShadow` API over the older shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`).

**Note:** `boxShadow` is a new web-like API, only available on the New Architecture. Outset shadows are only supported on Android 9+. Inset shadows are only supported on Android 10+.

Examples of **incorrect** code for this rule:

```js
const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

Examples of **correct** code for this rule:

```js
const styles = StyleSheet.create({
  container: {
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
});
```

## When Not To Use It

- If you're not using the New Architecture
- If you need to support Android versions below 9 (for outset shadows)
- If you need to support Android versions below 10 (for inset shadows)
- If you need to maintain backward compatibility with older React Native versions

## Further Reading

- [React Native View Style Props - boxShadow](https://reactnative.dev/docs/view-style-props#boxshadow)
