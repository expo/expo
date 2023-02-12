import { View as NativeView, } from 'react-native';
import { createSafeStyledView } from '../css/createSafeStyledView';
import { createDevView } from './createDevView';
let View = NativeView;
if (process.env.NODE_ENV !== 'production') {
    // Add better errors and warnings in development builds.
    View = createDevView(NativeView);
}
export default createSafeStyledView(View);
//# sourceMappingURL=View.js.map