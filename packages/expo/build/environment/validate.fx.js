import Constants from 'expo-constants'; // eslint-disable-line no-unused-expressions
import { 
// React Native's internal InitializeCore module sets up `window` but runs only when its React
// renderer is loaded. We can cause this by loading one of its dependents.
findNodeHandle, } from 'react-native';
import { shouldThrowAnErrorOutsideOfExpo } from './validatorState';
findNodeHandle; // eslint-disable-line no-unused-expressions
if (shouldThrowAnErrorOutsideOfExpo() && (!Constants || !Constants.expoVersion)) {
    throw new Error(`The Expo SDK requires Expo to run. It appears the native Expo modules are unavailable and this code is not running on Expo. Visit https://docs.expo.io to learn more about developing an Expo project.`);
}
//# sourceMappingURL=validate.fx.js.map