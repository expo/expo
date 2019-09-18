# React Native Async Storage

An asynchronous, unencrypted, persistent, key-value storage system for React Native.


## Getting Started


### Install

```
$ yarn add @react-native-community/async-storage
```

### Link

- **React Native 0.60+**


[CLI autolink feature](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md) links the module while building the app. 


- **React Native <= 0.59**


```bash
$ react-native link @react-native-community/async-storage
```


*Note* For `iOS` using `cocoapods`, run:

```bash
$ cd ios/ && pod install
```

See docs for [manual linking guide](docs/Linking.md)

### **Upgrading to React Native *0.60+*** 
 
New React Native comes with `autolinking` feature, which automatically links Native Modules in your project.
In order to get it to work, make sure you `unlink` `Async Storage` first:

```bash
$ react-native unlink @react-native-community/async-storage
```


## Usage

### Import

```js
import AsyncStorage from '@react-native-community/async-storage';
```

### Store data
```jsx

storeData = async () => {
  try {
    await AsyncStorage.setItem('@storage_Key', 'stored value')
  } catch (e) {
    // saving error
  }
}

```

### Read data
```jsx

getData = async () => {
  try {
    const value = await AsyncStorage.getItem('@storage_Key')
    if(value !== null) {
      // value previously stored
    }
  } catch(e) {
    // error reading value
  }
}

```
### Advanced
See docs for [api and more examples](docs/API.md) or [advanced usages](docs/advanced).

## Writing tests

Using [Jest](https://jestjs.io/) for testing? Make sure to check out [docs on how to integrate it with this module.](./docs/Jest-integration.md)

## Contribution

See the [CONTRIBUTING](CONTRIBUTING.md) file for how to help out.

## License

MIT
