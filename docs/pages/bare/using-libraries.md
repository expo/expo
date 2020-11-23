---
title: Using Libraries
---

import PlatformsSection from '~/components/plugins/PlatformsSection';
import InstallSection from '~/components/plugins/InstallSection';

Every app is made up of some combination of React Native, Expo SDK, and third party libraries. It's important to understand how to use the libraries from each of these sources, and how to determine whether a third-party library will work in your project or not.

If you are using the bare workflow, read the [guide for using libraries in the bare workflow](../bare/using-libraries.md) instead of this page.

## Using React Native Core Libraries

React Native provides a set of built-in primitives that most developers will need in their app. These include components such as ActivityIndicator, TextInput, Text, ScrollView, and View. These are listed in the [Core Components and APIs](https://reactnative.dev/docs/components-and-apis) page of the React Native documentation.

To use a React Native library in your project, import it from the `react-native` package in your code:

```js
import * as React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, paddingTop: 100 }}>
      <Text>Hello, world!</Text>
    </View>
  );
}
```

## Using Expo SDK Libraries

> 💡 If you initialized your app using @react-native-community/cli and you don't have `react-native-unimodules` installed in it yet, please refer to the guide for [using the Expo SDK in existing apps](../bare/existing-apps.md).

The Expo SDK picks up where the React Native core libraries end - it provides access to a lot of useful device and system functionality like audio, barcode scanning, camera, calendar, contacts, video, and so on. It also adds other powerful libraries like over-the-air updates, maps, OAuth authentication tools, and more.

To use a library from the Expo SDK, find the one you are looking for in the [API Reference](https://docs.expo.io/versions/latest/) or through the documentation Search bar.

At the top of the page you will see a description of the library and a platform compatibility table. It tells you which platforms and environments the library is compatible with. It looks like this:

<PlatformsSection android emulator ios simulator web />

After the platform compatibility table, there will be an Installation section, with instructions that look like this:

<InstallSection packageName="expo-device" hideBareInstructions />

<br />

The `expo install` command will pick a version of the library that is compatible with your project and then use your JavaScript package manager (such as npm) to install it.

Next, under the API section the reference page will tell you how to import the library in your code:

```js
import * as Device from 'expo-device';
```

This section also lists all of the types, functions, and classes available. If you use TypeScript, you can see this information in your TypeScript-compatible code editor (such as Visual Studio Code) with autocompletion.

Now you can use the library in your project:

```js
import * as React from 'react';
import { Text, View } from 'react-native';
import * as Device from 'expo-device';

export default function App() {
  return (
    <View style={{ flex: 1, paddingTop: 100 }}>
      <Text>
        {Device.manufacturer}: {Device.modelName}
      </Text>
    </View>
  );
}
```

## Using Third-Party Libraries

### Finding Third-Party Libraries

[React Native Directory](https://reactnative.directory) is a searchable database of libraries built specifically for React Native. If the library that you are looking for is not provided by React Native or Expo then this is the best place to look first when trying to find a library for your app.

After React Native Directory, the [npm registry](https://www.npmjs.com/) is the next best place. The npm registry is the definitive source for JavaScript libraries, but the libraries that it lists may not all be compatible with React Native. React Native is one of many JavaScript programming environments, including Node.js, web browsers, Electron, and more, and npm includes libraries that work for all of these environments.

Usually libraries built specifically for other platforms will not work with React Native. Examples include `react-select` which is built for the web and specifically targets `react-dom`, and `rimraf` which is built for Node.js and interacts with your computer file system. Other libraries like `lodash` use only JavaScript langauge features and work in any environment.

### Determining Third-Party Library Compatibility

Is it built specifically for Node.js, the web, electron, or another platform? If so, it may not work here. You can go ahead and try it in a new project to be sure! Run `expo init --template bare-minimum` and add the library to the new project and try to use it. This is a great way to experiment with a library before including it in your project in all circumstances.

### Installing a Third-Party Library

Once you have determined if the library is compatible, use your preferred package manager to install it:

```bash
npm install @react-navigation/native
```

Be sure to follow the project website or README for any additional configuration and usage instructions. You can get to the README quickly using this command:

```bash
npx npm-home @react-navigation/native
```
