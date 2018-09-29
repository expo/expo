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

#### iOS (no Cocoapods)

1.  In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`.
2.  Go to `node_modules` ➜ `expo-localization` ➜ `ios` and add `EXLocalization.xcodeproj`.
3.  In XCode, in the project navigator, select your project. Add `libEXLocalization.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`.
4.  Run your project (`Cmd+R`).

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
import { Button } from 'react-native';
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

i18n.locale = Localization.locale;
i18n.translations = { fr, en };

export default class LitView extends React.Component {
  render() {
    return (<Text>{i18n.t('foo')} {i18n.t('bar', { someValue: Date.now() })}</Text>);
  }
}
```

## API

### Constants

#### `Localization.country`

#### `Localization.isoCurrencyCodes`

#### `Localization.locale`

#### `Localization.locales`

#### `Localization.timezone`

### Methods

#### `Localization.addListener`

> Android only, changing the locale on iOS will cause the app to reset.

#### `Localization.removeListener`

> Android only, changing the locale on iOS will cause the app to reset.
