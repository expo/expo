# babel-preset-expo

If you have problems with the code in this repository, please file issues & bug reports
at https://github.com/expo/expo. Thanks!

## Options

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
