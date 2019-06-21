# babel-preset-expo

If you have problems with the code in this repository, please file issues & bug reports
at https://github.com/expo/expo. Thanks!

## Options

### [`lazy`](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy)

Changes Babel's compiled `import` statements to be lazily evaluated when their imported bindings are used for the first time.

This can improve the initial load time of your module because evaluating dependencies up front is sometimes entirely un-necessary. This is especially the case when implementing a library module.

The value of `lazy` has a few possible effects:

- `null` - [metro-react-native-babel-preset](https://github.com/facebook/metro/tree/master/packages/metro-react-native-babel-preset) will handle it. (Learn more about it here: https://github.com/facebook/metro/commit/23e3503dde5f914f3e642ef214f508d0a699851d)

- `false` - No lazy initialization of any imported module.

- `true` - Do not lazy-initialize local imports (e.g., `./foo`) and do not lazy-initialize certain Expo packages that have side effects, but lazy-init all other dependencies.

- `Array<string>` - [babel-plugin-transform-modules-commonjs](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy) will handle it.

- `(string) => boolean` - [babel-plugin-transform-modules-commonjs](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy) will handle it.

**default:** `null`

```js
[
    'babel-preset-expo',
    {
        lazy: true
    }
],
```

### `web.transformImportExport`

Enabling this option will allow your project to run with older JavaScript syntax (i.e. `module.exports`). This option will break tree shaking and increase your bundle size, but will eliminate the following error when `module.exports` is used:

> `TypeError: Cannot assign to read only property 'exports' of object '#<Object>'`

**default:** `false`

```js
[
    'babel-preset-expo',
    {
        web: { transformImportExport: true }
    }
],
```
