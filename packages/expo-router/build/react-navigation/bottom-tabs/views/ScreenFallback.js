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
    if (Screens?.screensEnabled?.()) {
        return <Screens.ScreenContainer enabled={enabled} {...rest}/>;
    }
    return <View {...rest}/>;
};
export function MaybeScreen({ enabled, active, ...rest }) {
    if (Screens?.screensEnabled?.()) {
        return <Screens.Screen enabled={enabled} activityState={active} {...rest}/>;
    }
    return <View {...rest}/>;
}
//# sourceMappingURL=ScreenFallback.js.map