import * as React from 'react';
import { Image } from '../Image';
import { useCurrentTheme } from '../useExpoTheme';
const lightIcon = require('../../assets/three-finger-long-press-icon-light.png');
const icon = require('../../assets/three-finger-long-press-icon.png');
export function ThreeFingerPressIcon(props) {
    const theme = useCurrentTheme();
    const themedIcon = theme === 'dark' ? lightIcon : icon;
    return React.createElement(Image, { source: themedIcon, ...props });
}
//# sourceMappingURL=ThreeFingerPressIcon.js.map