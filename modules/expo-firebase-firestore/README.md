# expo-firebase-firestore

`expo-firebase-firestore` provides a json based cloud data store that is synchronized in real-time.

[**Full documentation**](https://rnfirebase.io/docs/master/firestore/reference/firestore)

## Installation

Now, you need to install the package from `npm` registry.

`npm install expo-firebase-firestore` or `yarn add expo-firebase-firestore`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXFirebaseFirestore', path: '../node_modules/expo-firebase-firestore/ios'
```

and run `pod install`.

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-firebase-firestore'
    project(':expo-firebase-firestore').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-firestore/android')
    ```

    and if not already included

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')

    include ':expo-firebase-app'
    project(':expo-firebase-app').projectDir = new File(rootProject.projectDir, '../node_modules/expo-firebase-app/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-firebase-firestore')
    ```
    and if not already included
    ```gradle
    compile project(':expo-core')
    compile project(':expo-firebase-app')
    ```
3.  [Now follow the setup instructions in the docs.](https://rnfirebase.io/docs/master/firestore/android)

## Usage

```javascript
import React from 'react';
import { Text, FlatList } from 'react-native';
import firebase from 'expo-firebase-app';
// Include the module before using it.
import 'expo-firebase-firestore';
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
