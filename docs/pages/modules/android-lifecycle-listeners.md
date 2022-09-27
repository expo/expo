---
title: Android Lifecycle Listeners
---

import { Callout } from '~/ui/components/Callout';
import { Tab, Tabs } from '~/components/plugins/Tabs';

<Callout type="warning">Expo Modules APIs are in beta and subject to breaking changes.</Callout>
<br />

In order to respond to certain Android system events relevant to an app, such as inbound links and configuration changes, it is necessary to override the corresponding lifecycle callbacks in **MainActivity.java** and/or **MainApplication.java**.

The React Native module API does not provide any mechanism to hook into these, and so setup instructions for React Native libraries often include steps to copy code into these files. To simplify and automate setup and maintenance, the Expo Modules API provides a mechanism that allows your library to hook into `Activity` or `Application` functions.

## Get Started

First, you need to have created an Expo module or integrated the Expo modules API in library using the React Native module API. [Learn more](./overview.md#setup)

Inside of your module, create a concrete class that implements the [`Package`](https://github.com/expo/expo/tree/main/packages/expo-modules-core/android/src/main/java/expo/modules/core/interfaces/Package.java) interface. For most cases, you only need to implement the `createReactActivityLifecycleListeners` or `createApplicationLifecycleListeners` methods.

## `Activity` Lifecycle Listeners

You can hook into the `Activity` lifecycle using `ReactActivityLifecycleListener`. `ReactActivityLifecycleListener` hooks into React Native's `ReactActivity` lifecycles using its `ReactActivityDelegate` and provides a similar experience to Android `Activity` lifecycles.

The following `Activity` lifecycle callbacks are currently supported:

- `onCreate`
- `onResume`
- `onPause`
- `onDestrory`
- `onNewIntent`
- `onBackPressed`

To create a `ReactActivityLifecycleListener`, you should implement `createReactActivityLifecycleListeners` in your derived `Package` class, e.g. `MyLibPackage`.

<Tabs tabs={["Kotlin", "Java"]}>

<Tab>

```kotlin
// android/src/main/java/expo/modules/mylib/MyLibPackage.kt
package expo.modules.mylib

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class MyLibPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(MyLibReactActivityLifecycleListener())
  }
}
```

</Tab>

<Tab>

```java
// android/src/main/java/expo/modules/mylib/MyLibPackage.java
package expo.modules.mylib;

import android.content.Context;
import expo.modules.core.interfaces.Package;
import expo.modules.core.interfaces.ReactActivityLifecycleListener;

import java.util.Collections;
import java.util.List;

public class MyLibPackage implements Package {
  @Override
  public List<? extends ReactActivityLifecycleListener> createReactActivityLifecycleListeners(Context activityContext) {
    return Collections.singletonList(new MyLibReactActivityLifecycleListener());
  }
}
```

</Tab>

</Tabs>

`MyLibReactActivityLifecycleListener` is a `ReactActivityLifecycleListener` derived class that you can hook into the lifecycles. You can only override the methods you need.

<Tabs tabs={["Kotlin", "Java"]}>

<Tab>

```kotlin
// android/src/main/java/expo/modules/mylib/MyLibReactActivityLifecycleListener.kt
package expo.modules.mylib

import android.app.Activity
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class MyLibReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Your setup code in `Activity.onCreate`.
    doSomeSetupInActivityOnCreate(activity)
  }
}
```

</Tab>

<Tab>

```java
// android/src/main/java/expo/modules/mylib/MyLibReactActivityLifecycleListener.java
package expo.modules.mylib;

import android.app.Activity;
import android.os.Bundle;

import expo.modules.core.interfaces.ReactActivityLifecycleListener;

public class MyLibReactActivityLifecycleListener implements ReactActivityLifecycleListener {
  @Override
  public void onCreate(Activity activity, Bundle savedInstanceState) {
    // Your setup code in `Activity.onCreate`.
    doSomeSetupInActivityOnCreate(activity);
  }
}
```

</Tab>

</Tabs>

## `Application` Lifecycle Listeners

You can hook into the `Application` lifecycle using `ApplicationLifecycleListener`.

The following `Application` lifecycle callbacks are currently supported:

- `onCreate`
- `onConfigurationChanged`

To create a `ApplicationLifecycleListener`, you should implement `createApplicationLifecycleListeners` in your derived `Package` class, e.g. `MyLibPackage`.

<Tabs tabs={["Kotlin", "Java"]}>

<Tab>

```kotlin
// android/src/main/java/expo/modules/mylib/MyLibPackage.kt
package expo.modules.mylib

import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

class MyLibPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context): List<ApplicationLifecycleListener> {
    return listOf(MyLibApplicationLifecycleListener())
  }
}
```

</Tab>

<Tab>

```java
// android/src/main/java/expo/modules/mylib/MyLibPackage.java
import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.interfaces.ApplicationLifecycleListener;
import expo.modules.core.interfaces.Package;

public class MyLibPackage implements Package {
  @Override
  public List<? extends ApplicationLifecycleListener> createApplicationLifecycleListeners(Context context) {
    return Collections.singletonList(new MyLibApplicationLifecycleListener());
  }
}
```

</Tab>

</Tabs>

`MyLibApplicationLifecycleListener` is an `ApplicationLifecycleListener` derived class that can hook into the `Application` lifecycle callbacks. You should only override the methods you need ([due to possible maintenance costs](#interface-stability)).

<Tabs tabs={["Kotlin", "Java"]}>

<Tab>

```kotlin
// android/src/main/java/expo/modules/mylib/MyLibApplicationLifecycleListener.kt
package expo.modules.mylib

import android.app.Application
import expo.modules.core.interfaces.ApplicationLifecycleListener

class MyLibApplicationLifecycleListener : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    // Your setup code in `Application.onCreate`.
    doSomeSetupInApplicationOnCreate(application)
  }
}
```

</Tab>

<Tab>

```java
// android/src/main/java/expo/modules/mylib/MyLibApplicationLifecycleListener.java
package expo.modules.mylib;

import android.app.Application;

import expo.modules.core.interfaces.ApplicationLifecycleListener;

public class MyLibApplicationLifecycleListener implements ApplicationLifecycleListener {
  @Override
  public void onCreate(Application application) {
    // Your setup code in `Application.onCreate`.
    doSomeSetupInApplicationOnCreate(application);
  }
}
```

</Tab>

</Tabs>

## Known Issues

### Why there are no `onStart` and `onStop` Activity listeners

In the current implementation, we do not set up the hooks from `MainActivity` but from [`ReactActivityDelegate`](https://github.com/facebook/react-native/blob/400902093aa3ccfc05712a996c592a86f342253a/ReactAndroid/src/main/java/com/facebook/react/ReactActivityDelegate.java). There are some slight differences between `MainActivity` and `ReactActivityDelegate`. Since `ReactActivityDelegate` does not have `onStart` and `onStop`, we don't yet support them here.

### Interface stability

The listener interfaces may change from time to time between Expo SDK releases. Our strategy for backward compatibility is always to add new interfaces and add `@Deprecated` annotation for interfaces we plan to remove. Our interfaces are all based on Java 8 interface default method; you don't have to and should not implement all methods. Doing this will benefit your module's maintenance cost between Expo SDKs.
