# expo-sharing

`expo-sharing` module

## Installation

Install the package from `npm` registry:

`yarn add expo-sharing` or `npm install expo-sharing`

<!-- Write about Expo dependencies for your module -->
Also, make sure that you have dependecies like [expo-core](https://github.com/expo/tree/master/packages/expo-core) installed.

#### iOS

Add the dependency to your `Podfile`:

```ruby
pod 'EXSharing', path: '../node_modules/expo-sharing/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

#### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-sharing'
    project(':expo-sharing').projectDir = new File(rootProject.projectDir, '../node_modules/expo-sharing/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-sharing')
    ```
3.  Add `new ExpoSharingPackage()` to your module registry provider in `MainApplication.java`.

## Usage

<!-- Describe prerequirements that need to be meet for your module to run properly -->
<!-- e.g. You must request permission to access the user's location before attempting to get it. To do this, you will want to use the [Permissions](https://github.com/expo/tree/master/packages/expo-permissions) API. You can see this in practice in the following example. -->

<!-- Provide some js example -->
```javascript
import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-filesystem';
import * as ExpoSharing from 'expo-sharing';

const REMOTE_IMAGE_PATH = '<PATH_TO_REMOTE_IMAGE>';
// TIP: one can use expo-asset module to get local file path
const LOCAL_IMAGE_PATH = '<PATH_TO_LOCAL_IMAGE>';

export default class App extends Component {
  componentDidMount() {
    doGreatJob();
  }

  _shareRemoteImage = async () => {
    const response = await FileSystem.downloadAsync(
      REMOTE_IMAGE_PATH,
      FileSystem.documentDirectory + 'target_file_path',
    );

    const { uri: imageUri } = response;

    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpg',
      });
    } catch (e) {
      console.error(e);
    }
  }

  _shareLocalImage = async () => {
    try {
      await Sharing.shareAsync(LOCAL_IMAGE_PATH, {
        mimeType: 'image/jpg', // Android only
        UTI: 'public.jpeg', // iOS only
      });
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Button
          onPress={this._shareRemoteImage}
          title="Share remote image"
          loading={this.state.loading}
        />
        <Button
          onPress={this._shareLocalImage}
          title="Share local image"
          loading={this.state.loading}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ecf0f1',
  },
});
```

## Methods

### `ExpoSharing.shareAsync(url, params)`

Opens action sheet to share file to different applications which can handle this type of file.

#### Arguments
-   **url (_string_)** --
    Local file url to share 
-   **params (_object_)** --

      A map of params:

    -   **mimeType (_string_)** -- Android only - sets mimeType for Intent.
    -   **UTI _(string_)** -- iOS only - The type of the target file - used to describe type of file.
    
        based on that properties different applications will show in share sheet.

