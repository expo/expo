import 'react-native';
import '../Expo.fx';
import { Platform } from 'expo-modules-core';

jest.mock('react-native/Libraries/Core/Devtools/getDevServer', () => {
  return {
    __esModule: true,
    default() {
      return {
        url: 'http://localhost:8081/',
      };
    },
  };
});

if (Platform.OS === 'web') {
  it('provides a helpful error message on web', () => {
    // @ts-ignore
    expect(() => global.__fbBatchedBridgeConfig).toThrow(
      /Your web project is importing a module from 'react-native' instead of 'react-native-web'/
    );
  });
} else {
  it(`does not change the functionality of __fbBatchedBridgeConfig on native`, () => {
    // @ts-ignore
    expect(() => global.__fbBatchedBridgeConfig).not.toThrow();
  });
}
