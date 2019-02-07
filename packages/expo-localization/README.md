# expo-localization

> Supports: iOS, Android, Web

`expo-localization` provides an interface for native user localization information. You can create full **i18n** integration in your cross-platform experience.

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

Import the library like so:

```js
import * as Localization from 'expo-localization';
```

This library was designed to work well with popular localization libraries like `i18n-js`.

```ts
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

export default class ExampleView extends React.Component {
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

This API is mostly synchronous and driven by constants. On iOS the constants will always be correct, on Android you should check if the locale has updated using `AppState` and `Localization.getLocalizationAsync()`. Initally the constants will be correct on both platforms, but on Android a user can change the language and return, more on this later.

### Constants

| Name             | Type       | Description                                                                                                                                  | iOS | Android | Web |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------- | --- |
| locale           | `string`   | Native device language, returned in standard format. Ex: `en`, `en-US`, `es-US`.                                                             | ✅  | ✅      | ✅  |
| locales          | `string[]` | List of all the native languages provided by the user settings. These are sorted in the order the user has defined in their native settings. | ✅  | ✅      | ✅  |
| country          | `string?`  | Country code for your device.                                                                                                                | ✅  | ✅      | ✅  |
| timezone         | `string`   | The current time zone in display format. ex: `America/Los_Angeles`. Read more about web usage below.                                         | ✅  | ✅      | ✅  |
| isRTL            | `boolean`  | This will return `true` if the current language is Right-to-Left.                                                                            | ✅  | ✅      | ✅  |
| isoCurrencyCodes | `string[]` | A list of all the supported ISO codes.                                                                                                       | ✅  | ✅      | ❌  |

**Web Timezone**

On web we will attempt to get the timezone with the standard `Intl` API but if the time zone cannot be found, the default value `Etc/UTC` will be returned. For more accurate results you could use the library `moment/timezone`. Because [`moment.js` is so large](https://github.com/moment/moment/issues/3376) we don't include it.

```js
import { timezone } from 'expo-localization';
import moment from 'moment';
import 'moment-timezone';

const expensiveTimezone = moment.tz.guess();

const cheapTimezone = timezone;
```

### Methods

#### `getLocalizationAsync()`

```js
Localization.getLocalizationAsync(): Promise<Localization>
```

Refresh and return the localization data with any user defined changes.

**Support**

| iOS | Android | Web |
| --- | ------- | --- |
| ❌  | ✅      | ✅  |

> On iOS the phone will reset if a user changes the locale in their native settings.

**Returns**

| Name         | Type           | Description                                |
| ------------ | -------------- | ------------------------------------------ |
| localization | `Localization` | All of the user defined localization data. |

**Example**

```js
const { locale } = await Localization.getLocalizationAsync();
```

### Types

#### Localization

```ts
import { Localization } from 'expo-localization';
```

| Name             | Type       | Description                                                                                                                                  | iOS | Android | Web |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------- | --- |
| locale           | `string`   | Native device language, returned in standard format. Ex: `en`, `en-US`, `es-US`.                                                             | ✅  | ✅      | ✅  |
| locales          | `string[]` | List of all the native languages provided by the user settings. These are sorted in the order the user has defined in their native settings. | ✅  | ✅      | ✅  |
| country          | `string?`  | Country code for your device.                                                                                                                | ✅  | ✅      | ✅  |
| timezone         | `string`   | The current time zone in display format. ex: `America/Los_Angeles`. Read more about web usage below.                                         | ✅  | ✅      | ✅  |
| isRTL            | `boolean`  | This will return `true` if the current language is Right-to-Left.                                                                            | ✅  | ✅      | ✅  |
| isoCurrencyCodes | `string[]` | A list of all the supported ISO codes.                                                                                                       | ✅  | ✅      | ❌  |
