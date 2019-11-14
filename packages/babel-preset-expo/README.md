# babel-preset-expo

This preset extends the default React Native preset (`metro-react-native-babel-preset`) and adds support for decorators, tree-shaking web packages, and loading font icons with optional native dependencies if they're installed.

You can use this preset in any React Native project as a drop-in replacement for `metro-react-native-babel-preset`. If your project isn't using native font loading or web support then this preset will only add support for decorators with `@babel/plugin-proposal-decorators` - this is mostly used for supporting legacy community libraries.

If you start your **web** project with `@expo/webpack-config` or `expo start:web` and your project doesn't contain a `babel.config.js` or a `.babelrc` then it will default to using `babel-preset-expo` for loading.

If you have problems with the code in this repository, please file issues & bug reports
at https://github.com/expo/expo. Thanks!

## Options

### [`lazyImports`](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy)

Changes Babel's compiled `import` statements to be lazily evaluated when their imported bindings are used for the first time.

_Note:_ this option has an effect only when the `disableImportExportTransform` option is set to `false`. On Android and iOS, `disableImportExportTransform` defaults to `false`, and on web it defaults to `true` to allow for tree shaking.

This can improve the initial load time of your app because evaluating dependencies up front is sometimes entirely un-necessary, particularly when the dependencies have no side effects.

The value of `lazyImports` has a few possible effects:

- `null` - [metro-react-native-babel-preset](https://github.com/facebook/metro/tree/master/packages/metro-react-native-babel-preset) will handle it. (Learn more about it here: https://github.com/facebook/metro/commit/23e3503dde5f914f3e642ef214f508d0a699851d)

- `false` - No lazy initialization of any imported module.

- `true` - Lazy-init all imported modules except local imports (e.g., `./foo`), certain Expo packages that have side effects, and the two cases mentioned [here](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy).

- `Array<string>` - [babel-plugin-transform-modules-commonjs](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy) will handle it.

- `(string) => boolean` - [babel-plugin-transform-modules-commonjs](https://babeljs.io/docs/en/babel-plugin-transform-modules-commonjs#lazy) will handle it.

  If you choose to do this, you can also access the list of Expo packages that have side effects by using `const lazyImportsBlacklist = require('babel-preset-expo/lazy-imports-blacklist');` which returns a `Set`.

**default:** `null`

```js
[
    'babel-preset-expo',
    {
        lazyImports: true
    }
],
```

### `web.disableImportExportTransform`

Enabling this option will allow your project to run with older JavaScript syntax (i.e. `module.exports`). This option will break tree shaking and increase your bundle size, but will eliminate the following error when `module.exports` is used:

> `TypeError: Cannot assign to read only property 'exports' of object '#<Object>'`

**default:** `false`

```js
[
    'babel-preset-expo',
    {
        web: { disableImportExportTransform: true }
    }
],
```
