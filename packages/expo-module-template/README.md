# expo-module-template

`expo-module-template` module

## Installation

Install the package from `npm` registry:

`yarn add expo-module-template` or `npm install expo-module-template`

<!-- Write about Expo dependencies for your module -->
Also, make sure that you have dependecies like [expo-core](https://github.com/expo/tree/master/packages/expo-core) installed.

#### iOS

Add the dependency to your `Podfile`:

```ruby
pod 'EXModuleTemplate', path: '../node_modules/expo-module-template/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

#### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-module-template'
    project(':expo-module-template').projectDir = new File(rootProject.projectDir, '../node_modules/expo-module-template/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-module-template')
    ```
3.  Add `new ExpoModuleTemplatePackage()` to your module registry provider in `MainApplication.java`.

## Usage

<!-- Describe prerequirements that need to be meet for your module to run properly -->
<!-- e.g. You must request permission to access the user's location before attempting to get it. To do this, you will want to use the [Permissions](https://github.com/expo/tree/master/packages/expo-permissions) API. You can see this in practice in the following example. -->

<!-- Provide some js example -->
```javascript
import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Permissions from 'expo-permissions';
import * as ExpoModuleTemplate from 'expo-module-template';

export default class App extends Component {
  componentDidMount() {
    doGreatJob();
  }

  doGreatJob = async () => {
    await ExpoModuleTemplate.someGreatMethod();
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>'expo-module-template' example</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: 'center',
  },
});
```

## Methods

<!-- Provide methods description -->

### `ExpoModuleTemplate.someGreatMethod(options)`

Do some great work! :D

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **greatFlag (_boolean_)** -- Enable something great! Like even greater greatness! :D
    -   **greatNumber (_number_)** -- Remeber to provider great number! :D
    -   **greatString (_string_)** -- Do not forget about great string! :D

#### Returns

Returns something great! :D

-   **great (_object_)** -- The GREAT object! :D
    -   **great (_number_)** -- Great number!
    -   **greater (_string_)** -- Greater string!
    -   **greatest (_boolean_)** -- Thre greatest boolean! :D
