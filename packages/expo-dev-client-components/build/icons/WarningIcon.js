import * as React from 'react';
import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';
const lightIcon = require('../../assets/warning-triangle-icon-light.png');
const icon = require('../../assets/warning-triangle-icon.png');
export function WarningIcon(props) {
    const theme = useCurrentTheme();
    const themedIcon = theme === 'dark' ? lightIcon : icon;
    return React.createElement(Image, { source: themedIcon, ...props });
}
//# sourceMappingURL=WarningIcon.js.map