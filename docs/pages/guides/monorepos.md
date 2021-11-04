---
title: Working with Monorepos
---

Monorepos, or _"monolithic repositories"_, are single repositories containing multiple apps or packages. It can help speed up development for larger projects, makes it easier to share code, and act as a single source of truth. This guide will set up a simple monorepo with an Expo project and highlight some critical but often overlooked aspects of monorepos.

> ⚠️ Monorepos are not for everyone. It requires in-depth knowledge of the used tooling, adds increased complexity, and often requires specific tooling configuration. You can get far with just a single repository.

## Before SDK 43

Setting up a monorepo was difficult before SDK 43. You had to implement your tooling or use [expo-yarn-workspaces](https://github.com/expo/expo/tree/master/packages/expo-yarn-workspaces). The yarn workspaces package symlinks all required dependencies back to the app **node_modules** folder. Although this works for most apps, it has some flaws. For example, it doesn't work well with multiple versions of the same package.

We made some significant changes with Expo SDK 43 to improve support for monorepos. [The auto linker in the newer Expo modules](https://blog.expo.dev/whats-new-in-expo-modules-infrastructure-7a7cdda81ebc) now also look for packages in parent node_modules folders. None of our native files inside our template contain hardcoded paths to packages.

## Example monorepo

In this example, we will set up a monorepo using yarn workspaces without the [nohoist](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/) option. We will assume some familiar names, but you can fully customize them. After this guide, our basic structure should look like this:

- **apps/** - Contains multiple projects, including Expo apps.
- **packages/** - Contains different packages used by our apps.
- **package.json** - Root package file, containing yarn workspaces config.

### Root package file

All yarn monorepos should have a "root" **package.json** file. It is used as the main configuration for our monorepo and may contain packages installed for all projects in the repository. You can run `yarn init`, or create the **package.json** manually. It should look something like this:

```JSON
{
  "name": "monorepo",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT"
}
```

### Set up yarn workspaces

Yarn and other tooling have a concept called _"workspaces"_. Every package and app in our repository has its own workspace. But, before we can use them, we have to instruct yarn where to find these workspaces. We can do that by setting the `workspaces` property using [glob patterns](https://classic.yarnpkg.com/lang/en/docs/workspaces/#toc-tips-tricks), in the **package.json**:

```JSON
{
  "name": "monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  ...
}
```

> ⚠️ Yarn workspaces require the root **package.json** to be private. If you don't set this, `yarn install` will error with a message mentioning this.

### Create our first app

Now that we have the basic monorepo structure set up let's add our first app. Before we can create our app, we have to create the **apps/** folder. This folder can contain all separate apps or websites that belong to this monorepo. Inside this **apps/** folder, we can create a subfolder that contains the actual Expo app. 

```
$ expo init apps/cool-app
```

> If you have an existing app, you can copy all those files inside a subfolder.

After copying or creating the first app, run `yarn install` to make sure our workspace is working.

### Create a package

Monorepos can help us group code in a single repository. That includes apps but also separate packages. They also don't need to be published. The [Expo repository](https://github.com/expo/expo) uses this as well. In our repo, all the Expo SDK packages live inside the [**packages/**](https://github.com/expo/expo/tree/master/packages) folder. It helps us test the code inside one of our [**apps/**](https://github.com/expo/expo/tree/master/apps/native-component-list) before we publish them.

Let's go back to the root and create the **package/** folder. This folder can contain all the separate packages that you want to make. Once you are inside this folder, we need to add a new subfolder. The subfolder is a separate package that we can use inside our app. In the example below, we named it **cool-package**.

```
$ mkdir -p packages/cool-package
$ cd packages/cool-package
$ yarn init
```

We won't go into too much detail in creating a package. If you are not familiar with this, please consider using a simple app without monorepos. But, to make the example complete, let's add an **index.js** file with the following content:

```js
export const greeting = 'Hello!';
```

### Using the package

Like standard packages, we need to add our **cool-package** as a dependency to our **cool-app**. The main difference between a standard package, and one from the monorepo, is you'll always want to use the _"current state of the package"_ instead of a version. Let's add **cool-package** to our app by adding `"cool-package": "*"` to our app **package.json** file:

```JSON
{
  "dependencies": {
    "cool-package": "*",
    ...
  },
  ...
}
```

> After you add the package as a dependency, run `yarn install` to ensure everything is working.

Now you should be able to use the package inside your app! To test this, let's edit the `App.js` in our app and render the `greeting` text from our **cool-package**.

```js
import { greeting } from 'cool-app';
...
export default function App() {
  return (
    <View style={styles.container}>
      <Text>{greeting}</Text>
      <StatusBar style="auto" />
    </View>
  );
}
...
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

**Android** ([source](https://github.com/expo/expo/blob/61cbd9a5092af319b44c319f7d51e4093210e81b/templates/expo-template-bare-minimum/android/app/build.gradle#L85)

```groovy
apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute().text.trim(), "../react.gradle")
```

**iOS** ([source](https://github.com/expo/expo/blob/61cbd9a5092af319b44c319f7d51e4093210e81b/templates/expo-template-bare-minimum/ios/Podfile#L2))

```objc
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")
```

In the snippets above, you can see that we use Node's own [`require.resolve()`](https://nodejs.org/api/modules.html#requireresolverequest-options) method to find the package location. We explicitly refer to `package.json` because we want to find the root location of the package, not the location of the entry point. And with that root location, we can resolve to the expected relative path within the package. [Learn more about these references here](https://github.com/expo/expo/blob/4633ab2364e30ea87ca2da968f3adaf5cdde9d8b/packages/expo-modules-core/README.md#importing-native-dependencies---autolinking).

All Expo SDK modules and templates, starting from SDK 43, have these dynamic references and work with monorepos. But, occasionally, you might run into packages that still use the hardcoded path. You can manually edit it with [patch-package](https://github.com/ds300/patch-package#readme) or mention this to the package maintainers.

