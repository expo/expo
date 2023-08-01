import { createNativeStackNavigator, } from '@react-navigation/native-stack';
import { withLayoutContext } from './withLayoutContext';
const NativeStackNavigator = createNativeStackNavigator().Navigator;
export const Stack = withLayoutContext(NativeStackNavigator);
export default Stack;
//# sourceMappingURL=Stack.js.map