import * as React from 'react';
import { Image } from '../Image';
const activeIcon = require('../../assets/home-filled-active-icon.png');
const inactiveIcon = require('../../assets/home-filled-inactive-icon.png');
export function HomeFilledIcon(props) {
    const icon = props.focused ? activeIcon : inactiveIcon;
    return React.createElement(Image, { source: icon, ...props });
}
//# sourceMappingURL=HomeFilledIcon.js.map