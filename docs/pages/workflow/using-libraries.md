---
title: Using libraries
---

import { ConfigReactNative } from '~/components/plugins/ConfigSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import InstallSection from '~/components/plugins/InstallSection';
import { BoxLink } from '~/ui/components/BoxLink';
import { Terminal } from '~/ui/components/Snippet';
import SnackInline from '~/components/plugins/SnackInline';

Every app is inevitably going to use a third-party library, so it's important to understand how to determine whether a library is compatible with your project.

## Using React Native Core Libraries

React Native provides a set of built-in primitives that most developers will need in their app. These include components such as ActivityIndicator, TextInput, Text, ScrollView, and View. These are listed in the [Core Components and APIs](https://reactnative.dev/docs/components-and-apis) page of the React Native documentation. We also list the React Native Core Components and APIs in the [API Reference](/versions/latest/) section of the Expo documentation, so you can quickly see the documentation relevant to the SDK version that your app uses in the same place as you would find it for Expo SDK libraries. You can see the React Native version that corresponds to your Expo SDK version in the table on the [API Reference index](/versions/latest/).

To use a React Native component or API in your project, import it from the `react-native` package in your code:

<SnackInline>

```jsx
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

</SnackInline>

## Using Expo SDK Libraries

The Expo SDK picks up where the React Native core libraries end - it provides access to a lot of useful device and system functionality like audio, barcode scanning, camera, calendar, contacts, video, and so on. It also adds other powerful libraries like updates, maps, OAuth authentication tools, and more. For details on how we decide what goes into the Expo SDK, [read here](https://expo.fyi/whats-in-the-sdk).

To use a library from the Expo SDK, find the one you are looking for in the [API Reference](/versions/latest/) or through the documentation Search bar.

<ConfigReactNative>

If you initialized your app using `npx react-native init` and you don't have the `expo` package installed in it yet, refer to the [installing Expo modules guide](/bare/installing-expo-modules).

</ConfigReactNative>

At the top of the page you will see a description of the library and a platform compatibility table. It tells you which platforms and environments the library is compatible with. It looks like this:

<PlatformsSection android emulator ios simulator web />

After the platform compatibility table, there will be an Installation section, with instructions that look like this:

<InstallSection packageName="expo-device" hideBareInstructions />

The `npx expo install` command will pick a version of the library that is compatible with your project and then use your JavaScript package manager (such as npm) to install it.

Next, under the API section the reference page will tell you how to import the library in your code:

```js
import * as Device from 'expo-device';
```

This section also lists all of the types, functions, and classes available. If you use TypeScript, you can see this information in your TypeScript-compatible code editor (such as Visual Studio Code) with autocompletion.

Now you can use the library in your project:

<SnackInline dependencies={['expo-device']}>

```jsx
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

</SnackInline>

## Using Third-Party Libraries

### Finding Third-Party Libraries

[React Native Directory](https://reactnative.directory) is a searchable database of libraries built specifically for React Native. If the library that you are looking for is not provided by React Native or the Expo SDK then this is the best place to look first when trying to find a library for your app.

After React Native Directory, the [npm registry](https://www.npmjs.com/) is the next best place. The npm registry is the definitive source for JavaScript libraries, but the libraries that it lists may not all be compatible with React Native. React Native is one of many JavaScript programming environments, including Node.js, web browsers, Electron, and more, and npm includes libraries that work for all of these environments. Other libraries may be compatible with React Native, but not compatible with the [Expo Go][expo-go] app. How do you figure this out?

### Determining Third-Party Library Compatibility

**Check React Native Directory**: find the library on the website (if it's there) and verify that it has a "✔️ Expo Go" tag. You can also enable the [filter by Expo Go](https://reactnative.directory/?expo=true).

**Not listed on the directory?** find the project on GitHub, an easy way to do this is with `npx npm-home --github <package-name>`. For example, to open the GitHub page for `react-native-localize` you would run:

<Terminal cmd={['$ npx npm-home --github react-native-localize']} />

Now check the following:

- Does it include an `ios` and/or `android/` directory?
- Does the README mention linking?
- Is it built specifically for Node.js, the web, electron, or another platform?

If you answered yes to any of these questions and the library is not part of the Expo SDK, this library may not be supported in [Expo Go][expo-go]. You can go ahead and try it in a new project to be sure! Run `npx create-expo-app` and add the library to the new project and try to use it. This is a great way to experiment with a library before including it in your project in all circumstances.

Many React Native libraries are not compatible with [Expo Go][expo-go]. For these libraries, you can create a [development build](/development/introduction):

<BoxLink title="Adding custom native code" description="Learn how to create a development build." href="/workflow/customizing" />

> If you want some help determining library compatibility, [please create an issue on the React Native Directory repository](https://github.com/react-native-community/directory/issues/new/choose) and let us know. This will not just help you, it will help to ensure that other developers have an easy answer in the future!

### Installing a Third-Party Library

> We recommend always using `npx expo install` instead of `npm install` or `yarn add` directly because it allows [Expo CLI][expo-cli] to pick a compatible version of a library when possible and also warn you about known incompatibilities.

Once you have determined if the library is compatible with React Native, use [Expo CLI][expo-cli] to install the package:

<Terminal cmd={['$ npx expo install @react-navigation/native']} />

Be sure to follow the project website or README for any additional configuration and usage instructions. You can get to the README quickly using this command:

<Terminal cmd={['$ npx npm-home @react-navigation/native']} />

If the module needs additional native configuration, you can do so using [config plugins](/guides/config-plugins). Some packages require a config plugin but they don't have one yet, you can refer to the list of [out-of-tree config plugins](https://github.com/expo/config-plugins/).

<ConfigReactNative>

If your project does not support [Expo Prebuild](/workflow/prebuild) then you won't be able to use [config plugins](/guides/config-plugins). You can either [adopt Expo Prebuild](/guides/adopting-prebuild) or setup and configure each library manually by following any additional setup guides from the respective module's website or README.

</ConfigReactNative>

If the module is not supported in [Expo Go][expo-go], you can create a [development build](/development/introduction):

<BoxLink title="Adding custom native code" description="Learn how to create a development build." href="/workflow/customizing" />

[expo-cli]: /workflow/expo-cli
[expo-go]: https://expo.dev/expo-go
