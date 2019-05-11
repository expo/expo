# babel-preset-expo

If you have problems with the code in this repository, please file issues & bug reports
at https://github.com/expo/expo. Thanks!

## Options

### `web.allowCommonJS`

Enabling this will enable your project to run with CommonJS syntax (i.e.: `module.exports`). By enabling this you will also disable tree shaking and your bundle will be much larger than it could be. When CommonJS syntax is in

> Enabling `common.js` will eliminate this error: `TypeError: Cannot assign to read only property 'exports' of object '#<Object>'`

**default:** `false`

```js
[
    'babel-preset-expo',
    {
        web: { allowCommonJS: true }
    }
],
```
