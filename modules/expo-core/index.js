let PlatformAdapter = null;

try {
  PlatformAdapter = require('expo-react-native-adapter');
} catch (e) {
  // Here we could check for existence of Flutter adapter
  console.error(e, 'expo-react-native-adapter has not been found');
}

module.exports = PlatformAdapter;
