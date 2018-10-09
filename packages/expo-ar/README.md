# expo-ar

`expo-ar` module allows

## Installation

*If your app is running in [Expo](https://expo.io) then everything is already set up for you, just `import { AR } from 'expo';`*

Otherwise, you need to install the package from `npm` registry.

`yarn add expo-ar` or `npm install expo-ar`

Also, make sure that you have [expo-core](https://github.com/expo/expo-core), [expo-constants](https://github.com/expo/expo-constants) and [expo-permissions](https://github.com/expo/expo-permissions) installed, as they are required by `expo-ar` to work properly.

### iOS (Cocoapods)

Add the dependency to your `Podfile`:

```ruby
pod 'EXAR', path: '../node_modules/expo-ar/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-ar'
    project(':expo-ar').projectDir = new File(rootProject.projectDir, '../node_modules/expo-ar/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-ar')
    ```
3.  Add `new ARPackage()` to your module registry provider in `MainApplication.java`.

## Usage

Some prerequiremnets, eg. `expo-permissions`

```typescript
import * as React from 'react';
import {  } from 'react-native';
import { AR } from 'expo-ar';

export default class ARExample extends React.Component {
  render() {
    return (
      null
    );
  }
}
```

## Props

## Methods

### `Expo.AR.example(ARParams)`

Does ARing

#### Arguments

-   **ARParams (_string_)** -- AR params.
> Note: AR only iOS currently.

#### Returns

Promise of ARing
