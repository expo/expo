# expo-localization

`expo-localization` enables you to interface with the native device locale.

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-localization` or `yarn add expo-localization`

#### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXLocalization', path: '../node_modules/expo-localization/ios'
```

and if not already included

```ruby
pod 'EXCore', path: '../node_modules/expo-core/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-localization'
    project(':expo-localization').projectDir = new File(rootProject.projectDir, '../node_modules/expo-localization/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-localization')
    ```
    and if not already included
    ```gradle
    api project(':expo-core')
    ```

Some Unimodules are not included in the default `ExpoKit` suite, these modules will needed to be added manually.
If your Android build cannot find the Native Modules, you can add them like this:

`./android/app/src/main/java/host/exp/exponent/MainActivity.java`

```java
@Override
public List<Package> expoPackages() {
  // Here you can add your own packages.
  return Arrays.<Package>asList(
    new LocalizationPackage() // Include this.
  );
}
```

## Usage

```javascript
import React from 'react';
import { Text } from 'react-native';
import { Localization } from 'expo-localization';
import i18n from 'i18n-js';
const en = {
  foo: 'Foo',
  bar: 'Bar {{someValue}}',
};
const fr = {
  foo: 'como telle fous',
  bar: 'chatouiller {{someValue}}',
};

i18n.fallbacks = true;
i18n.translations = { fr, en };
i18n.locale = Localization.locale;
export default class LitView extends React.Component {
  render() {
    return (
      <Text>
        {i18n.t('foo')} {i18n.t('bar', { someValue: Date.now() })}
      </Text>
    );
  }
}
```

## API

### Constants

This API is mostly synchronous and driven by constants. On iOS the constants will always be correct, on Android you should check if the locale has updated using `AppState` and `Expo.Localization.getLocalizationAsync()`. Initally the constants will be correct on both platforms, but on Android a user can change the language and return, more on this later.

#### `Localization.locale: string`

Native device language, returned in standard format. Ex: `en`, `en-US`, `es-US`.

#### `Localization.locales: Array<string>`

List of all the native languages provided by the user settings. These are returned in the order the user defines in their native settings.

#### `Localization.country: ?string`

Country code for your device.

#### `Localization.isoCurrencyCodes: ?Array<string>`

A list of all the supported ISO codes.

#### `Localization.timezone: string`

The current time zone in display format. ex: `America/Los_Angeles`

#### `Localization.isRTL: boolean`

This will return `true` if the current language is Right-to-Left.

### Methods

#### `Localization.getLocalizationAsync(): Promise<Localization>`

> Android only, on iOS changing the locale settings will cause all the apps to reset.

```js
type NativeEvent = {
  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  country: ?string,
  isRTL: boolean,
};
```

**Example**

```js
// When the app returns from the background on Android...

const { locale } = await Localization.getLocalizationAsync();
```
