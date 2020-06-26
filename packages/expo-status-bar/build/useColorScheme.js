import { useColorScheme as maybeUseColorScheme } from 'react-native';
// TODO(brentvatne): add this warning back after releasing SDK 38.
//
// if (!maybeUseColorScheme) {
//   console.warn(
//     'expo-status-bar is only supported on Expo SDK >= 38 and React Native >= 0.62. You are seeing this message because useColorScheme from react-native is not available. Some features may not work as expected.'
//   );
// }
const fallbackUseColorScheme = () => 'light';
const useColorScheme = maybeUseColorScheme ?? fallbackUseColorScheme;
export default useColorScheme;
//# sourceMappingURL=useColorScheme.js.map