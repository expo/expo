# babel-plugin-react-native-web

[![npm version][package-badge]][package-url] [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

A Babel plugin that will alias `react-native` to `react-native-web` and exclude
any modules not required by your app (keeping bundle size down).

## Installation

```
yarn add --dev babel-plugin-react-native-web
```

## Usage

**.babelrc**

```
{
  "plugins": [
    ["react-native-web", { commonjs: true }]
  ]
}
```

You should configure the plugin to match the module format used by your
bundler. Most modern bundlers will use a package's ES modules by default (i.e.,
if `package.json` has a `module` field). But if you need the plugin to rewrite
import paths to point to CommonJS modules, you must set the `commonjs` option
to `true`.

## Example

NOTE: `react-native-web` internal paths are _not stable_ and you must not rely
on them. Always use the Babel plugin to optimize your build. What follows is an
example of the rewrite performed by the plugin.

**Before**

```js
import { StyleSheet, View } from 'react-native';
```

**After**

```js
import StyleSheet from 'react-native-web/dist/exports/StyleSheet';
import View from 'react-native-web/dist/exports/View';
```

[package-badge]: https://img.shields.io/npm/v/babel-plugin-react-native-web.svg?style=flat
[package-url]: https://yarnpkg.com/en/package/babel-plugin-react-native-web
