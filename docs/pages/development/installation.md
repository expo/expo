---
title: Installation in React Native and Bare workflow projects
sidebar_title: Bare React Native Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';
import { Tab, Tabs } from '~/components/plugins/Tabs';
import { Terminal } from '~/ui/components/Snippet';

> Note: These docs assume a basic level of familiarity with React-Native. If you are new to React-Native, please see the [React-Native docs](https://reactnative.dev/docs/getting-started).

The installation steps on this page are only required to add the `expo-dev-client` library to a React Native or bare project. To add the `expo-dev-client` library to an existing managed project, see our [Getting Started guide](getting-started.md).


If you're just starting your project, you can run the following command to create a new project with Expo modules pre-installed: 

<Terminal cmd={["$ npx crna -y myapp"]} />

<!-- TODO: Get this to work when you run `eas build` -->
<!-- If you're just starting your project, you can run the following command to create a new project from our template and then [skip to building](/development/getting-started.md#creating-and-installing-your-first-development-build):

<Terminal cmd={["$ npx crna -t with-dev-client"]} /> -->

## 1. Installation

If you don't already have `expo` listed as a dependency in your `package.json`, go ahead and **[install Expo modules](../bare/installing-expo-modules)**. Expo modules (`expo`) allows you to seamlessly install any library from the Expo SDK. 

Now, let's go ahead and install `expo-dev-client`.

<InstallSection packageName="expo-development-client" cmd={["# Navigate to your new app", "cd myapp", "", "# Install expo-dev-client", "expo install expo-dev-client"]} hideBareInstructions />

### 🍏 iOS

<Tabs tabs={["Expo SDK 45+", "Expo SDK <= 44"]}>

<Tab >

Make sure that your project is configured to deploy on an iOS version of _at least 12_.
To do that, open Xcode and go to General > Deployment Info, and select an iOS version of at least 12.0.

<img src="/static/images/client/check_ios_version.png" style={{maxWidth: "100%" }}/>

</Tab >

<Tab >

Add the following lines to your **Podfile**:

<ConfigurationDiff source="/static/diffs/client/podfile.diff" />

Run the following command to install native code for the Dev Launcher via CocoaPods.

<InstallSection packageName="expo-development-client" cmd={["npx pod-install"]} hideBareInstructions />

Also, make sure that your project is configured to deploy on an iOS version of _at least 12_.
To do that, open Xcode and go to General > Deployment Info, and select an iOS version of at least 12.0.

<img src="/static/images/client/check_ios_version.png" style={{maxWidth: "100%" }}/>

</Tab >

</Tabs >

### 🤖 Android

No additional changes are needed to install the package on Android. 🎉

## 2. Basic configuration

Development builds use deep links to open projects via a QR code. If you have added a custom deep link scheme to your project, your development build will use it. However, if this isn't the case, you need to configure deep link support for your app. The `uri-scheme` package will do this for you, once you have chosen a scheme. 

A scheme simply tells your device's operating system which app to open based on the part of a URL preceeding the colon. For example, in `exp://192.168.4.54:19000`, `exp` is the scheme and your device will leave it to Expo Go (the app matching the `exp` scheme) to interpret `192.168.4.54:19000`, assuming everything is properly configured.

If you haven't already done so, make up your own scheme and run the following command to configure deep link support for your app.

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

See the [uri-scheme package](https://www.npmjs.com/package/uri-scheme) for more information.

### 🍏 iOS

<Tabs tabs={["Expo SDK 45+", "Expo SDK <= 44"]}>

<Tab >

No additional changes are needed to configure the package on iOS. 🎉

</Tab >

<Tab >

Make the following changes to allow the `expo-dev-client` library to control project initialization in the **DEBUG** mode.

<ConfigurationDiff source="/static/diffs/client/app-delegate-expo-modules.diff" />
</Tab>

</Tabs>

### 🤖 Android

<Tabs tabs={["Expo SDK 45+", "Expo SDK <= 44"]}>

<Tab >

No additional changes are needed to configure the package on Android. 🎉

</Tab >

<Tab >

Make the following changes to allow the `expo-dev-client` library to control project initialization in the **DEBUG** mode.

<ConfigurationDiff source="/static/diffs/client/main-activity-and-application-expo-modules.diff" />
</Tab>

</Tabs>

## 3. Optional configuration

There are a few more changes you can make to get the best experience, if you prefer.

### Add better error handlers

Sometimes, for certain types of errors, we can provide more helpful error messages than the ones that ship by default with React Native. To turn this feature on, you need to import `expo-dev-client` in the entry point of your app (in the managed workflow, you need to add this import at the top of your **App.{js|tsx}**). Make sure that the import statement is above `import App from './App'`.

```js
import 'expo-dev-client';
...
import App from "./App";
```

> Note: This will only affect the application in which you make this change. If you want to load multiple projects from a single development app, you'll need to add this import statement to each project.

### Disable packager autostart when building for iOS

When you start your project on iOS, the metro bundler will be started automatically. This behavior might not be ideal when you want to use `expo start`. Our recommended solution is to remove the `Start Packager` action from building scripts. To do that you need to open the Xcode, go to "Build Phases" and remove the "Start Packager" action.

<img src="/static/images/client/remove_start_packager.png" style={{maxWidth: "100%" }}/>

### Loading published updates

Development builds can also open and preview published updates to your app. To add this feature to your existing project, [add `expo-updates` to your app](../bare/installing-updates.md), if it isn't already installed. Otherwise, if you are working from a template, you won't need to make any changes beyond the following commands:

<InstallSection packageName="expo-updates" cmd={["expo install expo-updates", "npx pod-install"]} hideBareInstructions />

## 4. Build and Install

You're now ready to [build your first development build](/development/getting-started.md#creating-and-installing-your-first-development-build).
