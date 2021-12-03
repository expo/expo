import * as React from 'react';
import { Image } from '../Image';
const activeIcon = require('../../assets/settings-filled-active-icon.png');
const inactiveIcon = require('../../assets/settings-filled-inactive-icon.png');
export function SettingsFilledIcon(props) {
    const icon = props.focused ? activeIcon : inactiveIcon;
    return React.createElement(Image, { source: icon, ...props });
}
//# sourceMappingURL=SettingsFilledIcon.js.map