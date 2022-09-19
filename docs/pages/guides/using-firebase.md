---
title: Using Firebase
---

import { Terminal } from '~/ui/components/Snippet';
import { BoxLink } from '~/ui/components/BoxLink';

[Firebase](https://firebase.google.com/) is a Backend-as-a-Service (BaaS) app development platform that provides hosted backend services such as realtime database, cloud storage, authentication, crash reporting, analytics, and so on. It is built on Google's infrastructure and scales automatically.

There are two different ways you can use Firebase in your projects:

- Using [Firebase JS SDK](#using-firebase-js-sdk)
- Using [React Native Firebase](#react-native-firebase)

React Native supports both the native SDK and the JS SDK. The following sections will guide you through when to use which SDK and all configuration steps required to use Firebase in your Expo projects.

## Create a Firebase project

Before proceeding, make sure you have created a Firebase app using the [Firebase console](https://console.firebase.google.com/).

## Using Firebase JS SDK

[Firebase JS SDK](https://firebase.google.com/docs/web/setup) is a JavaScript library that allows you to interact with Firebase services in your project. It supports services such as [Authentication](https://firebase.google.com/docs/auth), [Firestore](https://firebase.google.com/docs/firestore), [Realtime Database](https://firebase.google.com/docs/database) and [Storage](https://firebase.google.com/docs/storage) in a React Native app.

### When to use Firebase JS SDK

You can consider using Firebase JS SDK:

- Use Firebase services such as Authentication, Firestore, Realtime Database, and Storage in your app and develop your app with [**Expo Go**](/workflow/expo-go/).
- Want an easy setup and quickly get started with Firebase services.
- Want to create a universal app for Android, iOS, and the web.

#### Caveats

Firebase JS SDK does not support all services for mobile apps. Some of these services are Dynamic Links and Crashlytics. See the [React Native Firebase](#react-native-firebase) section if you want to use these services.

### Install and initialize Firebase JS SDK

> The following sub-sections use `firebase@9.x.x`. As of SDK 43, the Expo SDK no longer enforces or recommends any specific version of Firebase to use in your app.
>
> If you are using an older version of the firebase library in your project, you may have to adapt the code examples to match the version that you are using with the help of the [Firebase JS SDK documentation](https://github.com/firebase/firebase-js-sdk).

#### Step 1: Install the SDK

After you have created your [Expo project](/get-started/create-a-new-app/), you can install the Firebase JS SDK using the following command:

<Terminal cmd={["$ npx expo install firebase"]} />

#### Step 2: Initialize the SDK in your project

To initialize the Firebase instance in your Expo project, you must create a config object and pass it to the `initializeApp()` method imported from the `firebase/app` module.

The config object requires an API key and other unique identifiers. To obtain these values, you must register a new web app in your Firebase console. You can find these instructions in the [Firebase documentation](https://firebase.google.com/docs/web/setup#register-app).

After you have the API key and other identifiers, you can paste the following code snippet by creating a new **firebaseConfig.js** file in your project's root folder or any other folder where you keep the configuration files.

```js
import { initializeApp } from 'firebase/app';

// Optionally import the services that you want to use
//import {...} from "firebase/auth";
//import {...} from "firebase/database";
//import {...} from "firebase/firestore";
//import {...} from "firebase/functions";
//import {...} from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'api-key',
  authDomain: 'project-id.firebaseapp.com',
  databaseURL: 'https://project-id.firebaseio.com',
  projectId: 'project-id',
  storageBucket: 'project-id.appspot.com',
  messagingSenderId: 'sender-id',
  appId: 'app-id',
  measurementId: 'G-measurement-id',
};

const app = initializeApp(firebaseConfig);

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
```

You do not have to install other plugins or configurations to use Firebase JS SDK.

Firebase version 9 provides a modular API. You can directly import any service you want to use from the `firebase` package. For example, if you want to use an authentication service in your project, you can import the `auth` module from the `firebase/auth` package.

#### Step 3: Configure Metro

Expo CLI uses [Metro](https://facebook.github.io/metro/) to bundle your JavaScript code and assets, and add support for more file extensions.

If you are using Firebase version `9.7.x` and above, you need to add the following configuration to a **metro.config.js** file to make sure that the Firebase JS SDK is bundled correctly.

Start by generating the template file **metro.config.js** in your project's root folder using the following command:

<Terminal cmd={["$ npx expo customize metro.config.js"]} />

Then, update the file with the following configuration:

```js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push('cjs');

module.exports = defaultConfig;
```

For more information, see [Customizing Metro](/guides/customizing-metro/).

### Authentication

Firebase JS SDK provides the `firebase/auth` module to authenticate users in your app. You can use it to authenticate users differently using Firebase services such as email and password, and phone number sign-in. Firebase also provides sign-in providers such as Google, Facebook, Twitter, GitHub, and so on.

<BoxLink title="Getting started with auth module" description="Learn how to initialize use Authentication from Firebase." href="https://firebase.google.com/docs/auth/web/start" />

#### Phone authentication

To use [phone authentication](https://firebase.google.com/docs/auth/web/phone-auth) with Firebase JS SDK, you'll to use [`expo-firebase-recaptcha`](/versions/latest/sdk/firebase-recaptcha/) module. It provides a reCAPTCHA widget which is necessary to verify that the app user trying to sign in is not a bot.

- To install the `expo-firebase-recaptcha` module, see the [installation instructions](/versions/latest/sdk/firebase-recaptcha/#installation).
- To learn more on how to use `expo-firebase-recaptcha`, see [basic usage](/versions/latest/sdk/firebase-recaptcha/#basic-usage).
- For a complete working example, see [Phone authentication example](/versions/latest/sdk/firebase-recaptcha/#phone-authentication-example).

### Analytics

To use and record Google analytics events for Firebase, use the `expo-firebase-analytics` module. For more information, see [Firebase Analytics](/versions/latest/sdk/firebase-analytics/).

> **Expo Go relies on a JavaScript-based implementation of Firebase Analytics** to log events. This means that certain native life-cycle events are not recorded in the standard client. For more information, see [Expo Go: Limitations & configuration](/versions/latest/sdk/firebase-analytics/#expo-go-limitations--configuration) in `expo-firebase-analytics`.

<BoxLink title="Analytics - recommended events" description="For more information on getting started with events using Firebase analytics, see Log events ." href="https://firebase.google.com/docs/analytics/events?platform=web" />

### Next

<BoxLink title="Firestore" description="For more information on how to use Firestore database in your project, see Firebase documentation." href="https://firebase.google.com/docs/firestore/quickstart" />

<BoxLink title="Realtime Database" description="For more information on how to use Realtime Database in your project, see Firebase documentation." href="https://firebase.google.com/docs/database" />

<BoxLink title="Storage" description="For more information on how to use Storage, see Firebase documentation." href="https://firebase.google.com/docs/storage/web/start" />

<BoxLink title="Firebase Storage example" description="Learn how to use Firebase Storage in an Expo project with our example." href="https://github.com/expo/examples/tree/master/with-firebase-storage-upload" />

<BoxLink title="Managing API keys for Firebase projects" description="For more information about managing API Key and unique identifiers in a Firebase project." href="https://firebase.google.com/docs/projects/api-keys" />

## Using React Native Firebase

[React Native Firebase](https://rnfirebase.io/) provides access to native code by wrapping the native SDKs for Android and iOS into a JavaScript API. Each Firebase service is available as a module that can be added as a dependency to your project. For example, the `auth` module provides access to the Firebase Authentication service.

### When to use React Native Firebase

You can consider using React Native Firebase:

- Your app requires access to Firebase services that are not supported by the Firebase JS SDK, such as [Dynamic Links](https://rnfirebase.io/dynamic-links/usage), [Crashlytics](https://rnfirebase.io/crashlytics/usage) and so on. For more information, see [React Native Firebase documentation](https://rnfirebase.io/faqs-and-tips#why-react-native-firebase-over-firebase-js-sdk).
- Want to use native SDKs in your app.
- You have a bare React Native app with React Native Firebase already configured but are migrating to use Expo SDK.
- Want to add [Performance Monitoring](https://rnfirebase.io/perf/usage) into your app.

#### Caveats

React Native Firebase requires [custom native code and cannot be used with Expo Go](/workflow/expo-go/#custom-native-code).

### Install and initialize React Native Firebase

#### Step 1: Install expo-dev-client

Since React Native Firebase requires custom native code and it cannot be used with Expo Go, you need to install `expo-dev-client` in your project. The development client allows you to create a custom Expo Go app that is completely configured for your project. It also allows configuring any native code required by React Native Firebase using [Config plugins](/guides/config-plugins/) without writing native code yourself.

To install `expo-dev-client`, run the following command in your project:

<Terminal cmd={["$ npx expo install expo-dev-client"]} />

For more information, see [Getting started with `expo-dev-client`](/development/getting-started/#installing--expo-dev-client--in-your-project).

#### Step 2: Install React Native Firebase

To use React Native Firebase, it is necessary to install the `@react-native-firebase/app` module. This module provides the core functionality for all other modules. You can install it using the following command:

<Terminal cmd={["$ npx expo install @react-native-firebase/app"]} />

#### Step 3: Add a config plugin

The `@react-native-firebase/app` require customizing native code in your project. It provides a [config plugin](https://docs.expo.dev/guides/config-plugins/#quick-facts) that you can add to your project.

Add `@react-native-firebase/app` as a config plugin to the [`plugins`](/guides/config-plugins/#using-a-plugin-in-your-app) array in **app.json** or **app.config.js**:

```js
{
  "plugins": [
      "@react-native-firebase/app",
    ]
}
```

#### Step 4: Provide google services configuration

React Native Firebase requires **google-services.json** for Android and **GoogleService-Info.plist** for iOS to configure your project. These files contain credentials such as API key and other unique identifiers of your Firebase project.

You can get these credentials from the Firebase console. For Android and iOS, you will have to create two new apps from **Firebase console > Project Settings > General > Your apps**. During this process, the Firebase console will provide them as files. Download and save them at the root of your project.

After downloading them, provide paths for these files in **app.json** or **app.config.js** as shown in the example below:

```js
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

#### Step 5: Alter CocoaPods to use frameworks (iOS only)

For iOS, React Native Firebase requires [altering CocoaPods to use frameworks](https://rnfirebase.io/#altering-cocoapods-to-use-frameworks). The [`expo-build-properties`](/versions/latest/sdk/build-properties/) plugin allows you to override the default native build properties and configure to use frameworks.

Start by installing the `expo-build-properties` plugin:

<Terminal cmd={["$ npx expo install expo-build-properties"]} />

Then, update the config plugin array in **app.json** or **app.config.js**:

```js
{
  "plugins": [
      "@react-native-firebase/app",
      [
         "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
}
```

#### Step 6: Run the project

If you are using **[EAS Build](/build/introduction/), you can create and install a development build** on your devices. You do not need to run the project locally before creating the development build. For more information on creating a development build, see [Getting Started with Development builds](/development/getting-started/#creating-and-installing-your-first-development-build).

To run the project locally:

- You need Android Studio, and Xcode installed and configured on your computer.
- Then, you can run the project using `npx expo run:android` or `npx expo run:ios` command.

If a particular React Native Firebase module requires custom native configuration steps, you must add it as a `plugin` to **app.json** or **app.config.js**. Then, to run the project locally, you will have to run the `npx expo prebuild --clean` command to apply the native changes before the `npx expo run` commands.

### Analytics

**For SDK 46 and above**, to use and record Google analytics events for Firebase, use [`expo-firebase-analytics`](/versions/latest/sdk/firebase-analytics/) since it is compatible with `@react-native-firebase/app` module.

**For SDK 45 and below**, use the [`@react-native-firebase/analytics`](https://rnfirebase.io/analytics/usage) module provided by React Native Firebase library.

### Next

After configuring React Native Firebase, you can use any of the modules it provides.

<BoxLink title="React Native Firebase documentation" description="For more information to install and use a certain module from React Native Firebase, we recommend you to check their documentation." href="https://rnfirebase.io/" />
