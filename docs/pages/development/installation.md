---
title: Installation in React Native and Bare workflow projects
sidebar_title: Bare React Native Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import { DiffBlock } from '~/ui/components/Snippet';
import { Tab, Tabs } from '~/components/plugins/Tabs';
import { Terminal } from '~/ui/components/Snippet';

The installation steps on this page are only required to add the `expo-dev-client` library to a React Native or Bare project. To add the `expo-dev-client` library to an existing managed project, see our [Getting Started guide](getting-started.md).

If you're just starting your project, you can create a new project from our template with:

<Terminal cmd={["$ npx crna -t with-dev-client"]} />

If you have an existing project, you'll need to [install the package and make a few changes](installation.md) to your **AppDelegate.m**, **MainActivity.java** and **MainApplication.java**.

If you created your project with `expo init` or `create-expo-app`, or you already have `expo` and/or other Expo modules up and running, use the tabs marked **With Expo modules**.

If you created your project with `expo init` or `create-expo-app` before SDK 43 and have `react-native-unimodules` up and running, use the tabs marked **With unimodules**. When you're ready, consider upgrading to the newer Expo modules by [following these steps](https://expo.fyi/expo-modules-migration).

If you created your project with `npx react-native init` and do not have any other Expo packages installed, **starting from version `0.8.0` you'll need to [install Expo modules](../bare/installing-expo-modules)** in order to use `expo-dev-client`.

> **Note**: if you are using _SDK 43 or above_, you'll need to install `expo-dev-client@0.6.0` or above.

## 1. Installation

Add the `expo-dev-client` library to your package.json.

<InstallSection packageName="expo-development-client" cmd={["npm install expo-dev-client"]} hideBareInstructions />

### iOS

<Tabs tabs={["SDK 45+", "SDK below 45"]}>

<Tab >

Make sure that your project is configured to deploy on an iOS version _above 10_.
To do that, open Xcode and go to General > Deployment Info, and select an iOS version of at least 11.0.

<img src="/static/images/client/check_ios_version.png" style={{maxWidth: "100%" }}/>

</Tab >

<Tab >

Add the following lines to your **Podfile**:

<DiffBlock source="/static/diffs/client/podfile.diff" />

Run the following command to install native code for the Dev Launcher via CocoaPods.

<InstallSection packageName="expo-development-client" cmd={["npx pod-install"]} hideBareInstructions />

Also, make sure that your project is configured to deploy on an iOS version _above 10_.
To do that, open Xcode and go to General > Deployment Info, and select an iOS version of at least 11.0.

<img src="/static/images/client/check_ios_version.png" style={{maxWidth: "100%" }}/>

</Tab >

</Tabs >

### Android

No additional changes are needed to install the package on Android.

## 2. Basic configuration

Development builds use deep links to open projects from the QR code. If you have added a custom deep link scheme to your project, your development build will use it. However, if this isn't the case, you need to configure the deep link support for your app. The `uri-scheme` package will do this for you once you have chosen a scheme.

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

See the [uri-scheme package](https://www.npmjs.com/package/uri-scheme) for more information.

### iOS

<Tabs tabs={["SDK 45+/expo-modules-core@0.9.1+", "With Expo modules", "With unimodules"]}>

<Tab >

No additional changes are needed to configure the package on iOS.

</Tab >

<Tab >

Make the following changes to allow the `expo-dev-client` library to control project initialization in the **DEBUG** mode.

<DiffBlock source="/static/diffs/client/app-delegate-expo-modules.diff" />
</Tab>

<Tab >

Make the following changes to allow the `expo-dev-client` library to control project initialization in the **DEBUG** mode.

<DiffBlock source="/static/diffs/client/app-delegate.diff" />
</Tab>

</Tabs>

### Android

<Tabs tabs={["SDK 45+/expo-modules-core@0.9.1+", "With Expo modules", "With unimodules"]}>

<Tab >

No additional changes are needed to configure the package on Android.

</Tab >

<Tab >

Make the following changes to allow the `expo-dev-client` library to control project initialization in the **DEBUG** mode.

<DiffBlock source="/static/diffs/client/main-activity-and-application-expo-modules.diff" />
</Tab>

<Tab >

Make the following changes to allow the `expo-dev-client` library to control project initialization in the **DEBUG** mode.

<DiffBlock source="/static/diffs/client/main-activity-and-application.diff" />
</Tab>

</Tabs>

## 3. Optional configuration

There are a few more changes you can make to get the best experience, but you [can skip ahead to building](/development/getting-started/#building-and-installing-your-first-development-build) if you prefer.

### Enable development with Expo CLI

Expo CLI requires you to have the `expo` package installed so it can maintain consistent behavior in your project when new versions of the Expo SDK are released. The package will not be used directly by your project unless you import it in your application code, which is not recommended.

<InstallSection packageName="expo" cmd={["npm install expo --save-dev"]} hideBareInstructions />

### Disable packager autostart when building for iOS

When you start your project on iOS, the metro bundler will be started automatically. This behavior might not be ideal when you want to use `npx expo start`. Our recommended solution is to remove the `Start Packager` action from building scripts. To do that you need to open the Xcode, go to "Build Phases" and remove the "Start Packager" action.

<img src="/static/images/client/remove_start_packager.png" style={{maxWidth: "100%" }}/>

### Add better error handlers

Sometimes, for certain types of errors, we can provide more helpful error messages than the ones that ship by default with React Native. To turn this feature on you need to import `expo-dev-client` in your **index** file (in the managed workflow, you need to add this import on top of the **App.&lbrace;js|tsx&rbrace;**). Make sure that the import statement is above `import App from './App'`.

```js
import 'expo-dev-client';
...
import App from "./App";
```

> Note: This will only affect the application in which you make this change. If you want to load multiple projects from a single development app, you'll need to add this import statement to each project.

### Loading published updates

Development builds can also open and preview published updates to your app. To add this feature, add `expo-updates@0.8.0` or newer to your app if it isn't already installed, and add a small additional integration in your **AppDelegate.m** and **MainApplication.java** files.

1. [Install `expo-modules` in your project](../bare/installing-expo-modules.md).
2. [Install `expo-updates` in your project](../bare/installing-updates.md).
3. Make the following changes to complete the integration with `expo-updates`:

<DiffBlock source="/static/diffs/client/app-delegate-updates.diff" />

<DiffBlock source="/static/diffs/client/main-application-updates.diff" />

## 4. Build and Install

You're now ready to [build your first development build](/development/getting-started.md#creating-and-installing-your-first-development-build).
