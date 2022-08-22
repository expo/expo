---
title: Working with Monorepos
---

import { Terminal } from '~/ui/components/Snippet';
import { Collapsible } from '~/ui/components/Collapsible';

Monorepos, or _"monolithic repositories"_, are single repositories containing multiple apps or packages. It can help speed up development for larger projects, makes it easier to share code, and act as a single source of truth. This guide will set up a simple monorepo with an Expo project. We currently have first-class support for yarn workspaces. If you want to use another tool, make sure you know how to configure it.

> ⚠️ Monorepos are not for everyone. It requires in-depth knowledge of the used tooling, adds more complexity, and often requires specific tooling configuration. You can get far with just a single repository.

<Collapsible summary="Using SDK older than 43?">

Setting up a monorepo was difficult before SDK 43. You had to implement your tooling or use [expo-yarn-workspaces](https://github.com/expo/expo/tree/main/packages/expo-yarn-workspaces). The yarn workspaces package symlinks all required dependencies back to the app **node_modules** folder. Although this works for most apps, it has some flaws. For example, it doesn't work well with multiple versions of the same package.

We made some significant changes with Expo SDK 43 to improve support for monorepos. [The auto linker in the newer Expo modules](https://blog.expo.dev/whats-new-in-expo-modules-infrastructure-7a7cdda81ebc) now also look for packages in parent node_modules folders. None of our native files inside our template contain hardcoded paths to packages.

</Collapsible>

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

<Terminal cmd={["$ yarn create expo-app apps/cool-app"]} cmdCopy="yarn create expo-app apps/cool-app" />

> If you have an existing app, you can copy all those files inside a subfolder.

After copying or creating the first app, run `yarn` to check for common warnings.

#### Modify the Metro config

Metro doesn't come with monorepo support by default (yet). That's why we need to configure Metro and let it know where to find certain things. There are two main changes we need to make:

1. Make sure Metro is watching the full monorepo, not just **apps/cool-app**.
2. Tell Metro where it can resolve packages. They might be installed in **apps/cool-app/node_modules** or **node_modules**.
3. Force Metro to only resolve (sub)packages from the `nodeModulesPaths`.

We can configure that by creating a **metro.config.js** with the following content.

> Learn more about customizing Metro in [our guide](/guides/customizing-metro).

```js
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
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

<Collapsible summary="1. Why do we need to watch all files with the monorepo?">

This option enables the app to refresh or reload when you edit imported files outside the app folder. It's important for libraries within your monorepo that are imported into your app. Without this setting, you must manually reload your app and possibly clear the Metro cache to see the changed library files.

If your monorepo becomes really big, watching all files within the monorepo might be slow. If you want to speed that up, you can (dynamically) watch the relevant paths to minimize the watchers. E.g.

```js
const path = require('path');
const workspaceRoot = path.resolve(__dirname, '../..');

// If your monorepo tooling can give you a list of monorepo dependencies from a workspace,
// you can automate this instead of hardcoding the paths.
const appMonorepoPackages = ['ui', 'eslint-config'];
const appPackagesPaths = appMonorepoPackages.map(
  // Get the path of the package folder, not just the entry point.
  packageName => path.resolve(workspaceRoot, 'packages', packageName)
);

// 1. Watch the local app folder, and all related packages (limiting the watchers and speeding it up)
config.watchFolders = [__dirname, ...appPackagesPaths];
```

</Collapsible>

<Collapsible summary="2. Why do we need tell Metro how to resolve packages?">

This option is important to resolve libraries in the right **node_modules** folders. Monorepo tooling, like Yarn, usually creates two different **node_modules** folders which are used for a single workspace.

1. **apps/mobile/node_modules** - The "project" folder
2. **node_modules** - The "root" folder

Yarn uses the root folder to install packages that are used in multiple workspaces. If a workspace uses a different package version, it installs that different version in the project folder.

We have to tell Metro to look in these two folders. The order is important here because the project folder **node_modules** can contain specific versions we use for our app. When the package does not exist in the project folder, it should try the shared root folder.

</Collapsible>

<Collapsible summary="3. Why do we need to disable the hierarchical lookup?">

This option is important for certain edge cases of your monorepo, like multiple React versions. Let's say you have the following monorepo:

1. **apps/marketing** - A simple NextJS website to attract new users. (uses `react@17.x.x`)
2. **apps/mobile** - Your awesome Expo app. (uses `react@18.x.x`)
3. **apps/web** - Your awesome NextJS website. (uses `react@17.x.x`)

With monorepo tooling like Yarn, React is installed in two different **node_modules** folders.
1. **node_modules** - The root folder, contains `react@17.x.x`.
2. **apps/mobile/node_modules** - The Expo app's folder, contains `react@18.x.x`. 

Because React Native libraries, including Expo, usually don't add `react@18.x.x` as peer dependency, monorepo tooling like Yarn installs `expo` or a React Native library in the wrong folder.
It's unaware of the dependency of `react@18.x.x` and installs the package in the root **node_modules** folder.

1. **node_modules** - The root folder, contains `expo@...` and `react@17.x.x`.
2. **apps/mobile/node_modules** - The Expo app's folder, contains `react@18.x.x`. 

Unfortunately, whenever `expo` imports `react`, it would resolve `react@17.x.x` and not `react@18.x.x`. This causes "multiple React versions" errors in your app.

With the `disableHierarchicalLookup = true`, we can force Metro to only resolve folders from the `nodeModulesPaths = [...]` order we defined in #2.
This option is documented in [the Metro Resolution Algorithm documentation](https://github.com/facebook/metro/blob/b0c5aacecd102e52b61233211223345351f94fa0/docs/Resolution.md#resolution-algorithm), under step 5.

When we disable this hierarchical lookup, it should not matter where the React Native library is installed.
Whenever a library imports `react`, or any other library, Metro always resolves the library from the `nodeModulesPaths` we defined.
As long as the **apps/mobile/node_modules** path has the correct library version and is listed as the first `nodeModulesPaths` entry, we should always get the correct version of that library.

</Collapsible>

<br />

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


<Terminal cmd={[
  "# Create our new package folder",
  "mkdir -p packages/cool-package",
  "cd packages/cool-package",
  "",
  "# And create the new package",
  "yarn init"
]} cmdCopy="mkdir -p packages/cool-package && cd packages/cool-package && yarn init" />

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

