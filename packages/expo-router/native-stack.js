const createNativeStackNavigator = require('./build/fork/native-stack/createNativeStackNavigator');
const NativeStackView = require('./build/fork/native-stack/NativeStackView');

module.exports = {
  ...createNativeStackNavigator,
  ...NativeStackView,
};
