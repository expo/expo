import * as React from 'react';
import { View } from 'react-native';
let Screens;
try {
    Screens = require('react-native-screens');
}
catch (e) {
    // Ignore
}
export const MaybeScreenContainer = ({ enabled, ...rest }) => {
    if (Screens != null) {
        return <Screens.ScreenContainer enabled={enabled} {...rest}/>;
    }
    return <View {...rest}/>;
};
export const MaybeScreen = ({ enabled, active, ...rest }) => {
    if (Screens != null) {
        return <Screens.Screen enabled={enabled} activityState={active} {...rest}/>;
    }
    return <View {...rest}/>;
};
//# sourceMappingURL=Screens.js.map