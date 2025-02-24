'use client';
import { withLayoutContext } from './withLayoutContext';
import { createNativeStackNavigator } from '../fork/native-stack/createNativeStackNavigator';
const NativeStackNavigator = createNativeStackNavigator().Navigator;
export const Stack = withLayoutContext(NativeStackNavigator);
export default Stack;
//# sourceMappingURL=StackClient.js.map