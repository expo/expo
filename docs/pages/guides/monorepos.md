---
title: Working with Monorepos
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

Monorepos, or _"monolithic repositories"_, are single repositories containing multiple apps or packages. It can help speed up development for larger projects, makes it easier to share code, and act as a single source of truth. This guide will set up a simple monorepo with an Expo project. We currently have first-class support for yarn workspaces. If you want to use another tool, make sure you know how to configure it.

> ⚠️ Monorepos are not for everyone. It requires in-depth knowledge of the used tooling, adds more complexity, and often requires specific tooling configuration. You can get far with just a single repository.

<details><summary>Using SDK older than 43?</summary>

Setting up a monorepo was difficult before SDK 43. You had to implement your tooling or use [expo-yarn-workspaces](https://github.com/expo/expo/tree/main/packages/expo-yarn-workspaces). The yarn workspaces package symlinks all required dependencies back to the app **node_modules** folder. Although this works for most apps, it has some flaws. For example, it doesn't work well with multiple versions of the same package.

We made some significant changes with Expo SDK 43 to improve support for monorepos. [The auto linker in the newer Expo modules](https://blog.expo.dev/whats-new-in-expo-modules-infrastructure-7a7cdda81ebc) now also look for packages in parent node_modules folders. None of our native files inside our template contain hardcoded paths to packages.

</details>

## Example monorepo

In this example, we will set up a monorepo using yarn workspaces without the [nohoist](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/) option. We will assume some familiar names, but you can fully customize them. After this guide, our basic structure should look like this:

- **apps/** - Contains multiple projects, including Expo apps.
- **packages/** - Contains different packages used by our apps.
- **package.json** - Root package file, containing yarn workspaces config.

### Root package file

All yarn monorepos should have a "root" **package.json** file. It is the main configuration for our monorepo and may contain packages installed for all projects in the repository. You can run `yarn init`, or create the **package.json** manually. It should look something like this:

```json
{
  "name": "monorepo",
  "version": "1.0.0"
}
```

### Set up yarn workspaces

Yarn and other tooling have a concept called _"workspaces"_. Every package and app in our repository has its own workspace. But, before we can use them, we have to instruct yarn where to find these workspaces. We can do that by setting the `workspaces` property using [glob patterns](https://classic.yarnpkg.com/lang/en/docs/workspaces/#toc-tips-tricks), in the **package.json**:

```json
{
  "private": true,
  "name": "monorepo",
  "version": "1.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

> ⚠️ Yarn workspaces require the root **package.json** to be private. If you don't set this, `yarn install` will error with a message mentioning this.

### Create our first app

Now that we have the basic monorepo structure set up, let's add our first app. Before we can create our app, we have to create the **apps/** folder. This folder can contain all separate apps or websites that belong to this monorepo. Inside this **apps/** folder, we can create a subfolder that contains the actual Expo app. 

<TerminalBlock cmd={["expo init apps/cool-app"]} />

> If you have an existing app, you can copy all those files inside a subfolder.

After copying or creating the first app, run `yarn install` to check for common warnings.

#### Modify the Metro config

Metro doesn't come with monorepo support by default (yet). That's why we need to configure Metro and let it know where to find certain things. There are two main changes we need to make:

1. Make sure Metro is watching the full monorepo, not just **app/cool-app**.
2. Tell Metro where it can resolve packages. They might be installed in **app/cool-app/node_modules** or **node_modules**.

We can configure that by creating a **metro.config.js** with the following content.

```js
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the workspace root, this can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages, and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

#### Change default entrypoint

In monorepos, we can't hardcode paths to packages anymore. We can't be sure if they are installed in the root **node_modules** or the workspace **node_modules** folder. If you are using a managed project, we have to change our default entrypoint `node_modules/expo/AppEntry.js`.

Open our app's **package.json**, change the `main` property to `index.js`, and create this new **index.js** file in the app directory with the content below.

```js
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
```

> 💡 This new entrypoint already exists for bare projects. You only need to add this if you have a managed project.

### Create a package

Monorepos can help us group code in a single repository. That includes apps but also separate packages. They also don't need to be published. The [Expo repository](https://github.com/expo/expo) uses this as well. All the Expo SDK packages live inside the [**packages/**](https://github.com/expo/expo/tree/main/packages) folder in our repo. It helps us test the code inside one of our [**apps/**](https://github.com/expo/expo/tree/main/apps/native-component-list) before we publish them.

Let's go back to the root and create the **packages/** folder. This folder can contain all the separate packages that you want to make. Once you are inside this folder, we need to add a new subfolder. The subfolder is a separate package that we can use inside our app. In the example below, we named it **cool-package**.


<TerminalBlock cmd={[
  "# Create our new package folder",
  "mkdir -p packages/cool-package",
  "cd packages/cool-package",
  "",
  "# And create the new package",
  "yarn init"
]} />

We won't go into too much detail in creating a package. If you are not familiar with this, please consider using a simple app without monorepos. But, to make the example complete, let's add an **index.js** file with the following content:

```js
export const greeting = 'Hello!';
```

### Using the package

Like standard packages, we need to add our **cool-package** as a dependency to our **cool-app**. The main difference between a standard package, and one from the monorepo, is you'll always want to use the _"current state of the package"_ instead of a version. Let's add **cool-package** to our app by adding `"cool-package": "*"` to our app **package.json** file:

```json
{
  "name": "cool-app",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "eject": "expo eject"
  },
  "dependencies": {
    "cool-package": "*",
    "expo": "~43.0.2",
    "expo-status-bar": "~1.1.0",
    "react": "17.0.1",
    "react-dom": "17.0.1",
    "react-native": "0.64.3",
    "react-native-web": "0.17.1"
  },
  "devDependencies": {
    "@babel/core": "^7.12.9"
  }
}
```

> After adding the package as a dependency, run `yarn install` to install or link the dependency to your app.

Now you should be able to use the package inside your app! To test this, let's edit the `App.js` in our app and render the `greeting` text from our **cool-package**.

```js
import { greeting } from 'cool-package';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{greeting}</Text>
      <StatusBar style="auto" />
    </View>
  );
}
```

## Common issues

As mentioned earlier, using monorepos is not for everyone. You take on increased complexity and need to solve issues you most likely will run into. Here are a couple of common issues you might encounter.

### Script '...' does not exist

React Native uses packages to ship both JavaScript and native files. These files also need to be linked, like the [**react-native/react.Gradle**](https://github.com/facebook/react-native/blob/main/react.gradle) file from **android/app/build.Gradle**. Usually, this path is hardcoded to something like:

**Android** ([source](https://github.com/facebook/react-native/blob/e918362be3cb03ae9dee3b8d50a240c599f6723f/template/android/app/build.gradle#L84))

```groovy
apply from: "../../node_modules/react-native/react.gradle"
```

**iOS** ([source](https://github.com/facebook/react-native/blob/e918362be3cb03ae9dee3b8d50a240c599f6723f/template/ios/Podfile#L1))

```objc
require_relative '../node_modules/react-native/scripts/react_native_pods'
```

Unfortunately, this path can be different in monorepos because of [hoisting](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/). It also doesn't use the [Node module resolution](https://nodejs.org/api/modules.html#all-together). You can avoid this issue by using Node to find the location of the package instead of hardcoding this:

**Android** ([source](https://github.com/expo/expo/blob/6877c1f5cdca62b395b0d5f49d87f2f3dbb50bec/templates/expo-template-bare-minimum/android/app/build.gradle#L87)

```groovy
apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim(), "../react.gradle")
```

**iOS** ([source](https://github.com/expo/expo/blob/61cbd9a5092af319b44c319f7d51e4093210e81b/templates/expo-template-bare-minimum/ios/Podfile#L2))

```objc
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
```

In the snippets above, you can see that we use Node's own [`require.resolve()`](https://nodejs.org/api/modules.html#requireresolverequest-options) method to find the package location. We explicitly refer to `package.json` because we want to find the root location of the package, not the location of the entry point. And with that root location, we can resolve to the expected relative path within the package. [Learn more about these references here](https://github.com/expo/expo/blob/4633ab2364e30ea87ca2da968f3adaf5cdde9d8b/packages/expo-modules-core/README.md#importing-native-dependencies---autolinking).

All Expo SDK modules and templates, starting from SDK 43, have these dynamic references and work with monorepos. But, occasionally, you might run into packages that still use the hardcoded path. You can manually edit it with [patch-package](https://github.com/ds300/patch-package#readme) or mention this to the package maintainers.

