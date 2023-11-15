<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/babel-preset-cli</code>
</h1>

<p align="center">A Babel preset used across Expo CLI packages.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/babel-preset-cli">

  <a href="https://www.npmjs.com/package/@expo/babel-preset-cli">
    <img src="https://flat.badgen.net/npm/dw/@expo/babel-preset-cli" target="_blank" />
  </a>
</p>

<!-- Body -->

## 🏁 Setup

Install `@expo/babel-preset-cli` in your project.

```sh
yarn add @expo/babel-preset-cli
```

## ⚽️ Usage

```js babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['@expo/babel-preset-cli'],
  };
};
```
