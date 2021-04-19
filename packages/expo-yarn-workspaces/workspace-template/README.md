# Expo Yarn Workspaces Example

<p>
  <!-- iOS -->
  <a href="https://itunes.apple.com/app/apple-store/id982107779">
    <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
  </a>
  <!-- Android -->
  <a href="https://play.google.com/store/apps/details?id=host.exp.exponent&referrer=blankexample">
    <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
  </a>
  <!-- Web -->
  <a href="https://docs.expo.io/workflow/web/">
    <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-4630EB.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
  </a>
</p>

Demonstrates the use of `expo-yarn-workspaces` with Expo.
This example installs a monorepo with two applications, both using two separate custom packages.

## 🚀 How to use

- Create a new monorepo with `npx create-react-native-app --template with-yarn-workspaces`.
  - Packages will be automatically installed via the `postinstall` script in `package.json`
- Run `yarn first-app` or `yarn second-app` to start one of the apps.

### 📁 File Structure

```
├── apps
│   ├── first-app
│   │   ├── App.tsx ➡️ Entry Point for first application
│   │   ├── package.json ➡️ contains configuration required by expo-yarn-workspaces
│   │   ├── metro.config.js ➡️ required by expo-yarn-workspaces
│   └── second-app
│       ├── App.tsx ➡️ Entry Point for second application
│       ├── package.json ➡️ contains configuration required by expo-yarn-workspaces
│       └── metro.config.js ➡️ required by expo-yarn-workspaces
├── packages
│   ├── first-package
│   │   ├── index.js ➡️ exports first package message which is imported and displayed in both applications
│   └── second-package
│       └── index.js ➡️ exports second package message which is imported and displayed in both applications
├── package.json ➡️ contains the `postinstall` script and scripts with yarn commands to run applications
└── babel.config.js ➡️ Babel config (should be using `babel-preset-expo`)
```

## 📝 Notes

- [expo-yarn-workspaces](https://github.com/expo/expo/tree/master/packages/expo-yarn-workspaces)