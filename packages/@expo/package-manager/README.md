<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/package-manager</code>
</h1>

<!-- Header -->

<p align="center">
    <b>A library for installing and finding packages in a node project</b>
    <br/>
    <br/>
    <a aria-label="Circle CI" href="https://circleci.com/gh/expo/expo-cli/tree/main">
        <img alt="Circle CI" src="https://flat.badgen.net/circleci/github/expo/expo-cli?label=Circle%20CI&labelColor=555555&icon=circleci">
    </a>
</p>

---

<!-- Body -->

## 🏁 Setup

Install `@expo/package-manager` in your project.

```sh
yarn add @expo/package-manager
```

## ⚽️ Usage

```ts
import * as PackageManager from '@expo/package-manager';

const manager = await PackageManager.createForProject(projectRoot);

await Promise.all([
  manager.addDevAsync('@expo/webpack-config'),
  manager.addAsync('expo', 'expo-camera'),
]);
```

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.

<!-- Footer -->

---

<p>
    <a aria-label="sponsored by expo" href="http://expo.dev">
        <img src="https://img.shields.io/badge/SPONSORED%20BY%20EXPO-4630EB.svg?style=for-the-badge" target="_blank" />
    </a>
    <a aria-label="@expo/package-manager is free to use" href="/LICENSE" target="_blank">
        <img align="right" alt="License: MIT" src="https://img.shields.io/badge/License-MIT-success.svg?style=for-the-badge&color=33CC12" target="_blank" />
    </a>
</p>
