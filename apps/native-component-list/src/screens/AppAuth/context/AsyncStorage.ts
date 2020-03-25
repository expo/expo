let AsyncStorage: any;

try {
  AsyncStorage = require('react-native').AsyncStorage;
} catch (_) {
  AsyncStorage = require('@react-native-community/async-storage').default;
}

export default AsyncStorage;
