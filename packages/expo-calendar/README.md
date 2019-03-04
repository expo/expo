# expo-calendar

Provides an API for interacting with the device's system calendars, events, reminders, and associated records.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/calendar.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/calendar/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `@unimodules/core` package](https://github.com/unimodules/core) before continuing.

### Add the package to your npm dependencies

```
npm install expo-calendar
```

### Configure for iOS

Add the dependency to your `Podfile` and then run `pod install`.

```ruby
pod 'EXCalendar', path: '../node_modules/expo-calendar/ios'
```

### Configure for Android

1. Append the following lines to `android/settings.gradle`:

```gradle
include ':expo-calendar'
project(':expo-calendar').projectDir = new File(rootProject.projectDir, '../node_modules/expo-calendar/android')
```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
```gradle
api project(':expo-calendar')
```

3. In `MainApplication.java`, import the package and add it to the `ReactModuleRegistryProvider` list:
```java
import expo.modules.calendar.CalendarPackage;
```
```java
private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
  // Your other packages will be here
  new CalendarPackage()
), Arrays.<SingletonModule>asList());
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
