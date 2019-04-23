# expo-firebase-firestore

> expo-firebase is still in RC and therefore subject to breaking changings. Be sure to run `yarn upgrade` and `cd ios; pod install` when upgrading.

`expo-firebase-firestore` provides a json based cloud data store that is synchronized in real-time.

[**Full documentation**](https://rnfirebase.io/docs/master/firestore/reference/firestore)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-firestore` or `yarn add expo-firebase-firestore`

### iOS

#### Cocoapods

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseFirestore', path: '../node_modules/expo-firebase-firestore/ios'
```

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-firestore'
    project(':expo-firebase-firestore').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-firestore/android')
    ```

    and if not already included

    ```gradle
    include ':unimodules-core'
    project(':unimodules-core').projectDir = new File(rootProject.projectDir, '../node_modules/@unimodules/core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    api project(':expo-firebase-firestore')
    ```
    and if not already included
    ```gradle
    api project(':unimodules-core')
    api project(':expo-firebase-app')
    ```
3.  Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

    ```java
    /*
    * At the top of the file.
    * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
    */
    import expo.modules.firebase.app.FirebaseAppPackage; // This should be here for all Expo Firebase features.
    import expo.modules.firebase.firestore.FirebaseFirestorePackage;

    // Later in the file...

    @Override
    public List<Package> expoPackages() {
      // Here you can add your own packages.
      return Arrays.<Package>asList(
        new FirebaseAppPackage(), // This should be here for all Expo Firebase features.
        new FirebaseFirestorePackage() // Include this.
      );
    }
    ```

## Usage

```javascript
import React from 'react';
import { Text, FlatList } from 'react-native';
import firebase from 'expo-firebase-app';

// API can be accessed with: firebase.firestore();

export default class WheatView extends React.Component {
  ref = firebase.firestore().collection('posts');
  state = { posts: [], loading: false };

  componentDidMount() {
    this.unsubscribe = this.ref.onSnapshot(this.onCollectionUpdate);
  }

  onCollectionUpdate = querySnapshot => {
    const posts = [];
    querySnapshot.forEach(doc => {
      const { title, complete } = doc.data();
      posts.push({
        key: doc.id,
        doc, // DocumentSnapshot
        title,
        complete,
      });
    });

    this.setState({
      posts,
      loading: false,
    });
  };

  componentWillUnmount() {
    this.unsubscribe();
  }

  renderItem = ({ item }) => <Text onPress={() => this.toggle(item)}>{item.title}</Text>;

  toggle = ({ doc, complete }) => {
    doc.ref.update({ complete: !complete });
  };

  post = ({ title }) => {
    this.ref.add({
      title,
      complete: false,
    });
  };

  render() {
    return <FlatList data={this.state.posts} renderItem={this.renderItem} />;
  }
}
```
