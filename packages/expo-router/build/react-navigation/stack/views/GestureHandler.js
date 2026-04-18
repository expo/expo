import * as React from 'react';
import { View } from 'react-native';
const Dummy = ({ children }) => <>{children}</>;
export const PanGestureHandler = Dummy;
export const GestureHandlerRootView = View;
export const GestureState = {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
};
//# sourceMappingURL=GestureHandler.js.map