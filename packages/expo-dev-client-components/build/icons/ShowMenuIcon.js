import * as React from 'react';
import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';
const lightIcon = require('../../assets/show-menu-at-launch-icon-light.png');
const icon = require('../../assets/show-menu-at-launch-icon.png');
export function ShowMenuIcon(props) {
    const theme = useCurrentTheme();
    const themedIcon = theme === 'dark' ? lightIcon : icon;
    return React.createElement(Image, { source: themedIcon, ...props });
}
//# sourceMappingURL=ShowMenuIcon.js.map