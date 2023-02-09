import * as React from 'react';
import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';
const lightIcon = require('../../assets/user-icon-light.png');
const icon = require('../../assets/user-icon.png');
export function UserIcon(props) {
    const theme = useCurrentTheme();
    const themedIcon = theme === 'dark' ? lightIcon : icon;
    return React.createElement(Image, { source: themedIcon, ...props });
}
//# sourceMappingURL=UserIcon.js.map