import Constants from 'expo-constants'; // eslint-disable-line @babel/no-unused-expressions
import { 
// React Native's internal InitializeCore module sets up `window` but runs only when its React
// renderer is loaded. We can cause this by loading one of its dependents.
findNodeHandle, } from 'react-native';
import { shouldThrowAnErrorOutsideOfExpo } from './validatorState';
findNodeHandle; // eslint-disable-line @babel/no-unused-expressions
if (shouldThrowAnErrorOutsideOfExpo() && (!Constants || !Constants.expoVersion)) {
    throw new Error(`Expo native runtime is not available: something went wrong and we aren't sure what it was. Please post more information and get support at https://forums.expo.io.`);
}
//# sourceMappingURL=validate.fx.js.map