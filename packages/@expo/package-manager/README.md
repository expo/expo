<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/package-manager</code>
</h1>

<p align="center">A library for installing and finding packages in a project.</p>

<!-- Header -->

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/@expo/package-manager">

  <a href="https://www.npmjs.com/package/@expo/package-manager">
    <img src="https://flat.badgen.net/npm/dw/@expo/package-manager" target="_blank" />
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

const manager = PackageManager.createForProject(projectRoot);

await Promise.all([
  manager.addDevAsync(['@expo/webpack-config']),
  manager.addAsync(['expo', 'expo-camera']),
]);
```
